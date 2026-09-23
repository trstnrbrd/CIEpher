# Restoring a CIEpher backup

Use this when the database is broken or data was deleted by mistake, and to practice: do a practice restore every few months and after big database changes.

**Last practice restore: 2026-09-23** (the backup of 2026-09-22, restored on a PC; all 73 database tests passed, 24 accounts / 21 profiles / 98 progress rows came back).

**Never restore over the live database.** Restore into a new, empty Supabase project. If the live project still works and only some rows were lost, restore into a new project and copy those rows back.

All commands are for PowerShell on Windows.

## What you need

- The private backup key file, `ciepher-backup.key` (see README.md)
- `age`: `winget install --id FiloSottile.age`. If `age` isn't found afterwards, add its folder (under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\FiloSottile.age_...\age`) to your user PATH, then restart the terminal and VS Code.
- Docker Desktop, running (it provides `psql`, so nothing else to install)
- This repo with `npm install` done in `backend` (for the checks in step 5)

## 1. Download a backup

GitHub → the CIEpher repo → **Actions** → **Backup** → open the night you want (each is kept 30 days) → **Artifacts** → download `ciepher-backup-<date>.tar.gz.age`.

Put it in a new, empty folder that is **not** inside a Git repo and **not** synced to OneDrive or Google Drive, for example `C:\ciepher-restore`.

## 2. Unlock it

In that folder:

```powershell
age -d -i C:\ciepher-keys\ciepher-backup.key -o backup.tar.gz ciepher-backup-<date>.tar.gz.age
tar -xzf backup.tar.gz
```

You now have `roles.sql`, `schema.sql` and `data.sql`. Copy `backups\before-schema.sql` from this repo into the same folder.

These files hold every player's email and password hash. Delete the folder as soon as you're done.

## 3. Get an empty database

Create a new Supabase project (Free plan, Singapore). Then **Connect** → **Direct** → **Session pooler** → copy the URI and put the database password in it. If the password contains symbols, percent-encode them (`@` → `%40`, `#` → `%23`, `/` → `%2F`), or reset it to letters and digits only.

To practice without touching the cloud, see "Practice restore" at the end.

## 4. Restore

In the folder from step 2, with the URI from step 3 in place of `DATABASE_URL`:

```powershell
docker run --rm -v "${PWD}:/w" -w /w postgres:17 psql --single-transaction --variable ON_ERROR_STOP=1 --file before-schema.sql --file schema.sql --command "SET session_replication_role = replica" --file data.sql --dbname "DATABASE_URL"
```

- It's all or nothing: if any line fails, nothing is saved. Fix the cause and run it again.
- **Don't skip `before-schema.sql`.** Without it, the restored database lets anyone look up players' emails (the file explains why).
- **If `data.sql` stops with "relation ... does not exist":** the backup came from a newer Supabase than the database you are restoring into. Supabase keeps updating the login system's own `auth.*` tables, and the cloud runs ahead of the CLI on your PC. Restoring into a **new cloud project** is safe, because it is the same age or newer. This only bites in the practice restore below.
- **`roles.sql` is left out on purpose.** It only holds Supabase's own role settings, which a new project already has, and one of its lines is always refused (`permission denied for parameter log_min_messages`). CIEpher has no roles of its own. If you ever add some, run `roles.sql` on its own first and ignore that one error.

## 5. Check it

In this repo's `backend` folder:

```powershell
npx supabase link --project-ref NEW_PROJECT_REF
npx supabase test db --linked
```

Every test must pass. Then log in to the game with a test account.

## 6. Switch the game to the restored project

In this repo's `backend` folder:

1. Tell the CLI that the migrations are already in place (the backup doesn't include the migration history). Run `npx supabase migration list --linked`, then mark every listed version as applied:
   ```powershell
   npx supabase migration repair --status applied VERSION1 VERSION2 ...
   ```
   Run `npx supabase migration list --linked` again: every migration must show on both sides.
2. `npx supabase config push`, and answer yes only to `auth`. If it refuses the email template, turn on custom SMTP in the dashboard first.
3. `npx supabase secrets set ALLOWED_ORIGINS=<the game's web address>`
4. `npx supabase functions deploy api`
5. In the frontend's hosting, update `VITE_API_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and redeploy.
6. On GitHub, update the `SUPABASE_DB_URL` secret, so the nightly backups follow the new project.

## What a restore brings back, and what it doesn't

- **Back:** player accounts and passwords, profiles, characters, mission progress, the missions and their answers, and all database rules and permissions.
- **Players must log in again:** login sessions are left out of backups on purpose.
- **Not in backups:** the login history (Supabase's auth audit log), Auth settings and Edge Function secrets (they come from this repo, steps 6.2 and 6.3), and files in Supabase Storage (the game doesn't use Storage).

## Practice restore (on your own PC)

This restores into a blank Supabase on your PC, on ports 553xx, next to your normal local stack.

1. Make an empty folder, e.g. `C:\ciepher-restore-test`, and in it run:
   ```powershell
   npx --prefix C:\path\to\CIEpher\backend supabase init
   ```
2. In `supabase\config.toml`, set `project_id = "restore-test"` and change every port starting with `543` to `553` (e.g. `54322` → `55322`).
3. Start it (only the database and login services):
   ```powershell
   npx --prefix C:\path\to\CIEpher\backend supabase start -x studio,realtime,storage-api,imgproxy,mailpit,logflare,vector,edge-runtime,postgres-meta,supavisor,postgrest
   ```
4. Do steps 1, 2 and 4 above, with `postgresql://postgres:postgres@host.docker.internal:55322/postgres` as `DATABASE_URL`.
   Before running step 4, take out the `auth.*` tables your PC's older login system doesn't have, or the restore stops at the first one and saves nothing (it is all or nothing). On 2026-09-23 those were `mfa_recovery_code_sets`, `mfa_recovery_codes`, `scim_tokens` and `scim_users`, all empty. Delete each one's block in `data.sql` — from its `COPY ... FROM stdin;` line down to the `\.` line — and check the block really is empty before you remove it. To see which tables your PC has:
   ```powershell
   docker run --rm postgres:17 psql -At -c "select table_schema||'.'||table_name from information_schema.tables where table_schema in ('auth','storage') order by 1" --dbname "postgresql://postgres:postgres@host.docker.internal:55322/postgres"
   ```
5. Check it: copy this repo's `backend\supabase\tests` folder into this folder's `supabase` folder, then run `npx --prefix C:\path\to\CIEpher\backend supabase test db`. Every test must pass.
   Take the tests from the commit the backup was made at, not from today: `answer_keys.test.sql` follows the content files, so a backup made before a new chapter was added fails against the current version. Use `git show <commit>:backend/supabase/tests/database/answer_keys.test.sql > supabase\tests\database\answer_keys.test.sql`.
6. Clean up: `npx --prefix C:\path\to\CIEpher\backend supabase stop --no-backup`, then delete both folders.
