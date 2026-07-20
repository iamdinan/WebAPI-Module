# Project Memory / Architecture

## Overview

Tuk Tuk tracking API — Express 5 backend with MongoDB Atlas.  
Exposes REST endpoints for provinces, districts, stations, and vehicles (with GPS pings).

## Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5.2.1
- **Database:** MongoDB Atlas (`mongodb` driver 7.x)
- **Env:** `dotenv` (loads `.env`)

## Project Structure

```
.
├── .env                         # MONGO_URI + PORT (gitignored)
├── .env.sample                  # Env template with placeholders
├── package.json
├── vercel.json                  # Vercel serverless deployment config
├── MEMORY.md
├── decisions.md                 # Technical decisions & rejected alternatives
├── api/                         # Vercel serverless entry point
│   └── index.js
└── src/
    ├── index.js                 # Express app setup & startup
    ├── data.js                  # MongoDB connection + auto-seed logic
    ├── users.json               # Static user accounts for auth
    ├── middleware/
    │   ├── basicAuth.js         # Basic Auth — unused (replaced by JWT)
    │   ├── deviceApiKey.js      # X-API-Key device validation
    │   └── jwtAuth.js           # JWT verification middleware
    └── routes/
        ├── auth.js              # POST /auth/sign-in
        ├── provinces.js         # GET /provinces, GET /provinces/:id
        ├── districts.js         # GET /districts, GET /districts/:id
        ├── stations.js          # GET /stations, GET /stations/:id
        └── vehicles.js          # GET/POST /vehicles endpoints
```

## Data Layer (`src/data.js`)

Exports `{ connect, client }`.

- `connect()` — returns a cached MongoDB `Db` instance.
- On first connect, auto-seeds all 5 collections (`provinces`, `districts`, `stations`, `vehicles`, `pings`) from `seed.json` if they are empty. **Note:** `seed.json` is currently missing from disk; the database is already seeded from earlier runs. If the DB is dropped, `seed.json` must be restored or the seeding logic updated.
- URI: `MONGO_URI` from `.env` (see `.env.sample` for the format).
- All documents use **numeric `id` fields** (not ObjectId).

## Middleware

### `jwtAuth.js`
- **Scope:** App-level middleware on all `/provinces`, `/districts`, `/stations`, `/vehicles` routes (applied in `index.js`).
- Expects `Authorization: Bearer <token>` header.
- Verifies token with `JWT_SECRET` (env or fallback `"tuk-tuk-secret-key"`).
- Attaches decoded payload to `req.user`.
- **401** — header absent, malformed, or token invalid/expired.

### `basicAuth.js`
- **Status:** Unused (replaced by JWT auth).
- Previously applied to `GET` routes on the vehicles router.
- **Credentials:** `username: "police"`, `password: "nibm2024"`
- **401** (with `WWW-Authenticate: Basic realm="Police API"`) — if header absent/malformed.
- **403** — if credentials don't match.

### `deviceApiKey.js`
- **Exports:** `{ validateApiKey }`
- **Scope:** Route-level middleware on `POST /:vehicleId/pings`.
- Reads `X-API-Key` header.
- Builds a device key map from MongoDB: `{ "v-01": "key_v01", "v-02": "key_v02", ... }` (zero-padded to 2 digits).
- **401** — header absent.
- **404** — vehicle not found in DB.
- **403** — key doesn't match `deviceKeys[vehicleId]`.

## Routes

### `/provinces`
| Method | Path | Response |
|--------|------|----------|
| GET | `/provinces` | Array of `{ province_id, name }` |
| GET | `/provinces/:provinceId` | Single province DTO or 404 |

### `/districts`
| Method | Path | Response |
|--------|------|----------|
| GET | `/districts` | Array of `{ district_id, name, province_id }` |
| GET | `/districts/:districtId` | Single district DTO or 404 |

### `/stations`
| Method | Path | Response |
|--------|------|----------|
| GET | `/stations` | Array of `{ station_id, name, district_id }` |
| GET | `/stations/:stationId` | Single station DTO or 404 |

### `/auth`
| Method | Path | Auth | Response |
|--------|------|------|----------|
| POST | `/auth/sign-in` | None | `{ token, user }` — validates against `users.json` |

### `/vehicles` (all routes protected by JWT)
| Method | Path | Extra Auth | Response |
|--------|------|------------|----------|
| GET | `/vehicles` | — | Array of `{ vehicle_id, reg_number, device_id, station_id }` |
| GET | `/vehicles/:vehicleId` | — | Vehicle DTO + `last_ping` (null if none) |
| GET | `/vehicles/:vehicleId/pings` | — | Array of ping DTOs for that vehicle |
| GET | `/vehicles/:vehicleId/pings/:pingId` | — | Single ping DTO or 404 |
| GET | `/vehicles/:vehicleId/last-position` | — | `{ vehicle_id, timestamp, lat, lng }` or 404 |
| POST | `/vehicles/:vehicleId/pings` | X-API-Key | Creates a ping, returns 201 with Location/ETag/Last-Modified |

## Changes Log (chronological)

### 1. `GET /vehicles/:vehicleId/pings/:pingId`
- Added route returning a ping by ID for a specific vehicle.
- Returns **200** with ping DTO or **404** if vehicle/ping not found.

### 2. `POST /vehicles/:vehicleId/pings`
- Builds `deviceKeys` map: `"v-{padId}" → "key_v{padId}"`.
- Validates `X-API-Key` header (401/403/404).
- Validates request body requires `latitude`, `longitude` (400). `speed` was originally required but later removed.
- Server sets `timestamp: new Date().toISOString()`.
- ID auto-increments from max existing ping `id`.
- Returns **201** with `Location`, `ETag`, `Last-Modified` headers.

### 3. Basic Auth middleware (all GET routes)
- Created `src/middleware/basicAuth.js`.
- Applied to all `GET` routes on vehicles router via `router.use`.
- Write routes (`POST`) bypass Basic Auth and use `X-API-Key`.

### 4. Middleware extraction
- Moved `basicAuth` function → `src/middleware/basicAuth.js`.
- Moved `deviceKeys` map + `validateApiKey` → `src/middleware/deviceApiKey.js`.
- Routes import and use these instead of inline code.

### 5. MongoDB migration
- Replaced `seed.json` file-read with MongoDB Atlas connection.
- `src/data.js`: exports `connect()` → lazy-initializes `MongoClient`, auto-seeds empty collections from `seed.json`.
- `src/index.js`: calls `connect()` before `app.listen()`.
- All route handlers converted from sync array ops to `async/await` MongoDB queries:
  - `.find()` → `.find().toArray()`
  - `.find(predicate)` → `.findOne({ id: ... })`
  - `.filter()` → `.find({ ... }).toArray()`
  - `.push()` → `.insertOne()`
  - `.length + 1` → `find().sort({ id: -1 }).limit(1)` then increment.
- Added `mongodb` package to dependencies.

### 6. JWT authentication
- Added `jsonwebtoken` package.
- Created `src/middleware/jwtAuth.js` — verifies `Bearer` tokens, returns 401 on failure.
- Created `src/routes/auth.js` with `POST /auth/sign-in` (reads from `users.json`). (A `POST /auth/login` with hardcoded check was added and later removed.)
- Created `src/users.json` with 3 accounts: `police`/`nibm2024`, `admin`/`admin123`, `dispatcher`/`dispatch123`.
- Applied `jwtAuth` middleware in `index.js` to all API routers (`/provinces`, `/districts`, `/stations`, `/vehicles`).
- Removed `basicAuth` usage from `vehicles.js` (file kept on disk).
- `POST /vehicles/:vehicleId/pings` now requires both JWT (app-level) and X-API-Key (route-level).

## Running

```bash
npm start          # loads .env, connects to MongoDB, listens on PORT (default 3000)
```

## Vercel Deployment

`api/index.js` imports `src/index.js` (the `app` export).  
Vercel handles connections per-function — `connect()` caches the `MongoClient` across warm invocations.
