# GlazeWave

> A full-stack surfing analytics platform — track sessions, boards, and locations; gain insights from wave data, swell conditions, and session history.

Built with Node/Express, React/Redux, MySQL/Sequelize, Elasticsearch, AWS Cognito, and S3. Deployed on a single AWS EC2 instance with Nginx, provisioned by Terraform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Redux, Create React App 3.4.1 (TypeScript is CRA scaffolding only — components are `.js`) |
| **Backend** | Node.js, Express |
| **Database** | MySQL with Sequelize ORM |
| **Search** | Elasticsearch 7.17 + `@appbaseio/reactivesearch` against a scoped backend proxy |
| **Auth** | AWS Cognito (JWT-based, JWK verification) |
| **Storage** | AWS S3 (image uploads via multer-sharp-s3) |
| **Queue** | better-queue (batched ES sync) |
| **External APIs** | Google Places v1 (location lookup), Open-Meteo forecast/marine/archive (conditions), Overpass/OSM + GSHHG (spot seed) |
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

**QueryParser middleware** parses incoming query params into a structured `req.parser` object — `wheres`, `withs` (relation includes), `limit`, `page`, `order_by`, `where_in`. Relations are requested by Sequelize model name and nest with dot notation: `with[]=UserBoard.UserBoardImage`, `with[]=Board.Manufacturer`.

Each model that can ride along as a relation has an allowlist of the columns it may expose, applied at every nesting depth. Public boards are why that exists — without it the first `with[]=User` would have handed the user record to every visitor.

It also dumps every unreserved query param into `req.parser.wheres`, so a route that takes its own params — `/api/spot/nearest?lat=&lon=` — must read `req.query` directly, or those params reach Sequelize as a where clause.

### Frontend — Redux API Middleware

All API calls flow through a single middleware (`frontend/src/middleware/api.js`) that:
- Sets loading state via Redux labels
- Attaches the Cognito JWT bearer token
- Handles 401s with automatic token refresh
- Dispatches success/failure actions to the appropriate reducer

Requests are built by extending `BaseRequest` and setting an endpoint — CRUD methods come for free.

### Elasticsearch Integration

Elasticsearch is used for search and aggregation, not as a primary data store. There are two indexes, `sessions` and `user_boards`. The sync strategy:

1. Sequelize model hooks (`afterCreate`, `afterUpdate`, `afterDestroy`) fire on every CRUD operation
2. Changed records are pushed to a `better-queue` batch queue
3. The queue builds a denormalized projection per record and writes it to the index

The projections live in one place, `app/services/elastic/projections.js`, and both the queue and `backfill_elastic.js` run the same SQL. They used to be copy-pasted into both files, which is how the sessions mapping ended up missing a field the query had always selected.

Because the documents are denormalized, **search results are served from Elasticsearch directly — there is no hydration step back through MySQL.** The frontend's ReactiveSearch components talk to `/api/es/:index/_search` and `_msearch`, a backend proxy that injects a `user_id` filter into every query so a client cannot widen its own scope, and caps the number of searches per `_msearch` body.

Aggregations are separate: `UserService.getUserAverages` runs its own `aggs` query for the per-user condition averages and rating trend. The aggregated fields are mapped `float` explicitly — dynamic mapping can infer `string` from the first document and break the aggregation permanently.

### Auth — AWS Cognito

JWT-based authentication with full JWK verification:
- Downloads JWKS from Cognito once at module load; every request awaits that promise
- Verifies token signatures, `token_use`, `client_id`, and expiry
- Does not leak error details to the caller
- Protected routes apply `cognitoAuth.getVerifyMiddleware()` per route rather than to a whole router, so public reads (e.g. `/api/spot/nearest`) stay open
- When demo login is enabled, a locally signed RS256 public key is merged into the same `pems` map rather than bypassing the middleware

---

## Features

- **Session Tracking** — log surfing sessions with board, location, rating, conditions, and photos
- **Board Management** — track boards by manufacturer, model, shaper, and rating
- **Location Discovery** — Google Places for freeform location lookup; a seeded spot table for nearest-beach matching
- **Conditions** — Open-Meteo forecast, marine and archive endpoints, resolved to the session's own date and coordinates so a backdated session gets the conditions from when it actually happened
- **Image Uploads** — S3-backed with automatic resize via multer-sharp-s3
- **Search** — Elasticsearch-powered faceted search across sessions and boards
- **Auth** — AWS Cognito with admin-created users and group-based access

---

## Spot data and attribution

Spots are **seeded, not scraped**, and the table is contributable.

Surfline's API is closed (`services.surfline.com/kbyg/*` returns 403 unauthenticated from residential and datacenter addresses alike). `import_surfline.js` and `npm run sync-surfline` remain in the tree but are parked, not live.

Surf breaks alone cannot back the feature either: OSM `sport=surfing` is roughly 1,200 features worldwide — 15 in all of southern California, 2 in all of New Jersey — plus 37 surf spots in Wikidata, and the data is heavily Europe-weighted. So the seed is **named ocean beaches**, which are mapped densely and carry real coordinates, and real coverage has to come from the people who surf each place.

```bash
cd backend
npm run spots:seed-file            # all regions, writes data/surfline_spots.json
npm run spots:seed-file US-NJ      # one region
npm run spots:seed-file -- --report US-NJ   # per-feature scores, writes nothing
npm run spots:probe                # re-test every candidate source
```

`build_spot_seed.js` takes named features from Overpass (one query per US and Mexican coastal state) and the shoreline from GSHHG, then applies two geometric filters: the feature must sit within `COAST_MAX_M` of the ocean shoreline, and from a probe point `OFFSHORE_M` seaward at least `OPEN_BINS_MIN` of a 72-bearing sweep must reach `HORIZON_M` without crossing land. That second test is what separates open ocean from enclosed water by measurement rather than by the name of the water body — Monterey Bay survives it, Barnegat Bay and La Paz do not. The current seed is **1,611 spots**.

The script is dependency-free so it runs from a bare checkout. The GSHHG download and every Overpass response cache under `~/.cache/glazewave` (`GLAZEWAVE_CACHE` overrides; deliberately not `$TMPDIR`, which macOS purges). `--budget=<seconds>` exits cleanly with code 3 for shells that cap run time — responses are cached before the next is requested, so a rerun resumes.

### Provenance

`surfline_spots` carries a `source` column (`osm | wikidata | user | legacy`, indexed) alongside `created_by`, `is_public`, and the atlas fields `break_type`, `wave_direction`, `bottom`, `difficulty`, `hazards`, `notes`. The STRING primary key carries provenance without a join, as `<source>:<native id>`:

```
osm:way/1036392284
wd:Q7644300
user:<uuid>
```

`POST /api/spot` writes `user:<uuid>` with `source = 'user'` and returns 409 with the matching row when a spot already exists. The seeder only updates rows whose source it owns, so contributed spots survive a reseed. Rows predating the column were backfilled to `legacy`.

This is what makes the licensing tractable: attribution is scoped to the rows that actually need it, and it can be retired when none remain.

### Attribution

`frontend/src/components/layout/Attribution.js` renders the required credit and is a licence obligation, not decoration:

- Spot rows come from **OpenStreetMap contributors** under **ODbL**
- Conditions come from **Open-Meteo** under **CC BY 4.0**

GSHHG (LGPL) is used as a build-time filter only; no GSHHG geometry is written into the seed.

Field names are not protected, but the data behind them has to be OSM, Wikidata or contributed — never copied from a proprietary atlas. Google Places is not an alternative source here: its terms forbid persisting place data and forbid using it to build a competing database.

---

## Getting Started

### Prerequisites

- Node.js (v18+; v22 is what production runs)
- MySQL 8
- Elasticsearch 7.x (7.17 in production)
- AWS account with Cognito and S3 access

### Setup

```bash
git clone https://github.com/rbmowatt/glazewave.git
cd glazewave

cd frontend && npm install

cd ../backend && npm install
```

> **The backend install currently fails on darwin-arm64.** `sharp` is pinned to 0.30.7 through the abandoned `multer-sharp-s3@0.2.5`, which ships no darwin-arm64 libvips prebuild, so the install falls through to a source build and dies. npm rolls it back cleanly, but there is no local backend until that dependency is replaced. Do not "fix" it by downgrading sharp — 0.30.7 is what gives production a compile-free install on linux-arm64.

### Environment

Copy `.env.tmp` to `.env` in both `frontend/` and `backend/` and configure:

**Backend (.env):**
- `MYSQL_UNAME`, `MYSQL_PWD`, `MYSQL_DB`, `MYSQL_HOST`, `MYSQL_PORT`
- `ELASTIC_SEARCH_HOST`, `ELASTIC_SESSIONS_INDEX`, `ELASTIC_USER_BOARDS_INDEX`
- `AWS_S3_BUCKET`, `AWS_S3_ROOT`, `AWS_DEFAULT_REGION` (access keys only off EC2 — in production the instance profile supplies credentials and `app/config/s3.js` sets none on purpose)
- `AWS_COGNITO_USER_POOL`, `AWS_COGNITO_CLIENT_ID`
- `GOOGLE_MAPS_KEY`
- `OPEN_METEO_FORECAST_ENDPOINT`, `OPEN_METEO_MARINE_ENDPOINT`, `OPEN_METEO_ARCHIVE_ENDPOINT`
- `API_HOST`, `CLIENT_URL`, `SERVER_PORT`
- `DEMO_*` — see the comments in `backend/.env.tmp`; both JWT keys are base64 of a PEM on one line, because dotenv only keeps a multi-line value when it is double-quoted and a systemd `EnvironmentFile` drops the newlines outright

**Frontend (.env):**
- `REACT_APP_API_HOST`, `REACT_APP_API_BASE`, `REACT_APP_API_PORT`
- `REACT_APP_AWS_COGNITO_*` credentials
- `REACT_APP_GOOGLE_API_KEY`
- `REACT_APP_DEMO_PUBLIC`

Every `REACT_APP_*` value is inlined at build time, so changing one means a rebuild, not an env edit. A missing one inlines as `undefined` and fails at call time rather than at boot — the page renders and the widget just stays silently empty.

### AWS Setup

**S3:**
- Create a bucket. It will be `BucketOwnerEnforced`, so public read comes from a bucket policy, not from ACLs — see `infra/storage.tf`. Any `x-amz-acl` header returns 400 `AccessControlListNotSupported`.

**Cognito:**
- Create a user pool
- Under attributes: check `family_name`, `given_name`, `email`
- Only allow administrators to create users
- Create a client (do not check "Generate client secret")
- Configure client: Cognito User Pool, signin/signout URLs, Authorization code grant + Implicit grant, all OAuth scopes
- Create a user for yourself and a group named `Admins`

### Running Locally

Only the datastores are containerized. `docker/docker-compose.yml` runs MySQL 8, Elasticsearch 7.17 and Kibana; the API and the frontend run on the host.

```bash
cd docker && docker compose up -d
```

**MySQL is published on host port 33062, not 3306**, so `backend/.env` needs `MYSQL_PORT=33062`.

```bash
cd backend && npm run start

cd frontend && npm run start
```

`frontend npm run start` is **not** `react-scripts start`. It runs `react-amazing-proxy`, and `frontend/proxy-settings.js` points it at `./../backend/app/index` — it loads the backend in-process and serves the joint app on :3000, hiding react-dev-server on :3456. So the frontend dev server needs `backend/node_modules` too.

### Creating and populating the Elasticsearch indexes

Index creation belongs to `elastic/create-indexes.sh`, which reads the index names from `backend/.env` and the canonical mappings from `elastic/indexes/*.json`. Those mappings set `number_of_replicas: 0` — a single node cannot allocate a replica, so any other value leaves the cluster yellow forever.

To reindex into indexes that already exist:

```bash
cd backend
npm run backfill-elastic              # both indexes
node app/scripts/backfill_elastic.js sessions
```

> `npm run sync-elastic` is **not** the reindex command. It recreates the indexes from a second, stale copy of the mappings under `app/scripts/elastic/`, which omits `number_of_replicas: 0`. Use `create-indexes.sh` plus `backfill-elastic` instead.

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
Headroom is thin enough that anything compiling native code will OOM.

The API runs as a systemd unit rather than under PM2 — systemd is already present,
handles restart and boot-start, and logs to journald. The unit's `WorkingDirectory`
must be `backend/`, because dotenv resolves `.env` against the process CWD.

`NODE_ENV=production` is set on the unit, so Express's `finalhandler` replaces real
error messages with the bare status phrase. A browser showing `<pre>Bad Request</pre>`
tells you nothing — the actual error is only in `journalctl -u glazewave-api`.

**The frontend is built locally, not on the server.** The production build peaks
around 4.6GB of memory, which the instance cannot supply. `frontend/build` is
committed and deployed by `git pull`. `react-scripts` 3.4.1 also needs
`NODE_OPTIONS=--openssl-legacy-provider` on Node 17 or newer:

```bash
cd frontend
NODE_OPTIONS=--openssl-legacy-provider npx react-scripts build
```

Express builds its route table once at boot, so a `git pull` without a restart keeps
serving the old router and a new endpoint returns Express's own `Cannot GET` page —
which looks identical to a route that never got merged.

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
│   │   ├── lib/             # Cognito JWT verification, demo token
│   │   ├── config/          # Environment-driven configs
│   │   ├── migrations/      # Sequelize migrations
│   │   └── scripts/         # ES sync/backfill, spot seed, board and demo imports
│   ├── data/                # Generated spot seed (surfline_spots.json)
│   ├── bin/                 # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (session, board, reports, user, layout)
│   │   ├── reducers/        # Redux reducers
│   │   ├── requests/        # BaseRequest + API request classes
│   │   ├── middleware/      # Redux API middleware (auth, loading, dispatch)
│   │   ├── lib/utils/       # Cognito, geolocation, cache, token storage
│   │   └── config/          # API, S3, Cognito, Google configs
│   └── package.json
├── elastic/
│   └── indexes/             # ES index mappings and settings
├── infra/                   # Terraform
├── docker/
│   └── docker-compose.yml   # MySQL + ES + Kibana for local dev
└── README.md
```

---

## Known Issues & TODOs

- [ ] No database backups — highest-value outstanding task
- [ ] Backend will not install on darwin-arm64; needs `multer-sharp-s3` replaced (which also pins `aws-sdk` v2)
- [ ] Clean up how session data is stored and retrieved
- [ ] Improve responsive CSS/layout
- [ ] Add structured logging (replace console statements)
- [ ] Implement backend ACL (currently Cognito auth only, no role-based access)
- [ ] `surfline_spots.geo` GEOMETRY holds inverted coordinates from the parked Surfline import; nothing reads it, and fixing the import plus a backfill comes before anything does
- [ ] Open-Meteo marine returns nulls for La Paz — the model has no coverage at that point, so `swell_period` and `wave_period` come back null with heights at 0.0

---

## License

Personal project — not currently licensed for public use.
