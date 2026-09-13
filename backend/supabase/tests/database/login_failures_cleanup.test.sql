begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

-- Failed-login rows of different ages. Everything here is rolled back.
insert into public.login_failures
  (username_key, failed_count, first_failed_at, locked_until)
values
  -- Two days old: nothing left to do.
  ('old_guess', 3, now() - interval '2 days', null),
  -- Two days old, and its lock ended long ago.
  ('old_lock', 5, now() - interval '2 days', now() - interval '2 days' + interval '20 minutes'),
  -- A few hours old: kept for a day, in case it needs looking into.
  ('recent_guess', 2, now() - interval '3 hours', null),
  -- Locked right now.
  ('locked_now', 5, now() - interval '5 minutes', now() + interval '10 minutes'),
  -- Can't happen with today's rules (locks last 15 minutes), but if they ever
  -- change: an old row whose lock is still running must stay.
  ('long_lock', 5, now() - interval '2 days', now() + interval '1 hour');

-- 1. One new wrong password, as the API sends it: not locked yet.
set local role service_role;
select is(
  public.record_login_failure('someone_new'),
  0,
  'a first wrong password does not lock'
);
set local role postgres;

-- 2. It deleted the rows more than a day old.
select is_empty(
  $$select 1 from public.login_failures
    where username_key in ('old_guess', 'old_lock')$$,
  'rows more than a day old are deleted'
);

-- 3. Rows from the last day stay.
select isnt_empty(
  $$select 1 from public.login_failures where username_key = 'recent_guess'$$,
  'rows from the last day are kept'
);

-- 4. A locked username stays locked.
select ok(
  public.login_lock_seconds('locked_now') > 0,
  'a locked username stays locked'
);

-- 5. An old row whose lock is still running stays.
select ok(
  public.login_lock_seconds('long_lock') > 0,
  'a lock that is still running is never deleted'
);

-- 6. The new wrong password is recorded as usual.
select results_eq(
  $$select failed_count from public.login_failures
    where username_key = 'someone_new'$$,
  $$values (1)$$,
  'the new wrong password is recorded'
);

-- 7. The delete uses an index, so it stays fast however big the table gets.
select has_index(
  'public', 'login_failures', 'login_failures_first_failed_at_idx',
  array['first_failed_at'],
  'first_failed_at has an index'
);

-- 8. Replacing the function kept its permission: the API can still run it.
select ok(
  has_function_privilege('service_role', 'public.record_login_failure(text)', 'execute'),
  'the API can still record wrong passwords'
);

select * from finish();
rollback;
