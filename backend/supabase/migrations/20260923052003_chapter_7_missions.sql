-- Chapter 7: The for loop (from Documents/h. CHAPTER 7.docx.pdf).
-- Written by `npm run answers:sql -- 7` from content/chapter-7.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (7, 1), (7, 2), (7, 3), (7, 4), (7, 5);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (7, 1, 1, E'for'),
  (7, 1, 2, E'for(int i = 0; i < 10; i++)\n{\n    PrintStudentID();\n}'),
  (7, 2, 1, E'for(int i = 0; i < 20; i++)\n{\n    CheckComputer();\n}'),
  (7, 3, 1, E'for(int i = 0; i < 30; i++)\n{\n    DistributeModule();\n}'),
  (7, 4, 1, E'for(int i = 0; i < 15; i++)\n{\n    GenerateReport();\n}'),
  (7, 5, 1, E'for(int i = 0; i < 25; i++)\n{\n    DisplayStudent();\n}');
