begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

-- A test player. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'player_a', now());

-- Who can read the answers.

-- 1. The API can read them, to check answers.
select ok(
  has_table_privilege('service_role', 'public.mission_answers', 'select'),
  'the API can read the answers'
);

-- 2. Players can't, logged in or not.
select ok(
  not has_table_privilege('authenticated', 'public.mission_answers', 'select')
    and not has_table_privilege('anon', 'public.mission_answers', 'select'),
  'players cannot read the answers'
);

-- Recording tries: each is recorded as the API (service_role) and checked
-- as postgres. Chapter 1, mission 1 has 2 questions.

-- 3. A wrong answer counts as a try.
set local role service_role;
select lives_ok(
  $$select public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 1, 1, 1, false)$$,
  'a wrong answer is recorded'
);
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (1, false)$$,
  'a wrong answer counts as a try'
);

-- 5. The right answer to the first question counts, but doesn't complete it.
set local role service_role;
do $$ begin perform public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 1, 1, 1, true); end $$;
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (2, false)$$,
  'only the last question completes a mission'
);

-- 6. The right answer to the last question completes it.
set local role service_role;
do $$ begin perform public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 1, 1, 2, true); end $$;
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (3, true)$$,
  'the last question''s right answer completes the mission'
);

-- 7. Replays change nothing, not even a wrong one.
set local role service_role;
do $$ begin perform public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 1, 1, 2, false); end $$;
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (3, true)$$,
  'replays do not change a finished mission'
);

-- 8. A one-question mission is completed by its right answer.
set local role service_role;
do $$ begin perform public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 0, 1, 1, true); end $$;
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 0 and mission_number = 1$$,
  $$values (1, true)$$,
  'a one-question mission is completed by its answer'
);

-- 9. A question that doesn't exist is an error, and nothing is recorded.
set local role service_role;
select throws_ok(
  $$select public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 0, 2, 2, true)$$,
  'P0002',
  null,
  'a question that does not exist is refused'
);
set local role postgres;
select is_empty(
  $$select 1 from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 0 and mission_number = 2$$,
  'nothing is recorded for it'
);

-- 11. Players can't record tries themselves (only the API can).
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$select public.record_mission_attempt('11111111-1111-1111-1111-111111111111', 0, 2, 1, true)$$,
  '42501',
  null,
  'players cannot record tries themselves'
);
set local role postgres;

select * from finish();
rollback;
