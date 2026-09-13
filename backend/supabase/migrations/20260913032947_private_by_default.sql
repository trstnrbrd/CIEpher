-- New tables, functions and sequences in "public" start with no access for
-- players (anon, authenticated) or service_role: each migration grants exactly
-- what it needs.
--
-- Locally (and in CI) config.toml's auto_expose_new_tables = false already does
-- this. A cloud project defaults to the opposite and gives those roles full
-- access to every new object, so a migration that forgot a revoke would pass
-- every test and still be open on staging or production. This makes the cloud
-- match. It changes only what future objects get; existing grants stay.
--
-- Functions still get EXECUTE for PUBLIC, a built-in Postgres default; every
-- function migration revokes it (see the functions_private test).
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke select, usage on sequences from anon, authenticated, service_role;
