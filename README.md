# Metricool Lite

A stripped-down [Metricool](https://metricool.com): a focused social media tool
that **really schedules and auto-publishes posts to Instagram + TikTok**, with
analytics, a content calendar, and exportable reports. See `PROJECT_PLAN.md` for
the shareable overview, `ARCHITECTURE.md` for the design, and `SETUP.md` for the
credentials checklist.

Two modes, sharing every component:

- **Real mode** (sign in): accounts, media, scheduling, and publishing go through
  the backend in `server/` — the scheduler publishes your posts automatically and
  collects daily analytics from your connected accounts.
- **Demo mode** (no account needed): the full UI on realistic generated data.
  Nothing leaves the browser. Perfect for showing people the product.

## Features

- **Dashboard** — KPI cards (followers, reach, engagement rate, posts) with
  period-over-period deltas, follower-growth area chart, daily-engagement bars,
  follower-share-by-network donut, and a top-posts list.
- **Analytics** — per-network tabs with reach/impressions time series, a
  best-time-to-post heatmap, and that network's top posts.
- **Planning** — a month calendar showing scheduled & published posts as
  network-colored chips. Compose a post (pick networks, caption with character
  counter, date/time) and it persists to `localStorage`, surviving reloads.
- **Reports** — a clean, print-optimized summary with an **Export PDF** button
  (uses the browser print dialog).
- **Multi-brand** — switch between demo brands; every page rescopes to the
  selected brand and date range.
- Light/dark theme, responsive layout, loading skeletons.

## Tech stack

Vite · React 18 · TypeScript · Tailwind CSS · shadcn/ui (Radix) · Recharts ·
React Router · TanStack Query · Zustand · date-fns.

## Getting started

**Frontend only (demo mode):**

```bash
npm install
npm run dev      # http://localhost:5173 → click "Explore the demo"
```

**Full stack (real mode):**

```bash
# Terminal 1 — backend (needs a Postgres URL; see server/README.md)
cd server && cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, TOKEN_ENCRYPTION_KEY
npm install && npm run prisma:push && npm run dev   # http://localhost:4000

# Terminal 2 — frontend
npm install && npm run dev          # http://localhost:5173 → create an account
```

Connecting real Instagram/TikTok and publishing additionally needs platform
credentials and media storage — the full checklist is in `SETUP.md`.

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Architecture: two data paths, one UI

- **Demo:** components → React Query hooks (`src/hooks/useSocialData.ts`) →
  mock `SocialClient` (`src/services/mock/`) generating stable, seeded data.
- **Real:** components → real-data hooks (`src/hooks/useRealData.ts`) → HTTP
  client (`src/lib/api.ts`) → the Fastify API in `server/`, which owns OAuth,
  encrypted tokens, media (R2), the publish scheduler, and analytics ingestion.

Server posts are mapped into the same UI shapes the demo uses, so pages and
components never branch on mode. Analytics charts currently run on demo data in
both modes (real snapshots are already being collected server-side; the
dashboard switchover is the next step).

## Project structure

```
src/
  components/        # shared UI (KpiCard, ChartCard, PostComposer, ...) + ui/ primitives
  components/layout/ # AppSidebar, TopBar
  hooks/             # React Query data hooks
  pages/             # Dashboard, Analytics, Calendar, Reports
  services/          # data layer: types, client interface, mock implementation
  store/             # Zustand app store (selected brand, date range, theme)
  lib/               # utils (cn, number formatting)
```

## Notes

In demo mode, metrics are simulated and deterministic per brand/range, and
scheduled posts live in your browser's `localStorage`. In real mode, posts are
stored server-side and published automatically. Deliberately out of scope for
v1 (the "stripped down"): networks beyond Instagram/TikTok, unified inbox, ads,
link in bio, and team seats — see `PROJECT_PLAN.md` §5.
