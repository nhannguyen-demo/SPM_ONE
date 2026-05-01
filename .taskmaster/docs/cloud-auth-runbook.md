# Cloud-auth initiative — operations checklist

Short owner-facing checklist for PostgreSQL + Auth.js + Workspace bootstrap (aligned with `PROJECT.md` Manual setup).

## Prerequisites

1. **PostgreSQL** — e.g. Supabase; **`DATABASE_URL`** must use a reachable URI (prefer Session pooler over IPv6-only direct host on IPv4 networks — see `PROJECT.md`).
2. **Apply migrations** — `pnpm db:deploy` (or `pnpm exec prisma migrate deploy`) against that database.
3. **Secrets in `.env`** (and later Vercel project env):
   - `DATABASE_URL`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `SEED_DEFAULT_PASSWORD` / optional `SEED_PASSWORD_*` for `pnpm db:seed`

## Prisma 7 configuration

- Connection URL is loaded per **`prisma.config.ts`** (Prisma 7 pattern); ensure deploy/runtime injects **`DATABASE_URL`** before running migrations or the app.

## Seed and smoke test

1. Run **`pnpm db:seed`** — creates users, Site/Unit/Equipment from `lib/data.ts`, then **WORKSPACE_SEED** via `prisma/seed-workspace.ts`.
2. Open **`/login`**, sign in with a seeded user (e.g. Nhan from seed).
3. Open **`/dashboard`** — expect folders/dashboards if seed ran; create dashboard for **equipment-a** / **equipment-b** / **equipment-c** as appropriate.
4. Optional: second browser or incognito with another seeded user — same server data for shared/org flows.

## Production vs local identity

- **Production** client: workspace “current user” is **session-bound**; `localStorage` cannot override the id.
- **Development**: legacy mock storage may still apply when `NODE_ENV !== 'production'` (see `lib/workspace/identity.ts`).

## Auth hardening (rate limits, headers, cookies)

- **Rate limiting:** `middleware.ts` applies a sliding-window limit to **POST** requests under **`/api/auth/*`** (per-client IP from `x-forwarded-for` / `x-real-ip`). Tune with **`AUTH_RATE_LIMIT_MAX`** (default 20) and **`AUTH_RATE_LIMIT_WINDOW_SEC`** (default 900). Returns **429** with **`Retry-After`**. In-memory per Edge isolate — for strict global limits across regions, use **Upstash Redis** + external middleware (future).
- **Security headers:** Same middleware sets **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy**, **Permissions-Policy**, and **HSTS** (production only).
- **Session cookie:** `auth.ts` sets **`httpOnly`**, **`sameSite: lax`**, **`secure`** in production for the JWT session cookie.
- **Custom domain / HTTPS:** Deploy behind HTTPS (e.g. Vercel); set **`AUTH_URL`** to your canonical origin so cookie scope matches your domain.
- **Optional verified-email gate:** Set **`AUTH_REQUIRE_EMAIL_VERIFICATION=true`** only if **`User.emailVerified`** is populated for allowed users. No verification-email sender is included yet — use DB/admin updates until an email provider is wired.

## Explicit product decisions (unchanged)

- Change log, activity free-text, and similar strings may remain mock until a later epic migrates them to audit-backed rows.
