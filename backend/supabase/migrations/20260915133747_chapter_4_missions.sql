-- Chapter 4: The switch statement (from Documents/e. CHAPTER 4.pdf).
-- Written by `npm run answers:sql -- 4` from content/chapter-4.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (4, 1), (4, 2), (4, 3), (4, 4), (4, 5);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (4, 1, 1, E'switch'),
  (4, 1, 2, E'switch(option)\n{\n    case 1:\n        ViewSchedule();\n        break;\n\n    case 2:\n        ViewGrades();\n        break;\n\n    default:\n        ShowInvalidOption();\n        break;\n}'),
  (4, 2, 1, E'switch(pcNumber)\n{\n    case 1:\n        OpenPC1();\n        break;\n\n    case 2:\n        OpenPC2();\n        break;\n\n    default:\n        DisplayUnavailable();\n        break;\n}'),
  (4, 3, 1, E'switch(choice)\n{\n    case 1:\n        ShowVariables();\n        break;\n\n    case 2:\n        ShowOperators();\n        break;\n\n    case 3:\n        ShowControlStructures();\n        break;\n\n    default:\n        InvalidChoice();\n        break;\n}'),
  (4, 4, 1, E'switch(destination)\n{\n    case 1:\n        GoToLibrary();\n        break;\n\n    case 2:\n        GoToCafeteria();\n        break;\n\n    case 3:\n        GoToProgrammingLab();\n        break;\n\n    default:\n        ShowInvalidDestination();\n        break;\n}'),
  (4, 5, 1, E'switch(menu)\n{\n    case 1:\n        StartCoding();\n        break;\n\n    case 2:\n        ViewInstructions();\n        break;\n\n    case 3:\n        ExitLab();\n        break;\n\n    default:\n        InvalidChoice();\n        break;\n}');
