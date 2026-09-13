begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

-- The missions and their answer keys. How answers are checked is tested in
-- functions/api/csharp.test.ts; how tries are recorded, in
-- record_attempt.test.sql.

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

-- 3. Chapter 1 (the if statement) has 5 missions.
select results_eq(
  'select number::int from public.missions where chapter_id = 1 order by 1',
  array[1, 2, 3, 4, 5],
  'chapter 1 has 5 missions'
);

-- 4. Chapter 1's mission 1 asks 2 questions (the control structure, then the
-- code); the others ask 1.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 1 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'only mission 1 of chapter 1 has 2 questions'
);

-- 5. The answer keys are exactly these. Each was checked with the real C#
-- compiler (2026-09-13). A new chapter's migration adds its answers here too.
select results_eq(
  $$select chapter_id::int, mission_number::int, question::int, answer
    from public.mission_answers order by 1, 2, 3, 4$$,
  $$values
    (0, 1, 1, 'OpenDoor();'),
    (0, 2, 1, 'GoToTerminal();'),
    (0, 3, 1, 'RideJeep();'),
    (1, 1, 1, 'if'),
    (1, 1, 2, E'if(hasSchoolID)\n{\n    EnterSchool();\n}'),
    (1, 2, 1, E'if(isPresent)\n{\n    RecordAttendance();\n}'),
    (1, 3, 1, E'if(hasPower)\n{\n    StartComputer();\n}'),
    (1, 4, 1, E'if(isCompleted)\n{\n    SubmitActivity();\n}'),
    (1, 5, 1, E'if(hasAttendance)\n{\n    OpenQuiz();\n}')$$,
  'the answer keys are the checked ones'
);

select * from finish();
rollback;
