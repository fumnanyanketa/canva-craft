# Metricool Lite — Project Plan

*A focused social-media scheduling tool for Instagram + TikTok. Shareable summary —
written for both technical and non-technical readers. Last updated: June 2026.*

---

## 1. The idea

[Metricool](https://metricool.com) does everything: 8+ social networks, analytics,
ads, inbox, link-in-bio. We're building the **stripped-down version done right**:
not fewer working features, but a **narrower scope that genuinely works
end-to-end** —

> **Connect your Instagram and TikTok → compose a post → put it on a calendar →
> it publishes automatically at the scheduled time → watch your numbers grow.**

Two platforms, chosen deliberately: IG and TikTok share the same short-form
visual content style, so one composer serves both. Once this slice is solid and
in real users' hands, we widen (more networks, deeper analytics, teams) on the
same foundation.

## 2. What exists today — current status

| Piece | Status |
| --- | --- |
| **Web app** — dashboard, analytics, content calendar, reports, multi-brand UI | ✅ Built |
| **Demo mode** — full app on realistic generated data, zero setup (great for showing people) | ✅ Built |
| **User accounts** — register / sign in | ✅ Built & tested |
| **Connect Instagram / TikTok** (OAuth, encrypted token storage) | ✅ Built — needs platform credentials to go live |
| **Media uploads** (images/videos hosted for publishing) | ✅ Built — needs an R2 storage bucket |
| **Real scheduling & auto-publishing** (scheduler + IG/TikTok publishers, retries, per-platform error reporting) | ✅ Built & pipeline-tested |
| **Real analytics ingestion** (daily follower/reach/engagement snapshots per account) | ✅ Built — dashboard switchover pending |
| **Deployed & posting to real accounts** | ⬜ Next — needs credentials + hosting (see §4) |
| **Public launch** (anyone can connect their accounts) | ⬜ Gated on Meta App Review + TikTok audit |

**Verification so far:** the whole backend was exercised end-to-end against a real
database — sign-up, account linking with encrypted tokens, post scheduling, the
scheduler claiming due posts, the publisher attempting real Instagram API calls,
failures captured and shown per platform, and analytics series served to the app.
The only untestable part from a development sandbox is a *successful* publish,
which requires real platform credentials — that's step one of §4.

## 3. How it works (30-second tour)

```
You (browser)                The server                       The platforms
─────────────                ──────────                       ─────────────
Sign in            ──────►   Your account
"Connect IG"       ──────►   Sends you to Instagram to approve, stores the
                             (encrypted) key it gets back
Compose + schedule ──────►   Saves the post + media
                             ⏰ Every minute: anything due?
                             Yes → publishes it           ──► Instagram / TikTok
                             📊 Daily: pulls follower/reach
                             numbers for your dashboard   ◄── Instagram / TikTok
```

Tech, for the technically curious: React + TypeScript web app; Node (Fastify) +
PostgreSQL backend; Cloudflare R2 for media; OAuth tokens encrypted at rest
(AES-256-GCM); platform integrations behind a single `Publisher` interface so
adding network #3 is additive, not a rewrite.

## 4. What's left to go live — and who does it

### Owner tasks (account/credential work — only the owner can do these)

1. **Meta (Instagram) developer setup** — create a Meta app, link your IG
   Business/Creator account + Facebook Page, add yourself as a tester, and start
   **Business Verification** (the single slowest item: 1–3 weeks, runs in the
   background). → exact steps in `SETUP.md` §A1.
2. **TikTok developer setup** — create a TikTok app with Login Kit + Content
   Posting + Display API, add yourself as a test user. → `SETUP.md` §A2.
3. **Provision infrastructure** (~15 minutes, free tiers): a Postgres database
   (Neon/Supabase), a Cloudflare R2 bucket, and a host for the server
   (Railway/Render). → `SETUP.md` Track B.
4. **A privacy policy + terms page** (required by both platforms for review —
   can be generated when needed).

### Development tasks (remaining build work)

5. Deploy the server + web app with the credentials from steps 1–3.
6. **First real post** to our own accounts — the milestone that proves it.
7. Switch the dashboard from demo data to the real analytics already being
   collected; polish from real-usage feedback.

### Launch gate (after it works for us)

8. Submit **Meta App Review** + **TikTok audit** so *anyone* can connect their
   accounts. Until TikTok's audit passes, TikTok posts publish as private —
   a platform rule for all unaudited apps, not a limitation of our code.

## 5. Deliberately out of scope (v1)

More networks (Facebook, X, LinkedIn, YouTube), ads, unified inbox, link-in-bio,
team seats. The architecture leaves the door open for each; none of them dilute
v1.

## 6. Running costs (estimate)

| Item | Cost |
| --- | --- |
| Database, media storage, web hosting (free tiers) | $0 to start |
| Server hosting | ~$5–10/month |
| Instagram & TikTok APIs | Free |

---

*Repo layout: web app at the root, backend in `server/`. Developer docs:
`README.md` (run it), `ARCHITECTURE.md` (how it's designed), `SETUP.md`
(credentials checklist).*
