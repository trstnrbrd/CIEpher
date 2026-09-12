begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

-- Test players and some progress. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'player_b@test.local');

insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'player_a', now()),
  ('22222222-2222-2222-2222-222222222222', 'player_b', now());

insert into public.mission_progress
  (player_id, chapter_id, mission_number, attempts, completed_at)
values
  ('11111111-1111-1111-1111-111111111111', 0, 1, 2, now()),
  ('22222222-2222-2222-2222-222222222222', 0, 1, 1, now()),
  ('22222222-2222-2222-2222-222222222222', 0, 2, 3, null);

-- 1. The prologue has 3 missions, and each has an answer.
select results_eq(
  $$select m.number::int from public.missions m
    where m.chapter_id = 0
      and exists (
        select 1 from public.mission_answers a
        where a.chapter_id = m.chapter_id and a.mission_number = m.number
      )
    order by 1$$,
  array[1, 2, 3],
  'the prologue has 3 missions, each with an answer'
);

-- 2. Visitors who aren't logged in can't read the game at all.
set local role anon;
select throws_ok(
  'select * from public.missions',
  '42501',
  null,
  'anonymous visitors cannot read missions'
);
set local role postgres;

-- From here on, act as player A.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- 3. Players see the prologue (0), chapters 1-7 and the epilogue (8).
select results_eq(
  'select id::int from public.chapters order by id',
  array[0, 1, 2, 3, 4, 5, 6, 7, 8],
  'players can read the chapters'
);

-- 4. Players see the missions.
select is(
  (select count(*)::int from public.missions),
  3,
  'players can read the missions'
);

-- 5. Players can never read the answers.
select throws_ok(
  'select * from public.mission_answers',
  '42501',
  null,
  'players cannot read the answers'
);

-- 6. Player A sees only their own progress (A has 2 attempts; B's rows are hidden).
select results_eq(
  'select attempts from public.mission_progress',
  array[2],
  'player A sees only their own progress'
);

-- 7. Players can't mark missions as done themselves (only the API can).
select throws_ok(
  $$insert into public.mission_progress (player_id, chapter_id, mission_number, completed_at)
    values ('11111111-1111-1111-1111-111111111111', 0, 2, now())$$,
  '42501',
  null,
  'players cannot add progress themselves'
);

-- 8. Nor change their progress.
select throws_ok(
  $$update public.mission_progress set attempts = 1
    where player_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'players cannot change their progress themselves'
);

-- Back to the database admin.
set local role postgres;

-- 9. Progress must point to a real mission.
select throws_ok(
  $$insert into public.mission_progress (player_id, chapter_id, mission_number)
    values ('11111111-1111-1111-1111-111111111111', 0, 99)$$,
  '23503',
  null,
  'progress must point to a real mission'
);

-- 10. A mission that players have progress in can't be deleted by accident.
select throws_ok(
  'delete from public.missions where chapter_id = 0 and number = 1',
  '23503',
  null,
  'missions with player progress cannot be deleted'
);

-- 11. Deleting an account deletes its progress too (Data Privacy Act).
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.mission_progress
   where player_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'deleting an account deletes its progress'
);

select * from finish();
rollback;
