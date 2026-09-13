-- Written by `npm run answers:sql` (or `npm run answers:tests`) from
-- backend/content/. Don't edit it by hand: change the content file, then run
-- the command again.
--
-- It proves the database holds exactly the answer keys in the content files.
-- How answers are checked is tested in functions/api/csharp.test.ts; how
-- tries are recorded, in record_attempt.test.sql.
begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

-- Every mission has at least one answer.
select is_empty(
  $$select m.chapter_id, m.number from public.missions m
    where not exists (
      select 1 from public.mission_answers a
      where a.chapter_id = m.chapter_id and a.mission_number = m.number
    )$$,
  'every mission has an answer'
);

-- A mission's questions are numbered 1, 2, 3... with no gaps, so the
-- highest number really is the last question.
select is_empty(
  $$select chapter_id, mission_number from public.mission_answers
    group by chapter_id, mission_number
    having min(question) <> 1 or max(question) <> count(distinct question)$$,
  'questions are numbered from 1 with no gaps'
);

-- Every chapter with missions has a content file (backend/content/).
select is_empty(
  $$select distinct chapter_id from public.missions
    where chapter_id not in (0, 1, 2)$$,
  'every chapter with missions has a content file'
);

-- Chapter 0: Prologue: calling a method. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 0 group by 1 order by 1$$,
  $$values (1, 1), (2, 1), (3, 1)$$,
  'chapter 0: its missions and questions'
);

-- Chapter 0's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 0 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'OpenDoor();'),
    (2, 1, E'GoToTerminal();'),
    (3, 1, E'RideJeep();')$keys$,
  'chapter 0: its answer keys'
);

-- Chapter 1: The if statement. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 1 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 1: its missions and questions'
);

-- Chapter 1's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 1 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'if'),
    (1, 2, E'if(hasSchoolID)\n{\n    EnterSchool();\n}'),
    (2, 1, E'if(isPresent)\n{\n    RecordAttendance();\n}'),
    (3, 1, E'if(hasPower)\n{\n    StartComputer();\n}'),
    (4, 1, E'if(isCompleted)\n{\n    SubmitActivity();\n}'),
    (5, 1, E'if(hasAttendance)\n{\n    OpenQuiz();\n}')$keys$,
  'chapter 1: its answer keys'
);

-- Chapter 2: The if...else statement. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 2 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 2: its missions and questions'
);

-- Chapter 2's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 2 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'if...else'),
    (1, 2, E'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nelse\n{\n    DisplayInsufficientCoins();\n}'),
    (2, 1, E'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\n{\n    DisplayConnectionError();\n}'),
    (3, 1, E'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nelse\n{\n    DisplayLoginError();\n}'),
    (4, 1, E'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError();\n}'),
    (5, 1, E'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\n{\n    DisplayAccessDenied();\n}')$keys$,
  'chapter 2: its answer keys'
);

select * from finish();
rollback;
