-- Chapter 5: The while loop (from Documents/f. CHAPTER 5.docx.pdf).
-- Written by `npm run answers:sql -- 5` from content/chapter-5.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (5, 1), (5, 2), (5, 3), (5, 4), (5, 5);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (5, 1, 1, E'while'),
  (5, 1, 2, E'while(books < 5)\n{\n    CollectBook();\n    books++;\n}'),
  (5, 2, 1, E'while(progress < 100)\n{\n    DownloadModule();\n    progress += 20;\n}'),
  (5, 3, 1, E'while(studentCount < totalStudents)\n{\n    PrintID();\n    studentCount++;\n}'),
  (5, 4, 1, E'while(uploadedFiles < totalFiles)\n{\n    UploadFile();\n    uploadedFiles++;\n}'),
  (5, 5, 1, E'while(reviewed < totalSubmissions)\n{\n    ReviewSubmission();\n    reviewed++;\n}');
