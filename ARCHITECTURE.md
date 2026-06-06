# Architecture

How Metricool Lite goes from a demo SPA to a tool that **really posts to Instagram
+ TikTok on a schedule and pulls real analytics.**

## Principle: a vertical slice, done for real

We narrow scope (2 networks, posting + analytics) but make that slice genuinely
work end-to-end. Everything else Metricool does (more networks, ads, inbox, link
in bio) is deliberately out of scope until this slice is solid.

## High-level shape

```
┌──────────────┐      HTTPS/JSON       ┌─────────────────────────────┐
│  React SPA   │  ───────────────────► │  Fastify API (Node + TS)    │
│  (existing)  │                       │  - auth (app users)         │
│  Vite        │ ◄───────────────────  │  - OAuth connect flows      │
└──────────────┘                       │  - posts CRUD               │
                                       │  - media upload (→ R2)      │
                                       │  - analytics read           │
                                       └──────────┬──────────────────┘
                                                  │
                       ┌──────────────────────────┼───────────────────────┐
                       ▼                          ▼                        ▼
                ┌────────────┐            ┌───────────────┐        ┌──────────────┐
                │ Postgres   │            │ Scheduler     │        │ Publishers   │
                │ (Prisma)   │            │ worker (poll  │ ─────► │ Instagram /  │
                │ tokens enc │            │ due posts)    │        │ TikTok       │
                └────────────┘            └───────────────┘        └──────┬───────┘
                                                                          ▼
                                                              Meta Graph API / TikTok API
```

## Why this stack (decided)

- **Fastify + TypeScript** — same language as the frontend; fast; minimal.
- **Postgres + Prisma** — relational data (users → accounts → posts → targets →
  results) with typed queries and migrations.
- **Cloudflare R2 (S3-compatible)** — Instagram's Content Publishing API requires
  the image/video to be fetchable at a **public URL**; we upload there first.
- **In-process polling scheduler** — a worker that every minute selects posts whose
  `scheduledAt <= now AND status = 'scheduled'` and publishes them, with retries.
  No Redis/queue needed at this scale; we can graduate to BullMQ later if volume
  demands.
- **Publisher interface** — one seam per platform so network #3 is additive:

```ts
interface Publisher {
  publish(account: ConnectedAccount, post: PostWithMedia): Promise<PublishResult>;
  fetchAnalytics(account: ConnectedAccount, range: DateRange): Promise<AnalyticsSnapshot>;
}
// InstagramPublisher, TikTokPublisher implement this.
```

This mirrors the frontend's existing `SocialClient` seam — the same idea applied
server-side.

## Data model (Prisma sketch)

- **User** — an app user (the person using our tool).
- **ConnectedAccount** — one connected social profile: `platform`, `externalId`,
  `username`, **encrypted** `accessToken` / `refreshToken`, `expiresAt`, scopes.
- **Post** — `userId`, `caption`, `mediaId`, `scheduledAt`, `status`
  (draft | scheduled | publishing | published | failed).
- **PostTarget** — fan-out: one Post → many platforms; per-target `status`,
  `externalPostId`, `error`.
- **Media** — `r2Key`, `publicUrl`, `kind` (image|video), dimensions, mime.
- **AnalyticsSnapshot** — periodic per-account metrics (followers, reach,
  impressions, engagement) for the dashboard charts.

Tokens are encrypted at rest with `TOKEN_ENCRYPTION_KEY` (AES-256-GCM).

## Publishing flows (the real specifics)

### Instagram (Graph API, two-step)
1. **Create media container** — `POST /{ig-user-id}/media` with `image_url` (or
   `video_url`/`media_type=REELS`) + `caption`. Media must be at a public URL (R2).
2. **Publish** — `POST /{ig-user-id}/media_publish` with the returned
   `creation_id`. (Video containers must finish processing first — poll status.)
   Rate limit ~25–50 posts/24h per account.

### TikTok (Content Posting API)
1. **Init** — `POST /v2/post/publish/video/init/` with post info + source
   (FILE_UPLOAD or PULL_FROM_URL).
2. **Upload** the video bytes (or let TikTok pull from the R2 URL).
3. **Poll status** — `POST /v2/post/publish/status/fetch/`.
   *Unaudited apps: privacy must be SELF_ONLY / draft.*

## Analytics flows
- **Instagram:** `GET /{ig-user-id}/insights` (reach, impressions, profile views)
  + follower_count; per-media insights for top posts.
- **TikTok:** Display API `video.list` (views/likes/comments/shares per video) +
  `user.info.stats` (follower count).
- A daily job writes `AnalyticsSnapshot` rows; the dashboard reads from our DB
  (fast, and resilient to platform rate limits) rather than hitting APIs live.

## What changes on the frontend
- Replace the mock `SocialClient` (`src/services/`) with an **HTTP client** hitting
  the Fastify API. The hooks, pages, calendar, and composer **stay**.
- Add a **"Connect account"** screen (OAuth) and make the composer **upload real
  media**.
- Analytics pages read real snapshots; same charts.

## Build phases
1. **Backend scaffold** — Fastify app, Prisma schema + migration, env loading,
   health check, app-user auth.
2. **OAuth connect** — Instagram + TikTok connect flows; store encrypted tokens;
   "Connect account" UI.
3. **Media + compose** — R2 upload; real post creation persisted to Postgres;
   wire the existing composer/calendar to the API.
4. **Scheduler + publishers** — polling worker; `InstagramPublisher` +
   `TikTokPublisher` publish for real (test on own accounts).
5. **Analytics** — snapshot jobs + real dashboard data.
6. **Hardening** — token refresh, retries, error surfacing, rate-limit handling.
7. **Launch gate (parallel, you):** Meta App Review + TikTok audit.

## What stays out of scope (for now)
More networks, ads, unified inbox, link-in-bio, teams/roles. The `Publisher` seam
keeps the door open for all of them.
