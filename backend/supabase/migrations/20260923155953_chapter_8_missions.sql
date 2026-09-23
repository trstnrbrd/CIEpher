-- Chapter 8: Epilogue: the final practical exam (from Documents/Epilogue.pdf).
-- Written by `npm run answers:sql -- 8` from content/chapter-8.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (8, 1);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (8, 1, 1, E'if(hasID)\n{\n    EnterCampus();\n}'),
  (8, 1, 2, E'if(hasPaid)\n{\n    ContinueEnrollment();\n}\nelse\n{\n    DisplayPaymentReminder();\n}'),
  (8, 1, 3, E'if(average >= 98)\n{\n    AwardPresidentScholar();\n}\nelse if(average >= 95)\n{\n    AwardDeanScholar();\n}\nelse\n{\n    AwardCertificate();\n}'),
  (8, 1, 4, E'switch(menu)\n{\n    case 1:\n        ViewClassSchedule();\n        break;\n\n    case 2:\n        ViewGrades();\n        break;\n\n    case 3:\n        PrintRegistrationCertificate();\n        break;\n\n    default:\n        ShowInvalidOption();\n        break;\n}'),
  (8, 1, 5, E'while(processedBooks < totalBooks)\n{\n    ProcessBorrowedBook();\n}'),
  (8, 1, 6, E'do\n{\n    Login();\n}\nwhile(loginFailed);'),
  (8, 1, 7, E'for(int student = 1; student <= 30; student++)\n{\n    GenerateGradeReport();\n}'),
  (8, 1, 8, E'if(hasPermit)\n{\n    OpenGate();\n}\nelse\n{\n    DisplayAccessDenied();\n}'),
  (8, 1, 9, E'switch(document)\n{\n    case 1:\n        RequestCertificateOfRegistration();\n        break;\n\n    case 2:\n        RequestCertificateOfGrades();\n        break;\n\n    case 3:\n        RequestGoodMoralCertificate();\n        break;\n\n    case 4:\n        RequestTranscriptOfRecords();\n        break;\n\n    default:\n        ShowInvalidSelection();\n        break;\n}'),
  (8, 1, 10, E'for(int currentOffice = 1; currentOffice <= totalOffices; currentOffice++)\n{\n    ProcessClearance();\n}');
