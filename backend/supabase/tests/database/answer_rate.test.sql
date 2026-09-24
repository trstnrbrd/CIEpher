begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

-- The speed limit on answers: 30 a minute per player, missions and the exam
-- together. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'fast_a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'fast_b@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'fast_a', now()),
  ('22222222-2222-2222-2222-222222222222', 'fast_b', now());

-- 1. Players can't read or change the counter.
select ok(
  not has_table_privilege('authenticated', 'public.answer_rate_limits', 'select')
    and not has_table_privilege('authenticated', 'public.answer_rate_limits', 'update')
    and not has_table_privilege('anon', 'public.answer_rate_limits', 'select'),
  'players cannot read or change the answer counter'
);

-- 2. Nor call the counter themselves.
select ok(
  not has_function_privilege('authenticated', 'public.count_answer(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.count_answer(uuid)', 'execute'),
  'players cannot run the answer counter'
);

-- 3. Thirty answers in a minute are fine (29 on missions, 1 on the exam).
set local role service_role;
do $$
declare
  i integer;
  v_attempt uuid;
begin
  for i in 1..29 loop
    perform public.record_mission_attempt(
      '11111111-1111-1111-1111-111111111111', 0, 1, 1, false, 'OpenDoor:');
  end loop;
  select attempt_id into v_attempt
  from public.start_exam_attempt('11111111-1111-1111-1111-111111111111', 8, 1);
  perform public.record_exam_answer(
    '11111111-1111-1111-1111-111111111111', v_attempt, 1, 'if(hasID)', true);
end $$;
set local role postgres;
select is(
  (select answers from public.answer_rate_limits
   where player_id = '11111111-1111-1111-1111-111111111111'),
  30,
  'thirty answers in a minute are all accepted'
);

-- 4. The 31st mission answer is refused with the code the API maps to 429.
set local role service_role;
select throws_ok(
  $$select public.record_mission_attempt(
    '11111111-1111-1111-1111-111111111111', 0, 1, 1, true, 'OpenDoor();')$$,
  'PT429',
  null,
  'the 31st answer in a minute is refused'
);

-- 5. ...and the refused answer leaves no trace: not in the log, not as a try.
set local role postgres;
select results_eq(
  $$select
      (select count(*) from public.mission_attempts
        where player_id = '11111111-1111-1111-1111-111111111111'),
      (select attempts::bigint from public.mission_progress
        where player_id = '11111111-1111-1111-1111-111111111111'
          and chapter_id = 0 and mission_number = 1)$$,
  $$values (29::bigint, 29::bigint)$$,
  'a refused answer is not logged and not counted as a try'
);

-- 6. The exam shares the same limit.
set local role service_role;
select throws_ok(
  $$select public.record_exam_answer(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.exam_attempts
     where player_id = '11111111-1111-1111-1111-111111111111'
       and finished_at is null),
    2, 'x', false)$$,
  'PT429',
  null,
  'the exam counts toward the same limit'
);

-- 7. Another player is not affected.
select lives_ok(
  $$select public.record_mission_attempt(
    '22222222-2222-2222-2222-222222222222', 0, 1, 1, true, 'OpenDoor();')$$,
  'one player being limited does not slow anyone else'
);

-- 8. Once the minute has passed, the player can answer again.
set local role postgres;
update public.answer_rate_limits
set window_start = now() - interval '61 seconds'
where player_id = '11111111-1111-1111-1111-111111111111';
set local role service_role;
select lives_ok(
  $$select public.record_mission_attempt(
    '11111111-1111-1111-1111-111111111111', 0, 1, 1, true, 'OpenDoor();')$$,
  'after a minute the player can answer again'
);

-- 9. ...and the new minute starts counting from one.
set local role postgres;
select is(
  (select answers from public.answer_rate_limits
   where player_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'the new minute starts counting from one'
);

select * from finish();
rollback;
