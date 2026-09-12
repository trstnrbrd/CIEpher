begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

-- 1. Players can't read the table directly.
set local role authenticated;
select throws_ok(
  'select * from public.login_failures',
  '42501',
  null,
  'players cannot read login failures'
);
set local role postgres;

-- The rest runs as the API.
set local role service_role;

-- 2. A username with no wrong passwords isn't locked.
select is(
  public.login_lock_seconds('player_x'),
  0,
  'a fresh username is not locked'
);

-- 3. Four wrong passwords: still not locked.
select is(
  array[
    public.record_login_failure('player_x'),
    public.record_login_failure('player_x'),
    public.record_login_failure('player_x'),
    public.record_login_failure('player_x')
  ],
  array[0, 0, 0, 0],
  'four wrong passwords do not lock'
);
select is(
  public.login_lock_seconds('player_x'),
  0,
  'still not locked after four'
);

-- 4. The fifth locks it for 15 minutes (900 seconds). Capitals don't matter.
select is(
  public.record_login_failure('PLAYER_X'),
  900,
  'the fifth wrong password locks for 15 minutes'
);
select is(
  public.login_lock_seconds('Player_X'),
  900,
  'the lock applies whatever the capitals'
);

-- 5. A correct password clears everything.
select lives_ok(
  $$select public.clear_login_failures('player_x')$$,
  'a correct login clears the count'
);
select is(
  public.login_lock_seconds('player_x'),
  0,
  'not locked after clearing'
);
set local role postgres;

-- 6. Old wrong passwords expire: 4 failures from 16 minutes ago don't count.
insert into public.login_failures (username_key, failed_count, first_failed_at)
values ('player_y', 4, now() - interval '16 minutes');
set local role service_role;
select is(
  public.record_login_failure('player_y'),
  0,
  'failures older than 15 minutes are forgotten'
);
set local role postgres;

-- 7. A lock ends by itself.
update public.login_failures
set locked_until = now() - interval '1 second'
where username_key = 'player_y';
set local role service_role;
select is(
  public.login_lock_seconds('player_y'),
  0,
  'an expired lock no longer blocks'
);
set local role postgres;

select * from finish();
rollback;
