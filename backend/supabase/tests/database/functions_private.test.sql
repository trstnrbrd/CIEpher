begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(1);

-- Functions in the public schema can be called by anyone through Supabase's API
-- unless we revoke that. Fails if any of our functions is callable by visitors
-- or players, and lists which ones.
select is(
  array(
    select p.proname::text
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (
        has_function_privilege('anon', p.oid, 'execute')
        or has_function_privilege('authenticated', p.oid, 'execute')
      )
    order by 1
  ),
  array[]::text[],
  'no function in the public schema is callable by visitors or players'
);

select * from finish();
rollback;
