# Metricool Lite — Server

The backend that makes posting & analytics real. Fastify + TypeScript + Prisma
(Postgres). See `../ARCHITECTURE.md` for the overall design and `../SETUP.md` for
the credentials/infra checklist.

## Status: Phases 1–4 complete (posting pipeline)

Implemented so far:

- **Fastify app** with CORS, multipart, logging, graceful shutdown.
- **Env validation** (`src/env.ts`) — fails fast; platform/storage secrets are
  optional until used (endpoints return 503 until configured).
- **Postgres schema** (`prisma/schema.prisma`) — `User`, `ConnectedAccount`
  (encrypted tokens), `Media`, `Post`, `PostTarget`, `AnalyticsSnapshot`.
- **Token encryption at rest** — AES-256-GCM (`src/lib/crypto.ts`).
- **App-user auth** — register / login / me (bcrypt + JWT).
- **OAuth connect flows** — Instagram + TikTok (`src/lib/oauth/`), signed state,
  encrypted token storage.
- **Media upload** — multipart → Cloudflare R2 (`src/lib/storage.ts`).
- **Posts** — create (fan-out to targets), list, delete.
- **Publishers** — Instagram (container → publish, polls video) and TikTok
  (PULL_FROM_URL, polls status) behind one `Publisher` seam
  (`src/lib/publishers/`), with TikTok token refresh.
- **Scheduler** — in-process worker publishes due posts every minute
  (`src/scheduler.ts`).

Next: real analytics ingestion (Phase 5) and the frontend wiring to this API.

> **Testing the real posting path** requires platform credentials + a deployed
> HTTPS URL (`SETUP.md`). The code is complete and type-checked; live posting is
> validated once those exist.

## Run it locally

```bash
cp .env.example .env        # then fill DATABASE_URL, JWT_SECRET, TOKEN_ENCRYPTION_KEY
openssl rand -base64 32     # value for TOKEN_ENCRYPTION_KEY

npm install
npm run prisma:push         # create tables in your dev database
npm run dev                 # http://localhost:4000
```

You only need a Postgres URL to run Phase 1 — no platform credentials yet.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Liveness + DB status |
| POST | `/api/auth/register` | – | Create an app user → `{ token, user }` |
| POST | `/api/auth/login` | – | Log in → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/oauth/:platform/start` | Bearer | Get the authorize URL to redirect to |
| GET | `/api/oauth/:platform/callback` | – | OAuth redirect target; stores account |
| GET | `/api/accounts` | Bearer | List connected accounts + which platforms are configured |
| DELETE | `/api/accounts/:id` | Bearer | Disconnect an account |
| POST | `/api/media` | Bearer | Upload media (multipart) → R2 |
| GET | `/api/posts` | Bearer | List posts with targets |
| POST | `/api/posts` | Bearer | Create + schedule a post |
| DELETE | `/api/posts/:id` | Bearer | Delete a not-yet-published post |

## Database migrations

- **Dev (quick):** `npm run prisma:push` syncs the schema to your DB.
- **Production (versioned):** `npm run prisma:migrate` creates a migration, then
  `npx prisma migrate deploy` applies it on deploy.
