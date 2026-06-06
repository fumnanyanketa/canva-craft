# Metricool Lite — Server

The backend that makes posting & analytics real. Fastify + TypeScript + Prisma
(Postgres). See `../ARCHITECTURE.md` for the overall design and `../SETUP.md` for
the credentials/infra checklist.

## Status: Phase 1 complete

Implemented so far:

- **Fastify app** with CORS, structured logging, graceful shutdown.
- **Env validation** (`src/env.ts`) — fails fast with a clear message; platform
  secrets are optional until the phases that need them.
- **Postgres schema** (`prisma/schema.prisma`) — `User`, `ConnectedAccount`
  (encrypted tokens), `Media`, `Post`, `PostTarget`, `AnalyticsSnapshot`.
- **Token encryption at rest** — AES-256-GCM (`src/lib/crypto.ts`).
- **App-user auth** — register / login / me with bcrypt + JWT
  (`src/routes/auth.ts`, `src/plugins/authenticate.ts`).
- **Health check** — `GET /api/health` (reports DB connectivity).

Not yet built (next phases): OAuth connect flows, media upload (R2), post
creation, the scheduler worker, and the Instagram/TikTok publishers.

## Run it locally

```bash
cp .env.example .env        # then fill DATABASE_URL, JWT_SECRET, TOKEN_ENCRYPTION_KEY
openssl rand -base64 32     # value for TOKEN_ENCRYPTION_KEY

npm install
npm run prisma:push         # create tables in your dev database
npm run dev                 # http://localhost:4000
```

You only need a Postgres URL to run Phase 1 — no platform credentials yet.

## Endpoints (Phase 1)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Liveness + DB status |
| POST | `/api/auth/register` | – | Create an app user → `{ token, user }` |
| POST | `/api/auth/login` | – | Log in → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Current user |

## Database migrations

- **Dev (quick):** `npm run prisma:push` syncs the schema to your DB.
- **Production (versioned):** `npm run prisma:migrate` creates a migration, then
  `npx prisma migrate deploy` applies it on deploy.
