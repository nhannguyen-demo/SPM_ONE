# Moving SPM ONE to a new Vercel account + new Supabase account

A step-by-step runbook. Written for someone who has not done this before.
Follow the parts **in order**. Do not delete anything old until Part 7.

**Time:** about 1–2 hours (plus DNS wait if you have a custom domain).
**Your machine:** Windows, using **Git Bash** for all terminal commands.
**Package manager:** `pnpm` (this project uses it — `npm` will not work correctly here).

---

## What is actually changing

Good news first: **you do not have to change any application code.**

This project uses Supabase as a *plain PostgreSQL database only*. There is no
Supabase Auth, no Supabase Storage, no Supabase client library. The app talks to
the database through Prisma using a single connection string.

So the entire migration is:

| Thing | What happens |
| --- | --- |
| Database connection | One env var value changes: `DATABASE_URL` |
| Login / sessions | New `AUTH_SECRET` → everyone gets logged out once (expected) |
| Hosting | New Vercel project imports the same Git repo |
| Code | **No changes required** |
| Your data | Either copied over (Part 2, Path B) or re-seeded fresh (Path A) |

Things you **cannot** move: Vercel Analytics history, deployment history, and old
preview URLs. They stay with the old account. That's normal.

---

## Before you start — have these ready

- [ ] Login for the **old** Vercel account (the one deploying today)
- [ ] Login for the **new** Vercel account
- [ ] Login for the **new** Supabase account
- [ ] Access to the GitHub repo for this project
- [ ] A password manager or a safe scratch file for secrets
- [ ] Node.js 20+ and pnpm installed (`node -v`, `pnpm -v` in Git Bash)

> **Rule for the whole guide:** never paste secrets into Slack, email, a git commit,
> or a public doc. `.env` is already git-ignored — keep it that way.

---

# Part 0 — Back up what you have (do not skip)

Once the old Vercel project is deleted, its environment variables are gone forever.
Copy them out **first**.

### 0.1 Save the old environment variables

1. Go to <https://vercel.com> and log in to the **old** account.
2. Click the SPM ONE project → **Settings** (top nav) → **Environment Variables** (left sidebar).
3. You will see a list of variables. For each one, click the **eye icon** (or the `…` menu → **Edit**) to reveal the value.
4. Copy every name and value into a local scratch file, e.g. `C:\Users\NhanNguyen\Desktop\old-vercel-env-backup.txt`.
5. Note which **Environment** each one is set for — Production, Preview, Development. The dropdown next to each variable shows this.

You are looking for at least these (some may not exist):

```
DATABASE_URL
AUTH_SECRET
AUTH_URL
AUTH_REQUIRE_EMAIL_VERIFICATION
AUTH_RATE_LIMIT_MAX
AUTH_RATE_LIMIT_WINDOW_SEC
SPM_ALLOW_SUPABASE_DIRECT
```

### 0.2 Note your custom domain (if any)

Still in the old project → **Settings** → **Domains**. Write down any domain that is
**not** a `*.vercel.app` address (e.g. `spm-one.yourcompany.com`). If the list only
has `*.vercel.app` entries, you can skip Part 6 later.

### 0.3 Decide: keep the old data, or start fresh?

This decision changes what you do in Part 2.

- **Path A — start fresh (easier, recommended).** The new database gets rebuilt from
  the project's seed data: users, sites/units/equipment, folders, dashboards.
  Anything users created in the live app (custom dashboards, comments, shares) is **lost**.
- **Path B — carry the data over.** You copy the real database contents to the new
  Supabase project. More steps, needs one extra tool installed.

If SPM ONE is still a demo/prototype and nobody has created work they'd miss, **choose Path A.**

- [ ] I chose Path ___

---

# Part 1 — Create the new Supabase project

### 1.1 Create the project

1. Go to <https://supabase.com> and log in to the **new** account.
2. Click **New project**.
3. Fill in:
   - **Organization**: pick the new account's org
   - **Name**: `spm-one` (or `spm-one-prod`)
   - **Database Password**: click **Generate a password**, then **immediately save it in your password manager**. You cannot read it back later.
   - **Region**: pick the one closest to your users
4. Click **Create new project** and wait 1–3 minutes until the dashboard says the project is ready.

### 1.2 Get the connection string — the RIGHT one

This is the step people get wrong. There are three connection strings and only one works here.

1. In the left sidebar click **Project Settings** (gear icon) → **Database**.
2. Scroll to **Connection string** / **Connection pooling**.
3. You will see options like:
   - ❌ **Direct connection** — host looks like `db.abcdefgh.supabase.co` → **DO NOT USE.** This project will refuse to start with it (it is often IPv6-only and unreachable from Vercel).
   - ✅ **Session pooler** (sometimes "Session mode") — host looks like `aws-0-region.pooler.supabase.com`, port **5432** → **USE THIS ONE.**
   - ❌ **Transaction pooler** — same host but port **6543** → do not use; this app's connection setup is not configured for it.
4. Copy the **Session pooler** URI. It looks like:

   ```
   postgresql://postgres.abcdefghijkl:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

5. Paste it into your scratch file and **replace `[YOUR-PASSWORD]`** with the database password you saved in step 1.1. Remove the square brackets too.

> If your password contains special characters like `@ : / ? # &`, they must be
> percent-encoded in the URL. Easiest fix: go to **Project Settings → Database →
> Reset database password**, generate a new one with letters and numbers only.

- [ ] I have a working `postgresql://...pooler.supabase.com:5432/postgres` string saved

---

# Part 2 — Set up the new database contents

All commands run in **Git Bash**, from the project folder:

```bash
cd /c/Nhan/SPM_ONE/SPM_ONE
```

### 2.1 Create your local `.env` file

There is currently no `.env` file in the project. Create one:

```bash
touch .env
```

Open it in VS Code and paste this, substituting your own values:

```dotenv
# The Session pooler URI from Part 1.2 — keep the double quotes
DATABASE_URL="postgresql://postgres.abcdefghijkl:YourPasswordHere@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Only needed for seeding (Path A). Pick any password you'll use to log in as the demo users.
SEED_DEFAULT_PASSWORD="ChooseAStrongPasswordHere"
```

Save the file. `.env` is already in `.gitignore`, so it will never be committed.

### 2.2 Install dependencies (if you haven't recently)

```bash
pnpm install
```

---

## Path A — Start fresh (recommended)

### A.1 Create the database tables

```bash
pnpm db:deploy
```

This runs `prisma migrate deploy`, which creates every table in the new Supabase database.

**Expected output:** something like `2 migrations found` and `All migrations have been successfully applied.`
If you get an error, jump to [Troubleshooting](#troubleshooting).

### A.2 Load the seed data

```bash
pnpm db:seed
```

This creates the demo users, the site/unit/equipment hierarchy, and the workspace
folders/dashboards. All users get the password from `SEED_DEFAULT_PASSWORD`.

The seeded login emails are things like `nhan.nguyen@spm-one.com`,
`product@spm-one.com` — see [lib/workspace/identity.ts](lib/workspace/identity.ts) for the full list.

### A.3 Confirm the tables exist

Go to the Supabase dashboard → **Table Editor** (left sidebar). You should see tables
like `User`, `Site`, `Unit`, `Equipment`, `Dashboard`, `Folder`. If `User` has rows, you're good.

➡️ Skip Path B, continue to **Part 3**.

---

## Path B — Carry the old data over

Only do this if you chose Path B in step 0.3.

### B.1 Install PostgreSQL command-line tools

You need `pg_dump` and `psql`. Windows does not have them by default.

1. Download the installer from <https://www.postgresql.org/download/windows/> → "Download the installer".
2. Choose **PostgreSQL 17** (or whichever major version matches your Supabase project — check Supabase → Project Settings → Infrastructure → Postgres version).
3. Run the installer. On the **Select Components** screen, **uncheck everything except "Command Line Tools"**. You do not want a local database server.
4. Finish the install, then **close and reopen Git Bash**.
5. Add the tools to your PATH for this session and verify:

   ```bash
   export PATH="$PATH:/c/Program Files/PostgreSQL/17/bin"
   pg_dump --version
   ```

   It should print a version number. If not, check the folder name (`17` may be a different number).

### B.2 Dump the OLD database

Get the **old** Supabase project's Session pooler URI the same way as Part 1.2
(log in to the old Supabase account). Then:

```bash
pg_dump "postgresql://OLD_CONNECTION_STRING_HERE" \
  --no-owner --no-privileges --no-comments \
  --schema=public \
  -f /c/Nhan/backup-spm-one.sql
```

**This file contains password hashes and all app data. Treat it as a secret and delete it when you're done.**

Check it isn't empty:

```bash
ls -lh /c/Nhan/backup-spm-one.sql
```

### B.3 Restore into the NEW database

The new database must be **empty** — do not run `pnpm db:deploy` before this.

```bash
psql "postgresql://NEW_CONNECTION_STRING_HERE" -f /c/Nhan/backup-spm-one.sql
```

You will see a lot of `CREATE TABLE` / `COPY` lines scroll past. A few `NOTICE` lines
are fine. Actual `ERROR:` lines are not — stop and check Troubleshooting.

### B.4 Reconcile Prisma's migration state

```bash
pnpm db:deploy
```

It should report that migrations are already applied, or apply nothing. Both are fine.

### B.5 Confirm

Supabase dashboard → **Table Editor** → open `User`. Your real users should be there.

---

# Part 3 — Test locally before deploying

This catches 90% of problems before Vercel is involved.

```bash
pnpm dev
```

Open <http://localhost:3000> in your browser and:

- [ ] The login page loads
- [ ] You can log in (Path A: a seeded email + your `SEED_DEFAULT_PASSWORD`; Path B: your real account)
- [ ] Dashboards and equipment pages show data, not empty states

Stop the server with `Ctrl+C` when done.

**Do not continue until local login works.** If the app can't reach the database
locally, it won't work on Vercel either.

---

# Part 4 — Create the new Vercel project

### 4.1 Give the new Vercel account access to the repo

1. Log in to <https://vercel.com> with the **new** account.
2. Click **Add New…** → **Project**.
3. Under "Import Git Repository", click **Connect GitHub Account** (or **Adjust GitHub App Permissions**).
4. Approve the Vercel GitHub app and grant it access to the SPM ONE repository.
   - If the repo belongs to a **GitHub organization**, an org admin must approve this. Ask them before you start if you're not an admin.

### 4.2 Import the repo — but do NOT deploy yet

1. Find the SPM ONE repo in the list and click **Import**.
2. Vercel should auto-detect **Next.js** as the framework. Leave Build Command,
   Output Directory, and Install Command on their defaults — this project's
   `package.json` already handles Prisma during build.
3. **Before clicking Deploy**, expand the **Environment Variables** section and add the variables below.

### 4.3 Generate a new AUTH_SECRET

In Git Bash:

```bash
openssl rand -base64 32
```

Copy the output (a random string). If `openssl` isn't available, use:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4.4 Add the environment variables

Add each of these. **Do not wrap values in quotes** in the Vercel UI — paste the raw value.

| Name | Value | Environments |
| --- | --- | --- |
| `DATABASE_URL` | Your new Session pooler URI from Part 1.2 | Production **and** Preview |
| `AUTH_SECRET` | The random string from 4.3 | Production **and** Preview |
| `AUTH_URL` | `https://your-project.vercel.app` (you'll fix this in 4.6) | Production |

Optional — only add these if they were in your Part 0 backup and you want to keep them:

| Name | What it does | Default if omitted |
| --- | --- | --- |
| `AUTH_RATE_LIMIT_MAX` | Max login attempts per IP per window | 20 |
| `AUTH_RATE_LIMIT_WINDOW_SEC` | Length of that window, in seconds | 900 (15 min) |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `true` blocks unverified users from logging in | off |

Do **not** set `SEED_DEFAULT_PASSWORD` on Vercel — seeding is a local-only operation.
Do **not** set `SPM_ALLOW_SUPABASE_DIRECT` — you're using the correct pooler URL.

### 4.5 Deploy

Click **Deploy** and wait for the build (2–5 minutes). If the build fails, see Troubleshooting.

### 4.6 Fix AUTH_URL, then redeploy

1. When the deploy succeeds, Vercel shows you the live URL, e.g. `https://spm-one-abc123.vercel.app`.
2. Go to **Settings → Environment Variables**, edit `AUTH_URL`, and set it to exactly that URL — `https://`, no trailing slash.
3. Go to the **Deployments** tab → the `…` menu on the latest deployment → **Redeploy**.
   Env var changes only take effect on a new deployment.

---

# Part 5 — Verify the new deployment

Open the new `*.vercel.app` URL and check:

- [ ] The site loads
- [ ] You can **log in** (this is the real test — it proves Vercel can reach the new database)
- [ ] Dashboards load with data
- [ ] Create a test dashboard, refresh the page, confirm it persisted
- [ ] Log out and back in

If login fails, that is almost always `DATABASE_URL` or `AUTH_URL`. See Troubleshooting.

**The old site is still running and untouched at this point.** Nothing is broken yet
if something here goes wrong — you can take your time.

---

# Part 6 — Move the custom domain

Skip this entirely if you only use `*.vercel.app` URLs.

⚠️ There will be a few minutes of downtime. Do this at a quiet time.
Two Vercel projects cannot claim the same domain, so it must be removed from the old
project **before** it can be added to the new one.

1. **Old** Vercel account → old project → **Settings → Domains** → find your domain → `…` → **Remove**.
2. **New** Vercel account → new project → **Settings → Domains** → type the domain → **Add**.
3. Vercel shows the DNS records it needs (usually an `A` record to `76.76.21.21`, or a `CNAME` to `cname.vercel-dns.com`).
   - If your DNS is managed elsewhere (GoDaddy, Cloudflare, your IT team), update the records there to match exactly what Vercel shows.
   - If the *domain itself* is registered inside the old Vercel account, you'll need to move the domain between accounts too — in that case, ask Vercel support rather than improvising.
4. Wait for Vercel to show **Valid Configuration** and issue the SSL certificate. Usually a few minutes; DNS can take up to a few hours.
5. Update `AUTH_URL` to the custom domain (e.g. `https://spm-one.yourcompany.com`) and **redeploy** again.
6. Test login on the custom domain.

---

# Part 7 — Clean up (only after everything works)

Wait at least a few days before this part. The old setup is your rollback plan.

- [ ] **Old Vercel project:** old account → project → **Settings** → scroll to the bottom → **Delete Project**.
- [ ] **Old Supabase project:** do **not** delete immediately. Use **Project Settings → General → Pause project** first. Delete only once you're certain — after deletion the data is unrecoverable.
- [ ] Delete `/c/Nhan/backup-spm-one.sql` if you created one in Path B (it contains password hashes).
- [ ] Delete your env backup scratch file from step 0.1.
- [ ] Rotate the **old** Supabase database password (old Supabase → Project Settings → Database → Reset database password) so the retired connection string is dead.

---

# Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Error mentioning `db.<something>.supabase.co` and "direct host" | You used the Direct connection string | Go back to Part 1.2 and use the **Session pooler** URI (`*.pooler.supabase.com`, port 5432) |
| `DATABASE_URL must be a PostgreSQL URL` | Value is missing, empty, or doesn't start with `postgresql://` | Check for stray quotes or spaces. In the Vercel UI the value must have **no** surrounding quotes |
| `P1001 Can't reach database server` | Wrong host, wrong port, or database is paused | Confirm the pooler host and port 5432; check the Supabase project isn't paused |
| `password authentication failed` | Wrong password, or `[YOUR-PASSWORD]` placeholder left in the string | Reset the DB password in Supabase (letters + numbers only) and rebuild the URI |
| Site loads but login always fails | `DATABASE_URL` set for the wrong environment, or the DB has no users | Check the variable is set for **Production**; run `pnpm db:seed` locally against the same URL |
| Login redirects in a loop / session doesn't stick | `AUTH_URL` doesn't match the URL in your browser | Set `AUTH_URL` to the exact origin, `https://`, no trailing slash, then redeploy |
| "Equipment not found" or empty dashboards | Database has tables but no seed data | Run `pnpm db:seed` locally with `.env` pointing at the new database |
| Build fails on Vercel with a Prisma error | Usually missing `DATABASE_URL`, or the repo wasn't fully pushed | Confirm the env var exists, then check that your latest commits are pushed to the branch Vercel is deploying |
| Env var change didn't do anything | Vercel bakes env vars in at deploy time | Redeploy after every env var change |
| Everyone got logged out after the switch | Expected — `AUTH_SECRET` changed | Nothing to fix; people just sign in again |

---

# Appendix — environment variable reference

| Variable | Required? | Where | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | **Yes** | Local `.env` + Vercel | Supabase **Session pooler** URI. Read in [lib/prisma.ts](lib/prisma.ts) |
| `AUTH_SECRET` | **Yes in production** | Vercel | Signs session cookies. Changing it logs everyone out |
| `AUTH_URL` | **Yes in production** | Vercel | Canonical HTTPS origin |
| `SEED_DEFAULT_PASSWORD` | Only for seeding | Local `.env` only | Password given to all seeded users |
| `SEED_PASSWORD_<NAME>` | Optional | Local `.env` only | Per-user override, e.g. `SEED_PASSWORD_NHAN` |
| `AUTH_RATE_LIMIT_MAX` | No | Vercel | Default 20. See [middleware.ts](middleware.ts) |
| `AUTH_RATE_LIMIT_WINDOW_SEC` | No | Vercel | Default 900 |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | No | Vercel | Only set `true` if `User.emailVerified` is populated |
| `SPM_ALLOW_SUPABASE_DIRECT` | No | — | Escape hatch to bypass the direct-host check. Don't use it |

# Appendix — useful commands

```bash
cd /c/Nhan/SPM_ONE/SPM_ONE

pnpm install        # install dependencies
pnpm db:deploy      # create/update tables in the database from prisma/migrations
pnpm db:seed        # load demo users + workspace data
pnpm dev            # run locally at http://localhost:3000
pnpm build          # reproduce the Vercel build locally to debug build failures
```
