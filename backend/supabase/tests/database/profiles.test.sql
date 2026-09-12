begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

-- Test players. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'player_b@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'player_c@test.local');

insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'player_a', now()),
  ('22222222-2222-2222-2222-222222222222', 'player_b', now());

-- 1. Visitors who aren't logged in can't read profiles at all.
set local role anon;
select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'anonymous visitors cannot read profiles'
);
set local role postgres;

-- From here on, act as player A.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- 2. Player A sees only their own profile.
select results_eq(
  'select username from public.profiles',
  array['player_a'],
  'player A sees only their own profile'
);

-- 3. Player A can choose their own character.
select lives_ok(
  $$update public.profiles set character = 'girl' where id = '11111111-1111-1111-1111-111111111111'$$,
  'player A can choose their own character'
);

-- 4. Player A can't change their username directly (only the API can).
select throws_ok(
  $$update public.profiles set username = 'hacker' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'players cannot change their username directly'
);

-- Player A tries to change player B's character. RLS hides B's row, so nothing happens.
update public.profiles set character = 'boy' where id = '22222222-2222-2222-2222-222222222222';

-- Check the results as the database admin.
set local role postgres;

-- 5. Player B's profile is untouched.
select is(
  (select character from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'player A could not change player B''s profile'
);

-- 6. Usernames are unique regardless of capitalization.
select throws_ok(
  $$insert into public.profiles (id, username, privacy_consent_at) values ('33333333-3333-3333-3333-333333333333', 'PLAYER_A', now())$$,
  '23505',
  null,
  'usernames are unique, ignoring capitalization'
);

-- 7. Usernames must be 3-20 letters, numbers, or underscores.
select throws_ok(
  $$insert into public.profiles (id, username, privacy_consent_at) values ('33333333-3333-3333-3333-333333333333', 'bad name!', now())$$,
  '23514',
  null,
  'usernames with spaces or symbols are rejected'
);

select * from finish();
rollback;
