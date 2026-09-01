# GlazeWave

> A full-stack surfing analytics platform — track sessions, boards, and locations; gain insights from wave data, swell conditions, and session history.

Built with Node/Express, React/Redux, MySQL/Sequelize, Elasticsearch, AWS Cognito, and S3. Deployed on AWS EC2 behind an ALB with Nginx.

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
| **DevOps** | Docker, Nginx, PM2, AWS EC2 + ALB + Certificate Manager |

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

- Node.js (v10+)
- MySQL
- Elasticsearch (v7+)
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

## Deployment (AWS EC2)

1. **Domain + SSL** — Register domain, add HTTPS via AWS Certificate Manager
2. **Load Balancer** — Create ALB, attach certificate, add listener on 443 forwarding to 80
3. **EC2 Instance** — Amazon Linux, mount volume at `/data`
4. **Nginx** — Install, configure to serve `frontend/build` and proxy API to backend
5. **Node** — Install via nodesource, use PM2 to keep the backend running
6. **Deploy** — Clone repo, install dependencies, add `.env` files, start Nginx + PM2

```bash
sudo yum update
sudo amazon-linux-extras install nginx1
curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum install -y nodejs git
npm install pm2 -g nodemon -g
cd /data/var/www && git clone https://github.com/rbmowatt/glazewave.git .
cd frontend && npm install
cd ../backend && npm install
sudo service nginx start
sudo pm2 run start
```

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
