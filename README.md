# GlazeWave

> A full-stack surfing analytics platform — track sessions, boards, and locations; gain insights from wave data, swell conditions, and session history.

Built with Node/Express, React/Redux, MySQL/Sequelize, Elasticsearch, AWS Cognito, and S3. Deployed on a single AWS EC2 instance with Nginx, provisioned by Terraform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Redux, TypeScript, TailwindCSS |
| **Backend** | Node.js, Express |
| **Database** | MySQL with Sequelize ORM |
| **Search** | Elasticsearch (faceted search, session indexing) |
| **Auth** | AWS Cognito (JWT-based, JWK verification) |
| **Storage** | AWS S3 (image uploads via multer-sharp-s3) |
| **Queue** | better-queue (batched ES sync) |
| **External APIs** | Google Places (geolocation), Stormglass (wave forecasts), Surfline (spot data) |
| **DevOps** | Terraform, Docker, Nginx, systemd, AWS EC2 + Route 53 + Let's Encrypt |

---

## Architecture

### Backend — MSC Pattern

The API uses a **Model-Service-Controller** pattern where Controllers never communicate directly with Models. Instead, an intermediary Service layer handles all data operations.

```
Request → QueryParser middleware → Controller → Service → Model
                                         ↓
                                    BaseService (CRUD)
```

**Controllers** are intentionally thin — they parse the request, call the appropriate Service, and return the response. All data logic lives in Services.

**Services** extend `BaseService`, which provides reusable CRUD methods (`all`, `where`, `find`, `create`, `update`, `delete`, `upsert`). Each Service binds to a primary Model but can work with any other Model or Service as needed.

**QueryParser middleware** parses incoming query params into a structured `req.parser` object — `wheres`, `withs` (relation includes), `limit`, `page`, `order_by`, `where_in`. Supports nested relation loading via dot notation (e.g., `patients.metrics`).

### Frontend — Redux API Middleware

All API calls flow through a single middleware (`frontend/src/middleware/api.js`) that:
- Sets loading state via Redux labels
- Attaches the Cognito JWT bearer token
- Handles 401s with automatic token refresh
- Dispatches success/failure actions to the appropriate reducer

Requests are built by extending `BaseRequest` and setting an endpoint — CRUD methods come for free.

### Elasticsearch Integration

Elasticsearch is used for search and aggregation, not as a primary data store. The sync strategy:

1. Sequelize model hooks (`afterCreate`, `afterUpdate`, `afterDestroy`) fire on every CRUD operation
2. Changed records are pushed to a `better-queue` batch queue
3. The queue batches inserts/updates to the ES index at configurable intervals
4. Search returns IDs from ES; the backend hydrates full objects from MySQL

This keeps the ES index fresh without coupling the read path to search infrastructure.

### Auth — AWS Cognito

JWT-based authentication with full JWK verification:
- Downloads JWKS from Cognito on startup
- Verifies token signatures, `token_use`, `client_id`, and expiry
- Does not leak error details to the caller
- Protected routes use the `cognitoAuthMiddleware`

---

## Features

- **Session Tracking** — log surfing sessions with board, location, rating, conditions, and photos
- **Board Management** — track boards by manufacturer, model, and rating
- **Location Discovery** — Google Places integration for spot lookup; Surfline spot data for nearest-beach matching
- **Wave Forecasts** — Stormglass API for real-time wave conditions based on nearest surf spot geolocation
- **Image Uploads** — S3-backed with automatic resize via multer-sharp-s3
- **Search** — Elasticsearch-powered faceted search across sessions, boards, and locations
- **Auth** — AWS Cognito with admin-created users and group-based access

---

## Getting Started

### Prerequisites

- Node.js (v18+; v22 is what production runs)
- MySQL
- Elasticsearch 7.x (7.17 in production)
- AWS account with Cognito and S3 access

### Setup

```bash
# Clone
git clone https://github.com/rbmowatt/glazewave.git
cd glazewave

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### Environment

Copy `.env.tmp` to `.env` in both `frontend/` and `backend/` and configure:

**Backend (.env):**
- `MYSQL_UNAME`, `MYSQL_PWD`, `MYSQL_DB`, `MYSQL_HOST`, `MYSQL_PORT`
- `ELASTIC_SEARCH_HOST`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- `AWS_COGNITO_USER_POOL`, `AWS_COGNITO_CLIENT_ID`, `AWS_DEFAULT_REGION`
- `GOOGLE_MAPS_KEY`
- `SERVER_PORT`

**Frontend (.env):**
- `REACT_APP_API_HOST`
- `REACT_APP_AWS_COGNITO_*` credentials

### AWS Setup

**S3:**
- Create a bucket and make it public for image reads

**Cognito:**
- Create a user pool
- Under attributes: check `family_name`, `given_name`, `email`
- Only allow administrators to create users
- Create a client (do not check "Generate client secret")
- Configure client: Cognito User Pool, signin/signout URLs, Authorization code grant + Implicit grant, all OAuth scopes
- Create a user for yourself and a group named `Admins`

### Running Locally

```bash
# Terminal 1 — Backend
cd backend && npm run start

# Terminal 2 — Frontend
cd frontend && npm run start
```

### Syncing Elasticsearch

```bash
cd backend
npm run sync-elastic
```

---

## Deployment (AWS)

Infrastructure is Terraform, under `infra/`. It provisions a VPC with a single
public subnet, a `t4g.small` running Amazon Linux 2023, an Elastic IP, Route 53
records, an S3 uploads bucket, and a Cognito user pool.

There is deliberately **no load balancer**. One instance behind an ALB costs more
in ALB hours than the instance itself, so nginx terminates TLS directly with a
Let's Encrypt certificate. AWS Certificate Manager is not used, because ACM certs
can only be attached to an ALB or CloudFront.

```bash
cd infra
./bootstrap-state-bucket.sh
terraform init
terraform apply
terraform output
```

The instance runs MySQL 8, Elasticsearch 7.17, nginx and the Node API together on
2GB of RAM. That works only with the ES heap capped at 512MB, MySQL's
`performance_schema` off, and 2GB of swap (provisioned by the instance user_data).

The API runs as a systemd unit rather than under PM2 — systemd is already present,
handles restart and boot-start, and logs to journald.

**The frontend is built locally, not on the server.** The production build peaks
around 4.6GB of memory, which the instance cannot supply. `frontend/build` is
committed and deployed by `git pull`. `react-scripts` 3.4.1 also needs
`NODE_OPTIONS=--openssl-legacy-provider` on Node 17 or newer:

```bash
cd frontend
NODE_OPTIONS=--openssl-legacy-provider npx react-scripts build
```

Elasticsearch indexes are created by `elastic/create-indexes.sh`, which reads the
index names from `backend/.env`.

Terraform sets `prevent_destroy` on the instance, Elastic IP, uploads bucket and
Cognito pool, so `terraform destroy` fails until those lines are removed.

---

## Project Structure

```
glazewave/
├── backend/
│   ├── app/
│   │   ├── models/          # Sequelize models with ES sync hooks
│   │   ├── services/        # Business logic (BaseService + extensions)
│   │   ├── routes/          # Express route handlers (thin controllers)
│   │   ├── middleware/      # QueryParser, auth
│   │   ├── lib/             # Cognito JWT verification
│   │   ├── config/          # Environment-driven configs
│   │   └── scripts/        # ES/Algolia sync scripts, data imports
│   ├── bin/                 # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (session, board, reports, user)
│   │   ├── reducers/        # Redux reducers
│   │   ├── requests/        # BaseRequest + API request classes
│   │   ├── middleware/      # Redux API middleware (auth, loading, dispatch)
│   │   ├── lib/utils/       # Cognito, geolocation, cache, token storage
│   │   └── config/          # API, S3, Cognito, Google configs
│   └── package.json
├── elastic/
│   └── indexes/             # ES index mappings and settings
├── docker/
│   └── docker-compose.yml   # MySQL + ES for local dev
└── README.md
```

---

## Known Issues & TODOs

- [ ] Clean up how session data is stored and retrieved
- [ ] Improve responsive CSS/layout
- [ ] Add structured logging (replace console statements)
- [ ] Implement backend ACL (currently Cognito auth only, no role-based access)

---

## License

Personal project — not currently licensed for public use.
