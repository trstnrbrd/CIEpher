-- Run right before schema.sql when restoring (see RESTORE.md).
--
-- A new Supabase project grants every new table, function and sequence in
-- "public" to anon, authenticated and service_role. The CIEpher migrations
-- take some of those grants back (e.g. players must never run
-- login_email_for_username), but a backup only records who has access, not
-- who must lose it. Without this file, a restored database lets anyone look
-- up players' emails. So turn the automatic grants off while schema.sql
-- recreates everything: each object then gets exactly the access it had.
-- The last lines of schema.sql turn the automatic grants back on.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
