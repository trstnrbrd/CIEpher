begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

-- A test player. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'Player_A', now());

-- 1. Visitors can't look up emails.
set local role anon;
select throws_ok(
  $$select public.login_email_for_username('player_a')$$,
  '42501',
  null,
  'anonymous visitors cannot look up emails'
);
reset role;

-- 2. Logged-in players can't either.
set local role authenticated;
select throws_ok(
  $$select public.login_email_for_username('player_a')$$,
  '42501',
  null,
  'logged-in players cannot look up emails'
);
reset role;

-- 3-4. The API (service_role) can, ignoring capitals.
set local role service_role;
select is(
  public.login_email_for_username('PLAYER_a'),
  'player_a@test.local',
  'the API finds the email, ignoring capitals'
);
select is(
  public.login_email_for_username('nobody'),
  null,
  'unknown usernames return nothing'
);
reset role;

select * from finish();
rollback;
