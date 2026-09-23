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
select plan(21);

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
    where chapter_id not in (0, 1, 2, 3, 4, 5, 6, 7, 8)$$,
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

-- Chapter 3: The else if statement. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 3 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 3: its missions and questions'
);

-- Chapter 3's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 3 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'else if'),
    (1, 2, E'if(score >= 90)\n{\n    ShowExcellent();\n}\nelse if(score >= 75)\n{\n    ShowPassed();\n}\nelse\n{\n    ShowNeedsImprovement();\n}'),
    (2, 1, E'if(gpa <= 1.25)\n{\n    FullScholarship();\n}\nelse if(gpa <= 1.75)\n{\n    PartialScholarship();\n}\nelse\n{\n    NotQualified();\n}'),
    (3, 1, E'if(speed >=100)\n{\n    ShowExcellent();\n}\nelse if(speed >=50)\n{\n    ShowGood();\n}\nelse\n{\n    ShowPoor();\n}'),
    (4, 1, E'if(score >=95)\n{\n    AwardGold();\n}\nelse if(score >=85)\n{\n    AwardSilver();\n}\nelse\n{\n    AwardBronze();\n}'),
    (5, 1, E'if(score >=90)\n{\n    ShowExcellent();\n}\nelse if(score >=80)\n{\n    ShowVeryGood();\n}\nelse if(score >=75)\n{\n    ShowGood();\n}\nelse\n{\n    ShowNeedsImprovement();\n}')$keys$,
  'chapter 3: its answer keys'
);

-- Chapter 4: The switch statement. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 4 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 4: its missions and questions'
);

-- Chapter 4's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 4 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'switch'),
    (1, 2, E'switch(option)\n{\n    case 1:\n        ViewSchedule();\n        break;\n\n    case 2:\n        ViewGrades();\n        break;\n\n    default:\n        ShowInvalidOption();\n        break;\n}'),
    (2, 1, E'switch(pcNumber)\n{\n    case 1:\n        OpenPC1();\n        break;\n\n    case 2:\n        OpenPC2();\n        break;\n\n    default:\n        DisplayUnavailable();\n        break;\n}'),
    (3, 1, E'switch(choice)\n{\n    case 1:\n        ShowVariables();\n        break;\n\n    case 2:\n        ShowOperators();\n        break;\n\n    case 3:\n        ShowControlStructures();\n        break;\n\n    default:\n        InvalidChoice();\n        break;\n}'),
    (4, 1, E'switch(destination)\n{\n    case 1:\n        GoToLibrary();\n        break;\n\n    case 2:\n        GoToCafeteria();\n        break;\n\n    case 3:\n        GoToProgrammingLab();\n        break;\n\n    default:\n        ShowInvalidDestination();\n        break;\n}'),
    (5, 1, E'switch(menu)\n{\n    case 1:\n        StartCoding();\n        break;\n\n    case 2:\n        ViewInstructions();\n        break;\n\n    case 3:\n        ExitLab();\n        break;\n\n    default:\n        InvalidChoice();\n        break;\n}')$keys$,
  'chapter 4: its answer keys'
);

-- Chapter 5: The while loop. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 5 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 5: its missions and questions'
);

-- Chapter 5's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 5 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'while'),
    (1, 2, E'while(books < 5)\n{\n    CollectBook();\n    books++;\n}'),
    (2, 1, E'while(progress < 100)\n{\n    DownloadModule();\n    progress += 20;\n}'),
    (3, 1, E'while(studentCount < totalStudents)\n{\n    PrintID();\n    studentCount++;\n}'),
    (4, 1, E'while(uploadedFiles < totalFiles)\n{\n    UploadFile();\n    uploadedFiles++;\n}'),
    (5, 1, E'while(reviewed < totalSubmissions)\n{\n    ReviewSubmission();\n    reviewed++;\n}')$keys$,
  'chapter 5: its answer keys'
);

-- Chapter 6: The do...while loop. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 6 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 6: its missions and questions'
);

-- Chapter 6's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 6 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'do...while'),
    (1, 2, E'do\n{\n    ShowWelcomeMessage();\n}\nwhile(showAgain);'),
    (2, 1, E'do\n{\n    Login();\n}\nwhile(retry);'),
    (3, 1, E'do\n{\n    ScanID();\n}\nwhile(scanAgain);'),
    (4, 1, E'do\n{\n    AnswerQuestion();\n}\nwhile(nextQuestion);'),
    (5, 1, E'do\n{\n    ShowCompletionScreen();\n}\nwhile(reviewLesson);')$keys$,
  'chapter 6: its answer keys'
);

-- Chapter 7: The for loop. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 7 group by 1 order by 1$$,
  $$values (1, 2), (2, 1), (3, 1), (4, 1), (5, 1)$$,
  'chapter 7: its missions and questions'
);

-- Chapter 7's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 7 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'for'),
    (1, 2, E'for(int i = 0; i < 10; i++)\n{\n    PrintStudentID();\n}'),
    (2, 1, E'for(int i = 0; i < 20; i++)\n{\n    CheckComputer();\n}'),
    (3, 1, E'for(int i = 0; i < 30; i++)\n{\n    DistributeModule();\n}'),
    (4, 1, E'for(int i = 0; i < 15; i++)\n{\n    GenerateReport();\n}'),
    (5, 1, E'for(int i = 0; i < 25; i++)\n{\n    DisplayStudent();\n}')$keys$,
  'chapter 7: its answer keys'
);

-- Chapter 8: Epilogue: the final practical exam. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = 8 group by 1 order by 1$$,
  $$values (1, 10)$$,
  'chapter 8: its missions and questions'
);

-- Chapter 8's answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = 8 order by 1, 2, answer collate "C"$$,
  $keys$values
    (1, 1, E'if(hasID)\n{\n    EnterCampus();\n}'),
    (1, 2, E'if(hasPaid)\n{\n    ContinueEnrollment();\n}\nelse\n{\n    DisplayPaymentReminder();\n}'),
    (1, 3, E'if(average >= 98)\n{\n    AwardPresidentScholar();\n}\nelse if(average >= 95)\n{\n    AwardDeanScholar();\n}\nelse\n{\n    AwardCertificate();\n}'),
    (1, 4, E'switch(menu)\n{\n    case 1:\n        ViewClassSchedule();\n        break;\n\n    case 2:\n        ViewGrades();\n        break;\n\n    case 3:\n        PrintRegistrationCertificate();\n        break;\n\n    default:\n        ShowInvalidOption();\n        break;\n}'),
    (1, 5, E'while(processedBooks < totalBooks)\n{\n    ProcessBorrowedBook();\n}'),
    (1, 6, E'do\n{\n    Login();\n}\nwhile(loginFailed);'),
    (1, 7, E'for(int student = 1; student <= 30; student++)\n{\n    GenerateGradeReport();\n}'),
    (1, 8, E'if(hasPermit)\n{\n    OpenGate();\n}\nelse\n{\n    DisplayAccessDenied();\n}'),
    (1, 9, E'switch(document)\n{\n    case 1:\n        RequestCertificateOfRegistration();\n        break;\n\n    case 2:\n        RequestCertificateOfGrades();\n        break;\n\n    case 3:\n        RequestGoodMoralCertificate();\n        break;\n\n    case 4:\n        RequestTranscriptOfRecords();\n        break;\n\n    default:\n        ShowInvalidSelection();\n        break;\n}'),
    (1, 10, E'for(int currentOffice = 1; currentOffice <= totalOffices; currentOffice++)\n{\n    ProcessClearance();\n}')$keys$,
  'chapter 8: its answer keys'
);

select * from finish();
rollback;
