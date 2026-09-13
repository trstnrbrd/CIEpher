begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

-- Test players. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'player_b@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'player_a', now()),
  ('22222222-2222-2222-2222-222222222222', 'player_b', now());

-- The mission data itself.

-- 1. Every mission has at least one answer.
select is_empty(
  $$select m.chapter_id, m.number from public.missions m
    where not exists (
      select 1 from public.mission_answers a
      where a.chapter_id = m.chapter_id and a.mission_number = m.number
    )$$,
  'every mission has an answer'
);

-- 2. A mission's questions are numbered 1, 2, 3... with no gaps, so the
-- highest number really is the last question.
select is_empty(
  $$select chapter_id, mission_number from public.mission_answers
    group by chapter_id, mission_number
    having min(question) <> 1 or max(question) <> count(distinct question)$$,
  'questions are numbered from 1 with no gaps'
);

-- Chapter 1, mission 1 has 2 questions: "if" (the control structure), then
-- the code.

-- 3. The right answer to the first question is accepted...
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1, 'if', 1),
  true,
  'the first question''s right answer is accepted'
);

-- 4. ...counts as a try, but doesn't complete the mission yet.
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (1, false)$$,
  'only the last question completes a mission'
);

-- 5. Each question checks its own answer.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1, 'if', 2),
  false,
  'one question''s answer does not work for another'
);

-- 6. A wrong answer to the first question is a try too.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1, 'while', 1),
  false,
  'a wrong choice is not accepted'
);

-- 7. The code, typed with its own spacing, answers the last question...
select is(
  submit_mission_answer(
    '11111111-1111-1111-1111-111111111111', 1, 1,
    E'if (hasSchoolID) {\n  EnterSchool();\n}', 2
  ),
  true,
  'the last question''s right answer is accepted'
);

-- 8. ...and completes the mission. Every answer sent counted as a try.
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (4, true)$$,
  'the last question''s right answer completes the mission'
);

-- 9-10. Replaying the first question afterwards changes nothing.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1, 'while', 1),
  false,
  'a finished mission''s questions are still checked'
);
select results_eq(
  $$select attempts from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 1 and mission_number = 1$$,
  $$values (4)$$,
  'replays do not change a finished mission'
);

-- Questions that don't exist.

-- 11. Mission 1 has no third question: the answer is null, not false...
select is(
  submit_mission_answer('22222222-2222-2222-2222-222222222222', 1, 1, 'if', 3),
  null,
  'a question that does not exist gives null'
);

-- 12. ...and nothing is recorded.
select is_empty(
  $$select 1 from public.mission_progress
    where player_id = '22222222-2222-2222-2222-222222222222'$$,
  'a question that does not exist is not recorded'
);

-- 13. Without a question number, it's question 1, as before this change.
select is(
  submit_mission_answer('22222222-2222-2222-2222-222222222222', 0, 1, 'OpenDoor();'),
  true,
  'the question number defaults to 1'
);

-- 14. There's one answer check: the old one without questions is gone.
select is(
  (select count(*)::int from pg_proc
   where proname = 'submit_mission_answer'
     and pronamespace = 'public'::regnamespace),
  1,
  'there is only one answer check'
);

-- 15. Players can't call it directly (only the API can).
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$select public.submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 2, 'x', 1)$$,
  '42501',
  null,
  'players cannot call the answer check directly'
);
set local role postgres;

select * from finish();
rollback;
