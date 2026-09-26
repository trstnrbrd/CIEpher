-- Chapter 3: The else if statement (from Documents/d. CHAPTER 3.pdf).
-- Written by `npm run answers:sql -- 3` from content/chapter-3.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (3, 1), (3, 2), (3, 3), (3, 4), (3, 5);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (3, 1, 1, E'else if'),
  (3, 1, 2, E'if(score >= 90)\n{\n    ShowExcellent();\n}\nelse if(score >= 75)\n{\n    ShowPassed();\n}\nelse\n{\n    ShowNeedsImprovement();\n}'),
  (3, 2, 1, E'if(gpa <= 1.25)\n{\n    FullScholarship();\n}\nelse if(gpa <= 1.75)\n{\n    PartialScholarship();\n}\nelse\n{\n    NotQualified();\n}'),
  (3, 3, 1, E'if(speed >=100)\n{\n    ShowExcellent();\n}\nelse if(speed >=50)\n{\n    ShowGood();\n}\nelse\n{\n    ShowPoor();\n}'),
  (3, 4, 1, E'if(score >=95)\n{\n    AwardGold();\n}\nelse if(score >=85)\n{\n    AwardSilver();\n}\nelse\n{\n    AwardBronze();\n}'),
  (3, 5, 1, E'if(score >=90)\n{\n    ShowExcellent();\n}\nelse if(score >=80)\n{\n    ShowVeryGood();\n}\nelse if(score >=75)\n{\n    ShowGood();\n}\nelse\n{\n    ShowNeedsImprovement();\n}');
