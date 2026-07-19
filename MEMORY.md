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
├── .env                         # MONGO_URI + PORT
├── package.json
├── vercel.json                  # Vercel serverless deployment config
├── MEMORY.md
├── api/                         # Vercel serverless entry point
│   └── index.js
└── src/
    ├── index.js                 # Express app setup & startup
    ├── data.js                  # MongoDB connection + auto-seed logic
    ├── seed.json                # Static seed data (read once at startup)
    ├── middleware/
    │   ├── basicAuth.js         # Basic Auth (police / nibm2024)
    │   └── deviceApiKey.js      # X-API-Key device validation
    └── routes/
        ├── provinces.js         # GET /provinces, GET /provinces/:id
        ├── districts.js         # GET /districts, GET /districts/:id
        ├── stations.js          # GET /stations, GET /stations/:id
        └── vehicles.js          # GET/POST /vehicles endpoints
```

## Data Layer (`src/data.js`)

Exports `{ connect, client }`.

- `connect()` — returns a cached MongoDB `Db` instance.
- On first connect, auto-seeds all 5 collections (`provinces`, `districts`, `stations`, `vehicles`, `pings`) from `seed.json` if they are empty.
- URI: `MONGO_URI` from `.env` (see `.env.sample` for the format).
- All documents use **numeric `id` fields** (not ObjectId).

## Middleware

### `basicAuth.js`
- **Scope:** Applied only to `GET` routes on the vehicles router (via `router.use` + method check).
- **Credentials:** `username: "police"`, `password: "nibm2024"`
- **401** (with `WWW-Authenticate: Basic realm="Police API"`) — if `Authorization` header is absent, malformed, or Base64 decoding fails.
- **403** (no `WWW-Authenticate`) — if decoded username/password do not match.

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

### `/vehicles` (all GET routes protected by Basic Auth)
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/vehicles` | Basic | Array of `{ vehicle_id, reg_number, device_id, station_id }` |
| GET | `/vehicles/:vehicleId` | Basic | Vehicle DTO + `last_ping` (null if none) |
| GET | `/vehicles/:vehicleId/pings` | Basic | Array of ping DTOs for that vehicle |
| GET | `/vehicles/:vehicleId/pings/:pingId` | Basic | Single ping DTO or 404 |
| GET | `/vehicles/:vehicleId/last-position` | Basic | `{ vehicle_id, timestamp, lat, lng }` or 404 |
| POST | `/vehicles/:vehicleId/pings` | X-API-Key | Creates a ping, returns 201 with Location/ETag/Last-Modified |

## Changes Log (chronological)

### 1. `GET /vehicles/:vehicleId/pings/:pingId`
- Added route returning a ping by ID for a specific vehicle.
- Returns **200** with ping DTO or **404** if vehicle/ping not found.

### 2. `POST /vehicles/:vehicleId/pings`
- Builds `deviceKeys` map: `"v-{padId}" → "key_v{padId}"`.
- Validates `X-API-Key` header (401/403/404).
- Validates request body requires `latitude`, `longitude`, `speed` (400).
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

## Running

```bash
npm start          # loads .env, connects to MongoDB, listens on PORT (default 3000)
```

## Vercel Deployment

`api/index.js` imports `src/index.js` (the `app` export).  
Vercel handles connections per-function — `connect()` caches the `MongoClient` across warm invocations.
