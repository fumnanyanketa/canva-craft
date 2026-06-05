# Metricool Lite

A stripped-down [Metricool](https://metricool.com) — a social media management
dashboard with **analytics**, a **content calendar/scheduler**, **multi-brand
switching**, and **exportable reports**. Built as a fast, self-contained SPA that
runs instantly on realistic demo data, with a data layer designed to be swapped
for real social APIs later.

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

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Architecture: "mock now, real later"

All data flows through a single interface, `SocialClient`
(`src/services/client.ts`). Today it's implemented by a `MockClient`
(`src/services/mock/`) that generates stable, seeded demo data. React Query hooks
(`src/hooks/useSocialData.ts`) and every component talk only to this interface.

To connect real platforms (Instagram, X, etc.):

1. Add `src/services/real/realClient.ts` implementing `SocialClient` against the
   real APIs.
2. Change the one export in `src/services/index.ts`:
   ```ts
   export const client: SocialClient = new RealClient();
   ```

No hooks, pages, or components need to change.

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

This is a demo: all metrics are simulated and deterministic per brand/range.
Scheduled posts you create are stored in your browser's `localStorage`. Out of
scope (the "stripped down"): real OAuth integrations, unified inbox, ads, link in
bio, team auth, and a backend.
