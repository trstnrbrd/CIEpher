-- Chapter 1: the if statement (from the client's chapter 1 doc, 2026-09-13).
-- The story, the two choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- The accepted answers, laid out as the client wrote them. Spaces and line
-- breaks don't count when checking (see normalize_answer), so the same code
-- typed on one line is also right.
insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  -- 1. School gate. First: "Which C# control structure is most appropriate?"
  (1, 1, 1, 'if'),
  -- ...then the code.
  (1, 1, 2, E'if(hasSchoolID)\n{\n    EnterSchool();\n}'),
  -- 2. Attendance kiosk.
  (1, 2, 1, E'if(isPresent)\n{\n    RecordAttendance();\n}'),
  -- 3. The lab computer.
  (1, 3, 1, E'if(hasPower)\n{\n    StartComputer();\n}'),
  -- 4. Submitting the activity.
  (1, 4, 1, E'if(isCompleted)\n{\n    SubmitActivity();\n}'),
  -- 5. The readiness quiz.
  (1, 5, 1, E'if(hasAttendance)\n{\n    OpenQuiz();\n}');
