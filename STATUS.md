# Repository Status Report

*Unbiased deep-dive based only on the files actually present. Generated 2026-06-22; re-verified against the server the same day.*

> **Re-verification note (2026-06-22):** the server was re-queried directly with
> `git ls-remote --heads origin` (the authoritative source, not the local clone).
> It returns **exactly 2 branches** — the same 2 this report already covered, so
> nothing was missed. The only change since first writing: `jolly-franklin` is now
> **1 commit ahead** of `metricool-alternative-design`, and that one commit is
> *this STATUS.md file itself*. The code trees of the two branches remain
> **byte-for-byte identical** (`git diff` shows only STATUS.md). The branch table
> below is corrected to reflect that.

> **Heads-up on the name:** the repo is called **`canva-craft`**, but nothing in
> the code has anything to do with Canva or design tooling. The actual project
> is **"Metricool Lite"** — a social-media scheduling & analytics dashboard for
> Instagram + TikTok. Judge it by the code, not the repo name.

---

## 1. Branch inventory

**Authoritative count (from `git ls-remote --heads origin`): 2 branches.** Both
are visible in the local clone too, so nothing is hidden. There is **no `main` /
default branch**. The product code is a single linear history of **8 commits**,
dated **2026-06-05 → 2026-06-09** (≈4 days of work). The two branches share that
history (merge-base `0f6f98e`) — **neither is an orphan**, and there is **no
second/separate project hiding in another branch**.

| Branch (local + remote) | HEAD | Last commit | vs default | What's actually in it |
| --- | --- | --- | --- | --- |
| `claude/jolly-franklin-cxhvk0` | `1555430` | 2026-06-22 | +1 / −0 vs the other branch | The full app (React/Vite frontend + Fastify/Prisma backend) **plus this STATUS.md** — the +1 commit is solely this report. |
| `claude/metricool-alternative-design-kt8m3` | `0f6f98e` | 2026-06-09 | the de-facto baseline | The full app, identical code. Despite the "alternative-design" name there is **no alternative design** — same tree as `jolly-franklin` minus STATUS.md. A redundant duplicate pointer. |

There is no `main`; I treat `metricool-alternative-design` (the original shared
HEAD) as the de-facto baseline for the ahead/behind comparison above.

**Stale / stranded / abandoned / redundant work:** no *divergent code* anywhere —
excluding STATUS.md the two branches are byte-for-byte identical (verified with
`git diff`). The redundancy is the branch names themselves:
`claude/metricool-alternative-design-kt8m3` is misleadingly named (no different
design exists) and can be deleted with zero loss. Nothing is forked or stranded.
The absence of a `main` to merge into is itself a loose end (see Next actions).

---

## 2. What this project actually is

A deliberately **stripped-down [Metricool](https://metricool.com) clone** scoped
to two networks: **Instagram and TikTok**. The pitch (from `PROJECT_PLAN.md`):
*connect IG/TikTok → compose a post → place it on a calendar → it auto-publishes
at the scheduled time → watch the analytics.*

It ships as **two modes that share one UI**:
- **Demo mode** — the entire app running on realistic, seeded, deterministic
  generated data, entirely in-browser, no account needed.
- **Real mode** — a genuine backend (`server/`) that does OAuth, encrypted token
  storage, media upload, scheduled auto-publishing, and daily analytics
  ingestion against the real Instagram Graph and TikTok APIs.

**Tech stack (verified in code):**
- Frontend: Vite · React 18 · TypeScript · Tailwind · shadcn/ui (Radix) ·
  Recharts · React Router · TanStack Query · Zustand · date-fns.
- Backend: Node + Fastify · Prisma · PostgreSQL · Cloudflare R2 (media) ·
  AES-256-GCM token encryption · an in-process cron-style scheduler.
- ~6,000 lines of app code (frontend ~4,200, backend ~1,800).

---

## 3. Built vs stubbed — and rough % complete

This is **not a skeleton**. The code is real and well-written; almost no TODOs,
stubs, or "coming soon" markers exist (a repo grep finds only HTML input
`placeholder` attributes). The honest gaps are about *go-live wiring*, not
missing implementation.

**Genuinely built & substantive:**
- ✅ **Full frontend UI** — Dashboard (KPI cards, charts, donut, top posts),
  Analytics (per-network tabs, time series, best-time heatmap), Calendar (month
  grid + post composer), Reports (print-to-PDF), multi-brand switcher, light/dark
  theme, loading skeletons.
- ✅ **Demo mode** — complete, deterministic seeded data generators.
- ✅ **Backend auth** — register/login, JWT, bcrypt — real.
- ✅ **OAuth connect flows** — Instagram (Meta Graph) + TikTok, with CSRF state
  and token exchange; full code in `server/src/lib/oauth/`.
- ✅ **Token encryption at rest** — AES-256-GCM (`lib/crypto.ts`), refresh logic.
- ✅ **Media upload** — to Cloudflare R2 (`lib/storage.ts`).
- ✅ **Scheduler** — in-process, ticks every 60s to claim & publish due posts,
  hourly analytics snapshots; non-overlapping, retry-aware.
- ✅ **Publishers** — real Instagram two-step container publish (with async video
  /Reels polling) and TikTok content-posting; behind one `Publisher` interface.
- ✅ **Analytics ingestion** — real Graph/TikTok insight calls, defensive
  per-metric fetch, one snapshot row per account per day (Prisma model exists).
- ✅ **Frontend ↔ backend wiring** for **Login, Accounts, Calendar, PostComposer**
  (these use the real-data hooks).

**Stubbed / placeholder / not wired:**
- ⚠️ **Dashboard & Analytics pages still render DEMO data even in real mode.**
  Confirmed: `Dashboard.tsx` and `Analytics.tsx` import only `useSocialData`
  (mock), never `useRealData`. The README and plan admit this: *"Analytics charts
  currently run on demo data in both modes … the dashboard switchover is the next
  step."* The real snapshots are being collected server-side but never displayed.
- ⚠️ **No successful real publish has ever happened** — by the authors' own
  account, it can't be tested without live platform credentials.
- ❌ **No tests** anywhere (no `*.test.*` / `*.spec.*`).
- ❌ **No CI** (no `.github/` directory).
- ❌ **No deployment** — runs locally only; `node_modules` not even installed.

**Rough completeness: ~70–75%.** The hard engineering (OAuth, encryption,
scheduler, real publishers, analytics ingestion) is done. What remains is mostly
*account/credential setup, one data-source switch, and shipping* — plus the
quality scaffolding (tests/CI) that doesn't exist yet.

---

## 4. What's left to finish — and the single biggest blocker

Remaining work (from the code + `PROJECT_PLAN.md` §4):
1. Switch Dashboard/Analytics from demo data to the real, already-collected
   snapshots (a dev task — the data and endpoints exist).
2. Provision infrastructure: Postgres, R2 bucket, server host.
3. Obtain platform credentials: Meta app + Business Verification, TikTok app.
4. Deploy frontend + backend; make the first real post.
5. Add a privacy policy / terms page (required for review).
6. Submit Meta App Review + TikTok audit to let *anyone* connect.

**Single biggest blocker: external platform approval — Meta Business Verification
and the TikTok audit.** It's the slowest item (cited as 1–3+ weeks), it's gated
on the owner's account/legal setup (not code), and until it clears the product
literally cannot publish to anyone's accounts but the owner's (and TikTok posts
stay private). Everything in the codebase is downstream of this gate.

---

## 5. Quick wins (nearly done)

- **Switch the dashboard to real analytics** — server already collects snapshots
  and an analytics endpoint/service exists; the page just needs to call
  `useRealData` instead of `useSocialData`, mirroring how Calendar already
  branches on `isReal`. Highest value-per-effort item in the repo.
- **Delete the redundant `metricool-alternative-design` branch** — zero-risk
  cleanup; it's an identical duplicate.
- **Establish a `main` branch** — there isn't one; promote the current HEAD.
- **Add a minimal CI** (`npm run lint` = `tsc --noEmit`, `npm run build`) — the
  scripts already exist, there's just no workflow file.

---

## 6. Blunt recommendation: **KEEP & FINISH** (with cleanup)

This is a genuinely well-built, coherent product that is much closer to done than
a 4-day-old repo has any right to be. The code quality is high, the architecture
(one UI over demo/real, single `Publisher` interface) is sound, and the honest
self-assessment in the docs matches what the code actually does. This is **not** a
throwaway prototype and should **not** be discarded or archived.

It does **not** need to be merged into another project — it's self-contained and
purpose-built. Two caveats keep it from "ship it as-is":
- The **repo name (`canva-craft`) is wrong** for the contents and should be
  renamed to `metricool-lite`, or the mismatch will confuse everyone.
- The path to "live" is gated on **owner credential/legal work**, not more
  coding. If the owner won't pursue Meta/TikTok approval, the real mode is inert
  and the project effectively becomes "a polished demo dashboard." Decide that
  up front.

**Verdict:** keep and finish — but do the cheap cleanups first (rename, kill the
dupe branch, create `main`, wire real analytics), then start the long-lead
platform-approval clock, because that's what actually gates launch.

---

## Next actions

- [ ] Wire Dashboard + Analytics pages to real data (`useRealData`) so collected snapshots actually display — highest-value dev task.
- [ ] Start Meta Business Verification + TikTok app audit now (longest lead time; the real blocker).
- [ ] Provision Postgres + Cloudflare R2 + a server host, then deploy backend & frontend.
- [ ] Rename the repo/package from `canva-craft` to `metricool-lite` to match the actual product.
- [ ] Delete the duplicate `claude/metricool-alternative-design-kt8m3` branch and promote a real `main` branch.
- [ ] Add minimal CI (`tsc --noEmit` + `vite build`) and a first smoke/integration test.
- [ ] Add the privacy policy / terms page required for platform review, then make the first real post.
