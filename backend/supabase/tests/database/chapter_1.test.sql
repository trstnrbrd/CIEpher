begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

-- A test player. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'player_a', now());

-- 1. Chapter 1 (the if statement) has 5 missions.
select results_eq(
  'select number::int from public.missions where chapter_id = 1 order by 1',
  array[1, 2, 3, 4, 5],
  'chapter 1 has 5 missions'
);

-- 2. Mission 1 asks 2 questions (the control structure, then the code); the
-- others ask 1.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 1 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'only mission 1 has 2 questions'
);

-- Each mission: the doc's wrong choice is refused, and the right code is
-- accepted even when typed on one line. (Mission 1's first question is tested
-- in mission_questions.test.sql.)

-- 3-4. Mission 1: the condition needs parentheses.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1,
    E'if hasSchoolID\n{\n    EnterSchool();\n}', 2),
  false,
  'mission 1: no parentheses is wrong'
);
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1,
    'if(hasSchoolID){EnterSchool();}', 2),
  true,
  'mission 1: the right code on one line'
);

-- 5-6. Mission 2: the doc wants braces. (Without them it's valid C#: asked
-- the client, 2026-09-13.)
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 2,
    E'if(isPresent)\nRecordAttendance();'),
  false,
  'mission 2: no braces is not accepted'
);
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 2,
    'if (isPresent) { RecordAttendance(); }'),
  true,
  'mission 2: the right code on one line'
);

-- 7-8. Mission 3: the statement needs its semicolon.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 3,
    E'if(hasPower)\n{\n    StartComputer()\n}'),
  false,
  'mission 3: no semicolon is wrong'
);
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 3,
    'if(hasPower){StartComputer();}'),
  true,
  'mission 3: the right code on one line'
);

-- 9-10. Mission 4: keywords are lowercase.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 4,
    E'IF(isCompleted)\n{\n   SubmitActivity();\n}'),
  false,
  'mission 4: IF in capitals is wrong'
);
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 4,
    'if(isCompleted){SubmitActivity();}'),
  true,
  'mission 4: the right code on one line'
);

-- 11-12. Mission 5: braces again. (Same client question as mission 2.)
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 5,
    E'if(hasAttendance)\nOpenQuiz();'),
  false,
  'mission 5: no braces is not accepted'
);
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 5,
    'if(hasAttendance) {OpenQuiz();}'),
  true,
  'mission 5: the right code on one line'
);

-- 13. Names are case-sensitive too, like in real C#.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 1, 1,
    'if(hasSchoolId){EnterSchool();}', 2),
  false,
  'a name with different capitals is wrong'
);

-- 14. After those answers, the whole chapter is completed.
select is(
  (select count(*)::int from public.mission_progress
   where player_id = '11111111-1111-1111-1111-111111111111'
     and chapter_id = 1 and completed_at is not null),
  5,
  'all 5 missions of chapter 1 are completed'
);

select * from finish();
rollback;
