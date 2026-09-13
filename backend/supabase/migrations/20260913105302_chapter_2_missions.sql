-- Chapter 2: The if...else statement (from Documents/c. CHAPTER 2.pdf).
-- Written by `npm run answers:sql -- 2` from content/chapter-2.json,
-- and checked with the real C# compiler (`npm run answers:check`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  (2, 1), (2, 2), (2, 3), (2, 4), (2, 5);

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
  (2, 1, 1, E'if...else'),
  (2, 1, 2, E'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nelse\n{\n    DisplayInsufficientCoins();\n}'),
  (2, 2, 1, E'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\n{\n    DisplayConnectionError();\n}'),
  (2, 3, 1, E'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nelse\n{\n    DisplayLoginError();\n}'),
  (2, 4, 1, E'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError();\n}'),
  (2, 5, 1, E'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\n{\n    DisplayAccessDenied();\n}');
