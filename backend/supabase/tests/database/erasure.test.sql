begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

-- The Data Privacy Act gives a player the right to have their data erased.
-- We do that by hand in the SQL editor with one line:
--
--   delete from auth.users where id = '...';
--
-- That only works if every table that holds their data is wired to follow.
-- This test proves it, so a table added later can't quietly keep a player's
-- data after they asked us to delete it.

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'erase_me@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'keep_me@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'erase_me', now()),
  ('22222222-2222-2222-2222-222222222222', 'keep_me', now());

-- Both players play a mission and take the exam, so there is something of
-- theirs in every table.
set local role service_role;
do $$
declare
  p uuid;
  v_attempt uuid;
begin
  foreach p in array array[
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
  ] loop
    perform public.record_mission_attempt(p, 0, 1, 1, false, 'OpenDoor:');
    perform public.record_mission_attempt(p, 0, 1, 1, true, 'OpenDoor();');
    select attempt_id into v_attempt from public.start_exam_attempt(p, 8, 1);
    perform public.record_exam_answer(p, v_attempt, 1, 'if(hasID)', true);
    perform public.finish_exam_attempt(p, v_attempt);
  end loop;
end $$;
set local role postgres;

-- 1-4. Everything is there to begin with.
select is(
  (select count(*)::int from public.mission_progress
   where player_id = '11111111-1111-1111-1111-111111111111'),
  2,
  'the player has mission progress (the prologue mission and the exam)'
);
select is(
  (select count(*)::int from public.mission_attempts
   where player_id = '11111111-1111-1111-1111-111111111111'),
  2,
  'the player has logged answers'
);
select is(
  (select count(*)::int from public.exam_attempts
   where player_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'the player has an exam attempt'
);
select is(
  (select count(*)::int from public.exam_answers x
   join public.exam_attempts e on e.id = x.attempt_id
   where e.player_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'the player has exam answers'
);

-- The erasure itself: the one line from the runbook.
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

-- 5-8. Nothing of theirs is left anywhere.
select is_empty(
  $$select 1 from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'$$,
  'the profile is gone'
);
select is_empty(
  $$select 1 from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111'$$,
  'their mission progress is gone'
);
select is_empty(
  $$select 1 from public.mission_attempts
    where player_id = '11111111-1111-1111-1111-111111111111'$$,
  'their logged answers are gone'
);
select is_empty(
  $$select 1 from public.exam_attempts e
    where e.player_id = '11111111-1111-1111-1111-111111111111'$$,
  'their exam attempts and answers are gone'
);

-- 9. And nobody else's data was touched.
select results_eq(
  $$select
      (select count(*) from public.mission_progress
        where player_id = '22222222-2222-2222-2222-222222222222'),
      (select count(*) from public.mission_attempts
        where player_id = '22222222-2222-2222-2222-222222222222'),
      (select count(*) from public.exam_attempts
        where player_id = '22222222-2222-2222-2222-222222222222')$$,
  $$values (2::bigint, 2::bigint, 1::bigint)$$,
  'the other player keeps everything'
);

select * from finish();
rollback;
