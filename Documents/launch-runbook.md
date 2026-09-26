# Launch runbook: putting CIEpher in production

Follow this top to bottom, once, when production is created. Every step says **where** to run it. Tick each box as you go. Don't skip the checks in part 7: they are how you know it works before a single student sees it.

**Never paste a password, a `service_role` / secret key, the database URL or the Gmail app password into a chat, a file in this repo, or a commit.** Type them straight into PowerShell or the dashboard.

---

## 0. Before you start

You need all of these. If one is missing, stop here.

- [ ] The client's **Supabase** account and **Cloudflare** account, with you added as a member.
- [ ] The Gmail **app password** for `ciepher1@gmail.com` (2-Step Verification must be on).
- [ ] The **privacy notice** text approved by the client's adviser, and shown on the Register screen.
- [ ] The frontend screens finished: chapters 5, 6, 7 and the final exam (using `Documents/epilogue-choice-order.md`).
- [ ] `develop` is green on GitHub and plays end to end on staging.

## 1. Create the Supabase project

In the client's Supabase dashboard:

1. **New project** → name `ciepher-production`, plan **Free**, region **Southeast Asia (Singapore)**.
2. Generate a strong database password and save it in a password manager. You will need it several times below.
3. When it's ready, copy the **project ref** (the 20 letters in the dashboard address, like `ljdxoyttpyrvbibazxyv` is for staging).

Now, in the PowerShell window you'll use for the rest of this runbook, set these two once. These are the only values you type by hand; every command below uses them.

```powershell
$PROD_REF = "the-20-letter-ref"
$PROD_URL = "https://$PROD_REF.supabase.co"
```

## 2. Build the database

From `backend\`:

```powershell
cd C:\Users\Administrator\OneDrive\Desktop\Projects\Ciepher\backend
npx supabase db push --project-ref $PROD_REF --dry-run
```

It lists every migration it would apply: all of `backend/supabase/migrations/` (21 on 2026-09-24, more if you've added some since). If that looks right:

```powershell
npx supabase db push --project-ref $PROD_REF
npx supabase test db --project-ref $PROD_REF
```

- [ ] All database tests pass (106 or more).

## 3. Auth settings, email and the pooler

Add this block to the **end** of `backend/supabase/config.toml`, with your ref and the site address from part 5 in it. It holds no secrets, so it gets committed with the release.

```toml
# ---------------------------------------------------------------------------
# Production only (see Documents/launch-runbook.md).
# ---------------------------------------------------------------------------
[remotes.production]
project_id = "the-20-letter-ref"

[remotes.production.auth]
site_url = "https://the-production-site-address"
additional_redirect_urls = ["https://the-production-site-address"]

[remotes.production.auth.email.smtp]
enabled = true
host = "smtp.gmail.com"
port = 465
user = "ciepher1@gmail.com"
pass = "env(CIEPHER_SMTP_PASSWORD)"
admin_email = "ciepher1@gmail.com"
sender_name = "CIEpher"

[remotes.production.db.pooler]
default_pool_size = 15
max_client_conn = 200
```

Then preview before pushing:

```powershell
$env:CIEPHER_SMTP_PASSWORD = "paste-the-app-password-here"
npx supabase config diff --project-ref $PROD_REF
```

Check the list:
- [ ] `site_url` and the redirect URLs become the production site, **not localhost**.
- [ ] SMTP becomes enabled, with the Gmail.
- [ ] **Nothing under `db.pooler` changes.** If it does, copy the numbers shown as "remote" into the pooler block above and run `config diff` again. Lowering `max_client_conn` would hurt a full class.

```powershell
npx supabase config push --project-ref $PROD_REF
Remove-Item Env:CIEPHER_SMTP_PASSWORD
```

Answer **yes** to auth, and yes to the others only if the diff showed changes you expected.

- [ ] Dashboard → Authentication → Sign In / Providers: **"Allow new users to sign up" is OFF.** This is the setting `enable_signup = false` pushed above. If it's on, anyone with the public key could create accounts that skip our API, the robot check and the username rules.

## 4. Server secrets and the API

Still from `backend\`. The Sentry DSN is the same one staging uses (Sentry → project `deno` → Settings → Client Keys).

```powershell
npx supabase secrets set --project-ref $PROD_REF "ALLOWED_ORIGINS=https://the-production-site-address" SENTRY_ENVIRONMENT=production
npx supabase secrets set --project-ref $PROD_REF SENTRY_DSN=paste-the-dsn-here
npx supabase functions deploy api --project-ref $PROD_REF
curl.exe "$PROD_URL/functions/v1/api/health"
```

- [ ] The last line prints `{"status":"ok"}`.
- [ ] `ALLOWED_ORIGINS` is **only** the production site. No `localhost` in production.
- [ ] **Don't set `TURNSTILE_SECRET_KEY` yet.** That's the robot check's on-switch, and it goes last (part 6).

## 5. The website on Cloudflare

In the client's Cloudflare dashboard:

1. **Turnstile** → Add widget → name `ciepher`, mode **Managed**, hostname: the production site's host (for example `ciepher.their-subdomain.workers.dev`, without `https://`). Keep the **site key** (public) and the **secret key** (secret) for later.
2. **Workers & Pages** → Create → Import a repository → `trstnrbrd/CIEpher`. (The Cloudflare GitHub app needs your approval on the repo.)
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Production branch: **`main`**
3. Settings → Build → **Variables**, all four:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://the-20-letter-ref.supabase.co/functions/v1/api` |
| `VITE_SUPABASE_URL` | `https://the-20-letter-ref.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API keys → the **publishable** key (public by design) |
| `VITE_TURNSTILE_SITE_KEY` | the Turnstile **site** key from step 1 |

**Releasing to `main`.** Staging builds from `develop`; production builds from `main`, so students only get what you deliberately release. One GitHub change first: `main` must accept **merge commits** from `develop`. With squash-only, every release after the first conflicts, because squashing never records that `develop` was merged. In GitHub → Settings → Rules → Rulesets: keep `develop` squash-only, and give `main` its own ruleset that allows **merge commits** (PR required, same status checks).

Then release: open a PR from `develop` into `main` and merge it with **"Create a merge commit"**. Cloudflare builds and deploys it in a couple of minutes.

- [ ] The production site opens and shows the game.

## 6. Switch on the robot check

The site now has the site key, so the widget shows. Turn on the check itself:

```powershell
npx supabase secrets set --project-ref $PROD_REF TURNSTILE_SECRET_KEY=paste-the-turnstile-secret-here
```

- [ ] Register a test account on the production site: the "I'm not a robot" box appears and registering works.

## 7. Prove it works (don't skip)

Use test accounts only. Everything here is deleted in part 8.

**Security**
```powershell
curl.exe -s -o NUL -D - -X OPTIONS -H "Origin: https://not-our-site.example" -H "Access-Control-Request-Method: POST" "$PROD_URL/functions/v1/api/auth/login"
```
- [ ] No `access-control-allow-origin` line appears: other websites are refused.

**Email**
- [ ] Register a test account with **your own** email, then "Forgot password?". The email arrives from CIEpher within a minute, and its link opens the **production site**, not localhost. Set a new password and log in with it.

**The game**
- [ ] Play the prologue and chapter 1. Type one wrong answer on purpose: the red marks appear.
- [ ] Switch Wi-Fi off, press EXECUTE, switch it on, press EXECUTE again: it goes through.

**100 students at once** — from `backend\loadtest\`. The service key is in the dashboard → Project Settings → API keys (`service_role` / secret). Type it here only.

```powershell
cd C:\Users\Administrator\OneDrive\Desktop\Projects\Ciepher\backend\loadtest
$env:SB_URL = $PROD_URL
$env:API = "$PROD_URL/functions/v1/api"
$env:SB_SERVICE_KEY = "paste-the-service-key-here"
node seed-accounts.mjs 100
node loadtest.mjs 100
node seed-accounts.mjs delete
Remove-Item Env:SB_SERVICE_KEY
```
- [ ] "server errors and timeouts: 0". (Staging's result: 99/99 finished, 0 errors, submit about 1.1 s.)

**Backups** — the nightly backup must follow production. In GitHub → Settings → Secrets and variables → Actions, set `SUPABASE_DB_URL` to production's **Session pooler** URI (Supabase → Connect → Session pooler, with the database password in it; percent-encode symbols, `@` → `%40`).

Also point the keep-alive at production: on a `chore/` branch, change the `API_URL` line in `.github/workflows/keep-alive.yml` to `https://the-20-letter-ref.supabase.co/functions/v1/api`, and PR it into `develop`. Without this, production pauses after a week with no students (a school break is enough).

- [ ] GitHub → Actions → Backup → **Run workflow**: it succeeds.
- [ ] Restore that backup on your PC with `backups/RESTORE.md` ("Practice restore"): every database test passes.
- [ ] GitHub → Actions → Keep-alive → **Run workflow**: it succeeds.

Staging no longer gets the keep-alive's database check after this. That's fine; if it pauses, restore it from its dashboard when you need it.

**The study export**
```powershell
cd C:\Users\Administrator\OneDrive\Desktop\Projects\Ciepher\backend
$env:STUDY_DB_URL = "paste-the-session-pooler-url-here"
npm run study:export
Remove-Item Env:STUDY_DB_URL
```
- [ ] It writes the CSVs. Delete the `study-export` folder afterwards.

## 8. Clean up, then go live

In the production SQL Editor, look first:

```sql
select u.email, p.username, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at;
```

Every row must be a test account of yours. Then delete them (the database removes each one's progress, answers and exam attempts with it):

```sql
delete from auth.users;
```

**Only run that before any student has registered.** After launch, delete one account at a time with `where email = '...'`.

- [ ] `select count(*) from public.profiles;` returns **0**.
- [ ] Send the students the production link.

## During the study

- Only urgent fixes go into `main`, and never during class hours.
- Never run `config push`, `db push` or a deploy while students are playing.
- Check Sentry once a day, and that each night's backup succeeded (GitHub → Actions → Backup).
- To get the results: `npm run study:export` with `STUDY_DB_URL` set, as in part 7.

## If a release breaks something

- **The website:** Cloudflare → the Worker → **Deployments** → roll back to the previous version. It takes seconds. Then fix it properly on `develop`.
- **The API:** deploy the previous release's code again:
  ```powershell
  cd C:\Users\Administrator\OneDrive\Desktop\Projects\Ciepher
  git switch --detach main~1
  cd backend
  npx supabase functions deploy api --project-ref $PROD_REF
  cd ..
  git switch develop
  ```
- **The database:** never undo a migration. Write a new migration that fixes it, test it on staging, then `db push`.
