begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

-- Two test players. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'exam_a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'exam_b@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'exam_a', now()),
  ('22222222-2222-2222-2222-222222222222', 'exam_b', now());

-- Who can read what the player answered.

-- 1. The API can, to score the exam.
select ok(
  has_table_privilege('service_role', 'public.exam_answers', 'select'),
  'the API can read the exam answers'
);

-- 2. Players can't: that table says which items were right.
select ok(
  not has_table_privilege('authenticated', 'public.exam_answers', 'select')
    and not has_table_privilege('anon', 'public.exam_answers', 'select'),
  'players cannot read which exam items were right'
);

-- Starting an attempt. Chapter 8 mission 1 is the exam: 10 items, pass 7.

-- 3. The first start creates attempt 1 and reads the exam's size from the
--    answers, so the pass mark follows the content.
set local role service_role;
select results_eq(
  $$select attempt_number, total_items, pass_score, answered
    from public.start_exam_attempt('11111111-1111-1111-1111-111111111111', 8, 1)$$,
  $$values (1, 10, 7, 0)$$,
  'the first attempt is numbered 1, with 10 items and a pass mark of 7'
);

-- 4. Starting again hands back the same attempt, so a refresh in the middle
--    doesn't lose the answers or start a second try.
select is(
  (select count(distinct id)::int from public.exam_attempts
   where player_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'starting again resumes the attempt that is already running'
);

-- Answering. The function gives back only how many items are answered.

-- 5. An answer is saved and counted.
select is(
  (select public.record_exam_answer(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.exam_attempts
     where player_id = '11111111-1111-1111-1111-111111111111'),
    1, 'if(hasID)' || chr(10) || '{' || chr(10) || '    EnterCampus();' || chr(10) || '}', true)),
  1,
  'an answer is saved and counted'
);

-- 6. An item that isn't in this exam is refused.
select throws_ok(
  $$select public.record_exam_answer(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.exam_attempts
     where player_id = '11111111-1111-1111-1111-111111111111'),
    11, 'anything', true)$$,
  'P0002',
  null,
  'an item outside the exam is refused'
);

-- 7. Another player's attempt can't be answered, even by the API, because
--    the player id and the attempt must match.
select throws_ok(
  $$select public.record_exam_answer(
    '22222222-2222-2222-2222-222222222222',
    (select id from public.exam_attempts
     where player_id = '11111111-1111-1111-1111-111111111111'),
    2, 'anything', true)$$,
  'P0002',
  null,
  'one player cannot answer another player''s exam'
);

-- 8. Answer the rest: 5 more right, 4 wrong. With item 1 that's 6 of 10.
do $$
declare
  v_attempt uuid;
  i integer;
begin
  select id into v_attempt from public.exam_attempts
  where player_id = '11111111-1111-1111-1111-111111111111';
  for i in 2..10 loop
    perform public.record_exam_answer(
      '11111111-1111-1111-1111-111111111111', v_attempt, i, 'typed', i <= 6);
  end loop;
end $$;
select is(
  (select count(*)::int from public.exam_answers a
   join public.exam_attempts e on e.id = a.attempt_id
   where e.player_id = '11111111-1111-1111-1111-111111111111'),
  10,
  'all ten items are recorded'
);

-- Finishing.

-- 9. The score counts only the right ones, and 6 of 10 is not a pass.
select results_eq(
  $$select attempt_number, score, total_items, pass_score, passed
    from public.finish_exam_attempt(
      '11111111-1111-1111-1111-111111111111',
      (select id from public.exam_attempts
       where player_id = '11111111-1111-1111-1111-111111111111'))$$,
  $$values (1, 6, 10, 7, false)$$,
  'six right out of ten is not a pass'
);

-- 10. A failed exam counts as a try but leaves the chapter unfinished.
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 8 and mission_number = 1$$,
  $$values (1, false)$$,
  'a failed exam is a try, and does not complete the chapter'
);

-- 11. The same attempt can't be finished twice.
set local role service_role;
select throws_ok(
  $$select public.finish_exam_attempt(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.exam_attempts
     where player_id = '11111111-1111-1111-1111-111111111111'))$$,
  'P0002',
  null,
  'a finished attempt cannot be finished again'
);

-- Retaking.

-- 12. Starting again after a fail is attempt 2.
select results_eq(
  $$select attempt_number, answered
    from public.start_exam_attempt('11111111-1111-1111-1111-111111111111', 8, 1)$$,
  $$values (2, 0)$$,
  'a retake starts a second attempt with no answers'
);

-- 13. Pass it this time: 8 right out of 10.
do $$
declare
  v_attempt uuid;
  i integer;
begin
  select id into v_attempt from public.exam_attempts
  where player_id = '11111111-1111-1111-1111-111111111111'
    and finished_at is null;
  for i in 1..10 loop
    perform public.record_exam_answer(
      '11111111-1111-1111-1111-111111111111', v_attempt, i, 'typed', i <= 8);
  end loop;
end $$;
select results_eq(
  $$select score, passed from public.finish_exam_attempt(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.exam_attempts
     where player_id = '11111111-1111-1111-1111-111111111111'
       and finished_at is null))$$,
  $$values (8, true)$$,
  'eight right out of ten passes'
);

-- 14. Passing completes the chapter.
set local role postgres;
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'
      and chapter_id = 8 and mission_number = 1$$,
  $$values (2, true)$$,
  'passing completes the chapter on the second try'
);

-- 15. What the game shows on the exam screen.
set local role service_role;
select results_eq(
  $$select attempts, last_score, best_score, passed, running
    from public.exam_state('11111111-1111-1111-1111-111111111111', 8, 1)$$,
  $$values (2, 8, 8, true, false)$$,
  'the exam state reports the tries, the scores and the verdict'
);

-- 16. Players can't run the exam themselves: the API decides scores.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$select public.start_exam_attempt('11111111-1111-1111-1111-111111111111', 8, 1)$$,
  '42501',
  null,
  'players cannot start or score an exam themselves'
);
set local role postgres;

select * from finish();
rollback;
