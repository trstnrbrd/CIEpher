# Database backups

The free Supabase plan makes no backups of its own. So a GitHub Actions job copies the database every night, locks the copy, and keeps it for 30 days.

## How it works

- `.github/workflows/backup.yml` runs every night at 02:00 Philippine time. To run it now: **Actions** → **Backup** → **Run workflow**.
- It copies the database and locks the copy with the public keys in `recipients.txt`. A public key can lock a backup but never unlock it, so GitHub never holds anything that can open the backups.
- Each copy is kept as a GitHub Actions artifact (a file attached to that night's run).
- If a night fails, GitHub emails the person who last changed the workflow. Check **Actions** when that happens.

## Setup

- **Secret** `SUPABASE_DB_URL` (repo Settings → Secrets and variables → Actions): the database's **session pooler** URI from the Supabase dashboard (**Connect** → **Direct** → **Session pooler**), with the database password filled in. Percent-encode symbols in the password (`@` → `%40`).
- **`recipients.txt`:** the public keys, one per line.

## The private key

Make the key pair once with `age-keygen -o C:\ciepher-keys\ciepher-backup.key`. It prints the public key (`age1...`); put that line in `recipients.txt`. The file is the private key:

- **Without it, the backups can't be opened.** Keep two copies: in a password manager and on a USB drive.
- **With it, anyone can read every player's data.** Never put it in Git, chat, email, or a synced folder (OneDrive, Google Drive), and never inside a Git repo's folder.

## Restoring

See `RESTORE.md`. Practice a restore every few months, so you know it works before you need it.

## Known limit: fine for staging, fix before real students

On GitHub Free, anyone who can push to this repo could write a workflow that reads `SUPABASE_DB_URL`, which gives full access to the database. That's acceptable while the database holds only test accounts. Before real students use the game, do one of these:

- Move the secret into a GitHub **environment** that only `develop` can use (needs GitHub Pro, free with the GitHub Student Developer Pack).
- Or move this job, its secret and its backups to a separate private repo that only the backend owner can access.

## Handover to the client

Either hand over the private key in person, or have the client make their own key pair and add their public key to `recipients.txt`. Backups made before that stay locked to the old keys only.
