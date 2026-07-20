# Decisions

## Framework: Express 5

**Chosen over:** Express 4, Fastify, Koa, Hapi

Express 5 was chosen because the project started on Express 4 and was upgraded. Express 5 natively handles async middleware errors (rejected promises are caught and forwarded to error handlers), eliminating the need for manual `try/catch` wrappers in every route handler.

## Database: MongoDB Atlas

**Chosen over:** PostgreSQL (via Sequelize/Knex), SQLite, Firebase Firestore, Supabase

MongoDB was selected for its schema-less document model which fits the GPS ping data well — pings are unstructured payloads that can vary per device. Atlas provides a free tier suitable for prototyping. The trade-off is the lack of relational integrity (no foreign keys, no JOINs), but the data model is simple enough that application-level referential checks suffice.

## Authentication: JWT (Bearer tokens)

**Chosen over:** Session-based (express-session + cookie), OAuth 2.0, API key per user

JWT was chosen for stateless auth — no server-side session store needed, which simplifies Vercel serverless deployment where sessions would require a shared Redis/DB store. The token is issued once via `/auth/sign-in` and verified on every request via middleware. The 24h expiry is a pragmatic balance between security and UX for police/dispatcher users.

**Rejected alternatives:**
- **Session-based auth** — requires server-side storage; incompatible with serverless cold starts without an external session store (Redis/Memcached), adding infrastructure complexity.
- **OAuth 2.0** — overkill for a single-client API with 3 hardcoded user accounts; adds redirect flow complexity with no benefit.
- **API key per user** — less secure (keys are long-lived, harder to rotate), no standard `Authorization` header format, no expiry.

## Dual Auth: JWT + X-API-Key

**Chosen over:** Single auth method for all routes

The API uses two separate auth mechanisms for different purposes:
- **JWT** (user-facing) — authenticates police officers, admins, and dispatchers on all read/query endpoints.
- **X-API-Key** (device-facing) — authenticates IoT devices (`v-01` → `key_v01`) when posting GPS pings.

This dual approach avoids requiring police users to manage device keys, and avoids requiring devices to handle user login flows. The downside is two parallel auth systems to maintain, but the separation of concerns is worth the cost.

**Rejected alternatives:**
- **JWT only for everything** — devices would need to call `/auth/sign-in`, store a token, and refresh it periodically, which complicates embedded/IoT firmware.
- **API key only for everything** — no user identity/role in the token, harder to audit who accessed what.

## Numeric IDs (not MongoDB ObjectId)

**Chosen over:** `_id` (ObjectId), UUIDs

The seed data from `seed.json` uses numeric IDs (e.g., `province.id: 1`). Keeping numeric IDs avoids a full data migration. The trade-off is that auto-increment for pings requires a `find().sort({id:-1}).limit(1)` query instead of a simple counter, but this is acceptable at the current scale.

## Middleware extraction to separate files

**Chosen over:** Inline middleware in route files

`basicAuth.js`, `deviceApiKey.js`, and `jwtAuth.js` were extracted to `src/middleware/` for reusability and testability. This also keeps route files focused on request handling rather than auth plumbing.

## Static users.json (not MongoDB for users)

**Chosen over:** Users collection in MongoDB, hardcoded constants

A `users.json` file was chosen over MongoDB because:
- There are only 3 users that rarely change.
- Avoids coupling auth bootstrapping with database seeding.
- Keeps credentials visible in version control (for development).

This is a development-time choice. In production, users would likely live in MongoDB or an external auth provider.

## CommonJS (not ESM)

The project uses `require()` / `module.exports` because the starter template was CommonJS. ESM would require `"type": "module"` in package.json and migrating all imports. Not worth the churn for an API of this size.

## Vercel Serverless

**Chosen over:** Traditional VPS (DigitalOcean, AWS EC2), Docker

Vercel was chosen for zero-ops deployment — Git push triggers automatic deploy, HTTPS is free, and the free tier is sufficient. The trade-off is cold starts (~200ms for the MongoDB connection) and the 10s function timeout, which is fine for typical CRUD but not for long-running tasks.
