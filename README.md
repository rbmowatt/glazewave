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

### Conditions, and borrowed readings

`app/services/conditions/index.js` resolves the seven condition values from
Open-Meteo for a point and a UTC hour. When the point's own marine cell has no
wave data it borrows the nearest seeded spot within `FALLBACK_RADIUS_M` and
answers from there instead.

Blankness is judged on the four wave fields alone. Sea surface temperature comes
off a different grid, so a cell can carry one without the other — La Paz bay
returns 89.8F with all four wave fields null, and counting that temperature as
data kept the fallback from ever firing at the one place it was written for.

A borrowed reading is **labelled, not disguised**. `borrowed_m` rides on the
`/api/sc` payload and is stored on `session_data`, so a session logged at a
bayside beach shows "nearest reading, 42.7 km away" rather than passing another
beach's swell off as its own. The distance is served rather than computed
client-side, because `/api/spot/nearest` reorders by OSRM road distance once it
has a ranking for the origin: the same La Paz-to-Tecolote pair is 42.7km of
ocean and 65.1km of driving, and two panels showing different numbers for one
pair reads as a bug. `RoadDistance.js` refuses to mix road and straight-line
metres inside one response for the same reason.

`FALLBACK_RADIUS_M` and the create-session chip radius are both 100km. They were
25km, written for the density of the Jersey coast, and both went silent in La
Paz where the nearest seeded spot is 44km away. Baja spacing is the calibration
case now, not New Jersey.

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
- **Report location pin** — the dashboard normally reports on the browser's own position; a pin overrides it so you can look at another coast, and the create-session form follows the pin rather than the machine
- **Conditions** — Open-Meteo forecast, marine and archive endpoints, resolved to the session's own date and coordinates so a backdated session gets the conditions from when it actually happened, and labelled when the reading had to be borrowed from a nearby spot
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

### Capturing spots from places people pick

The seed has holes it cannot close on its own. Long Beach Island, an entire
barrier island of real breaks, has **no seeded spot at all** — from Harvey Cedars
the nearest is Chadwick Beach, 33km by air and 64km by road — because OSM does
not name those beaches. So a place picked in the location field becomes a spot
the first time a session is logged at it.

`LocationService.promote()` runs inside `resolve()`, which every session save
already awaits. A Google place that clears the coastal check below is written to
`surfline_spots` with `source = 'user'` and `created_by`, and from then on it
answers `/api/spot/nearest` and the search for everybody. Promotion is
idempotent, silent on failure and never blocks a session save.

**The gate is not optional.** Without it, one session logged at a home address
puts that address in front of every user, permanently, on the first use.

### The coastal check

`app/services/Coastline.js` answers whether a point sits on land that touches
open ocean, using the same two tests `build_spot_seed.js` applies — within
`COAST_MAX_M` of level-1 shoreline, and at least `OPEN_BINS_MIN` of a 72-bearing
sweep reaching `HORIZON_M` from a probe `OFFSHORE_M` seaward. Captured spots
have to clear the same bar as seeded ones or the table stops meaning one thing.

```
GET /api/spot/coastal?lat=&lon=  ->  { coastal, known, shoreline_m, open }
```

**One deliberate difference from the seed.** The seed probes seaward of the
single nearest shoreline segment. That is correct for named beach features,
whose point sits on the beach. It is wrong for geocoded addresses, whose point
sits mid-street: on a barrier island the nearest shoreline to a street is often
the bay, the probe lands in enclosed water and every bearing is blocked. East
83rd Street in Harvey Cedars is 265m from ocean shoreline and scores **0 of 72**
under the seed's rule. `Coastline.js` probes the eight nearest candidates and
keeps the best, which scores it 37. Measured verdicts:

| point | shoreline | open | verdict |
|---|---|---|---|
| East 83rd St, Harvey Cedars NJ | 404m | 37/72 | pass |
| Ship Bottom, LBI | 192m | 36/72 | pass |
| Chadwick Beach (seeded) | 149m | 34/72 | pass |
| Playa El Tecolote (seeded) | 343m | 13/72 | pass |
| El muertito (seeded) | 872m | 17/72 | pass |
| East 83rd St, Manhattan | 868m | 0/72 | fail |
| Times Square | — | 0/72 | fail |
| Newark, Toms River | — | 0/72 | fail |
| Denver | — | 0/72 | unknown |

Tecolote passing at 13 is the floor a real spot sits on, so `OPEN_BINS_MIN`
cannot be raised much. `COAST_MAX_M` at 1000 is what keeps Manhattan out; at
1500 it passes with 25/72 off the East River.

`known: false` means no shoreline data within reach — a coast outside the
extracted boxes, or somewhere inland. Both refuse. A real spot in Portugal stays
unusable until a box is added and the extract regenerated, which is deliberate:
promotion is on first use, so a guess puts a wrong row in front of everyone.

The check runs when a location is **pinned**, not when the session form opens,
and the verdict is stored on the pin. Opening the form costs no request, and the
picker can say why a place was refused instead of silently offering no chip.

### The coastline extract

`data/coastline.bin` is the level-1 shoreline for the regions the seed covers:
172,695 segments in 586 one-degree cells, **2.64MB**.

```bash
cd backend
npm run coastline:build   # pulls GSHHG, writes the .bin and updates the manifest
npm run coastline:fetch   # downloads the .bin the manifest names, verifying sha256
```

Three decisions worth not relitigating:

**GSHHG is not read at runtime.** `gshhs_f.b` is 96MB and the seed script reads
it with `fs.readFileSync`, which is right for a script that exits and wrong for a
long-lived API. The box idles near 320MB available with 400MB of swap already in
use. The service reads cells from the extract through a file descriptor with a
24-cell LRU instead; RSS running the real classify is 59MB, which is baseline
node.

**High resolution, not full.** Full is 1.22M segments and 18.6MB across these
regions against 173k and 2.64MB for high, and the two return identical verdicts
on every point in the table above. A 1000m proximity test cannot tell 200m of
coastline detail apart.

**Not committed.** Regenerating writes a different file, so committing it would
put a fresh 2.6MB copy in git history every time a coast is added. It lives in
the uploads bucket, which the bucket policy already serves public-read, so the
fetch needs no credentials and no SDK. `data/coastline.manifest.json` **is**
committed and is what pins the deploy: the hash in the repo is the extract the
code in the repo was tested against. `build_coastline.js` writes that manifest
itself, because a hash that does not match the file it names sends every box
into a download loop that cannot succeed.

Adding a coast is three steps that can drift apart — regenerate, upload, commit
the manifest. Commit the manifest without uploading and every box fails its next
deploy. No `--acl` on the upload; the bucket is `BucketOwnerEnforced` and any
`x-amz-acl` header returns 400 `AccessControlListNotSupported`:

```bash
aws s3 cp backend/data/coastline.bin \
  s3://glazewave-uploads-<account>/data/coastline.bin --profile glazewave
```

### Attribution

`frontend/src/components/layout/Attribution.js` renders the required credit and is a licence obligation, not decoration:

- Spot rows come from **OpenStreetMap contributors** under **ODbL**
- Conditions come from **Open-Meteo** under **CC BY 4.0**

**GSHHG (LGPL) is no longer build-time only.** It was, while it only filtered the
seed. The coastal check that gates captured spots needs the same shoreline at
request time, so a level-1 extract now ships as a runtime artifact
(`data/coastline.bin`, see below) and is redistributed from the uploads bucket.
No GSHHG geometry is written into `surfline_spots` — spot coordinates still come
from OSM, Wikidata or Google — but the extract itself is a derived work and
carries GSHHG's terms with it. `data/coastline.manifest.json` records the source
release and licence, and the credit belongs next to the two above rather than in
a build script's header comment.

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

The shoreline extract is fetched, not pulled, so it needs its own step **before**
the restart — the service opens the file on first use and a box that skipped this
refuses every pin instead of answering:

```bash
cd /opt/glazewave && git pull
cd /opt/glazewave/backend && npm run coastline:fetch
sudo systemctl restart glazewave-api
```

`coastline:fetch` is a no-op when the local hash already matches the manifest, so
it is safe on every deploy rather than only the ones that change it. It writes to
`.part` and renames only after the hash verifies, so a truncated download never
becomes the file the API opens.

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
│   │   └── scripts/         # ES sync/backfill, spot seed, coastline build/fetch, board and demo imports
│   ├── data/                # Generated spot seed (surfline_spots.json), coastline manifest;
│   │                        #   coastline.bin is fetched here at deploy, not committed
│   ├── bin/                 # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (session, board, reports, user, layout)
│   │   ├── reducers/        # Redux reducers
│   │   ├── requests/        # BaseRequest + API request classes
│   │   ├── middleware/      # Redux API middleware (auth, loading, dispatch)
│   │   ├── lib/utils/       # Cognito, geolocation, view-location pin, spots, distance, cache, token storage
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
- [ ] A promoted spot keeps the Google place id as its primary key, so it does not follow the documented `<source>:<native id>` convention the way `POST /api/spot` does with `user:<uuid>`. Keeping the Google id is what lets the chip resolve to the location row that already exists; giving it a `user:` id would mean one physical place with two identities and a duplicate location row on selection. Decide which before contributed and captured spots have to be reconciled
- [ ] The coastal check only answers inside the boxes in `build_coastline.js` — currently the US and Mexican coasts. Anywhere else reads `known: false` and refuses, so a real spot there cannot be captured until the box is added and the extract regenerated and uploaded
- [ ] `LocationService.promote()` runs on every session save at a place, including ones already promoted. It returns after one indexed primary-key hit, but it is a hit
- [ ] Sessions logged between the `FALLBACK_RADIUS_M` widening and the `borrowed_m` migration carry borrowed conditions with a null `borrowed_m`, so they show numbers with no label. Backfilling would have to be straight-line, which is the mismatch `borrowed_m` exists to avoid
- [ ] GSHHG geometry is now redistributed rather than build-time only, so the LGPL credit belongs in `Attribution.js` alongside OSM and Open-Meteo

---

## License

Personal project — not currently licensed for public use.
