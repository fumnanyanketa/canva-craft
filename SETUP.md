# Setup & Prerequisites

This is the **action checklist** to take Metricool Lite from "runs on demo data" to
"really posts to Instagram + TikTok and pulls real analytics."

Two tracks run in parallel:

- **Track A — Platform access (only you can do this; it's the long pole).** Start now.
- **Track B — Code.** Buildable immediately; testable against your own accounts
  once Track A's *development* credentials exist (App Review/audit only gate
  *public* launch, not your own testing).

---

## Track A — Platform access

### A1. Instagram (via Meta)

Instagram posting/analytics goes through the **Instagram Graph API**, not a
standalone Instagram API. Requirements:

1. **A Meta developer account** → https://developers.facebook.com
2. **Create an app** (type: *Business*).
3. **The target Instagram account must be Business or Creator** and **linked to a
   Facebook Page**. (Personal IG accounts cannot be posted to via API — this is a
   hard platform rule that also affects your future users.)
4. **Permissions (scopes) you'll request:**
   - `instagram_basic`
   - `instagram_content_publish` — *posting*
   - `instagram_manage_insights` — *analytics (reach, impressions, follower count)*
   - `pages_show_list`, `pages_read_engagement`, `business_management`
5. **For your own testing:** add your IG/FB accounts as **app roles**
   (admin/developer/tester). With default ("standard") access you can call the API
   for these accounts **without App Review** — this is how we build & test.
6. **For public users (launch gate):** complete **Business Verification** and pass
   **App Review** for the scopes above. Meta requires a privacy-policy URL, a
   screencast of the flow, and a description. Budget 1–3 weeks.

What you'll hand to the code (env vars): `META_APP_ID`, `META_APP_SECRET`,
`META_REDIRECT_URI`.

Docs: Instagram Platform → Content Publishing, and IG User Insights.

### A2. TikTok

TikTok posting goes through the **Content Posting API**; analytics through the
**Display API**.

1. **A TikTok developer account** → https://developers.tiktok.com
2. **Create an app**, add the **Login Kit**, **Content Posting API**, and
   **Display API** products.
3. **Scopes:**
   - `video.publish` (Direct Post) and/or `video.upload` (send to drafts) — *posting*
   - `user.info.basic`, `user.info.stats` — *follower count / profile*
   - `video.list` — *per-video analytics (views, likes, comments, shares)*
4. **Verify your domain** and set the **redirect URI**.
5. **Unaudited app reality:** until your app passes TikTok's **audit**, it can only
   post **privately / self-only** (or to the user's drafts) and only for accounts
   added to the app. Perfect for building & testing; not yet for public posting.
6. **Launch gate:** submit for **audit** to enable public Direct Post.

What you'll hand to the code (env vars): `TIKTOK_CLIENT_KEY`,
`TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`.

### A3. Things both platforms will ask you for

- A deployed **HTTPS URL** for the app (redirect URIs must be https; localhost is
  allowed for dev on both).
- A **privacy policy** and **terms** URL.
- For review/audit: a short **screencast** demonstrating connect → post.

---

## Track B — Infrastructure you'll provision

Pick managed services so there's nothing to babysit. Free tiers cover dev.

| Need | Recommendation | Env vars |
| --- | --- | --- |
| Postgres database | Neon or Supabase | `DATABASE_URL` |
| Media storage (public URLs) | Cloudflare R2 (S3-compatible) | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` |
| Backend hosting | Railway / Render / Fly.io | — |
| Frontend hosting | Vercel / Netlify / Cloudflare Pages | `VITE_API_URL` |
| Token encryption | a 32-byte secret you generate | `TOKEN_ENCRYPTION_KEY` |

Generate the encryption key: `openssl rand -base64 32`.

---

## The `.env` you'll end up with (server)

```
DATABASE_URL=postgres://...
TOKEN_ENCRYPTION_KEY=...            # openssl rand -base64 32
APP_BASE_URL=https://your-app.com   # for OAuth redirects

META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://your-app.com/api/oauth/instagram/callback

TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://your-app.com/api/oauth/tiktok/callback

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=metricool-media
R2_PUBLIC_URL=https://media.your-app.com
```

---

## Suggested order of operations

1. **Today:** create the Meta app + TikTok app, add yourself as a test user, grab
   the dev client IDs/secrets. Kick off Business Verification on Meta (slowest step).
2. Provision Postgres + R2 (5 minutes each).
3. We build the backend (Track B code) and test posting to *your own* IG + TikTok.
4. Once solid, submit Meta App Review + TikTok audit to open it to the public.
