begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(1);

-- Fails if any table in the public schema has row-level security turned off,
-- and lists which ones.
select is(
  array(
    select tablename::text from pg_tables
    where schemaname = 'public' and not rowsecurity
    order by 1
  ),
  array[]::text[],
  'every table in the public schema has row-level security on'
);

select * from finish();
rollback;
