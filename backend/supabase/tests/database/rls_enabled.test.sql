begin;
create extension if not exists pgtap with schema extensions;
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
