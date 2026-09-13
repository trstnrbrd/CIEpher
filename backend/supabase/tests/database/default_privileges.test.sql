-- New objects in "public" must start closed to players, in every environment
-- (see the private_by_default migration). Run against staging with
-- `npx supabase test db --linked`, this catches a cloud project that still
-- opens new objects to players by default.
begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

-- 1. What the defaults give players, for each kind of object.
select is_empty(
  $$
    select d.defaclobjtype::text, a.grantee::regrole::text, a.privilege_type
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) a
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 'public'::regnamespace
      and a.grantee in ('anon'::regrole, 'authenticated'::regrole)
      and (
        (d.defaclobjtype = 'r' and a.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
        or (d.defaclobjtype = 'f' and a.privilege_type = 'EXECUTE')
        or (d.defaclobjtype = 'S' and a.privilege_type in ('SELECT', 'USAGE'))
      )
  $$,
  'new tables, functions and sequences in public give players nothing by default'
);

-- 2-3. And in practice: a brand-new table is closed to both player roles.
create table public.default_privileges_probe (id int);

select ok(
  not has_table_privilege('anon', 'public.default_privileges_probe', 'select, insert, update, delete'),
  'a new table is closed to anon'
);

select ok(
  not has_table_privilege('authenticated', 'public.default_privileges_probe', 'select, insert, update, delete'),
  'a new table is closed to logged-in players'
);

select * from finish();
rollback;
