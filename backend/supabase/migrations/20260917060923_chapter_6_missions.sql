-- Chapter 6: The do...while loop (from Documents/g. CHAPTER 6.docx.pdf).
-- Written by `npm run answers:sql -- 6` from content/chapter-6.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (6, 1), (6, 2), (6, 3), (6, 4), (6, 5);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (6, 1, 1, E'do...while'),
  (6, 1, 2, E'do\n{\n    ShowWelcomeMessage();\n}\nwhile(showAgain);'),
  (6, 2, 1, E'do\n{\n    Login();\n}\nwhile(retry);'),
  (6, 3, 1, E'do\n{\n    ScanID();\n}\nwhile(scanAgain);'),
  (6, 4, 1, E'do\n{\n    AnswerQuestion();\n}\nwhile(nextQuestion);'),
  (6, 5, 1, E'do\n{\n    ShowCompletionScreen();\n}\nwhile(reviewLesson);');
