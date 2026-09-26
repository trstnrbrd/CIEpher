// Content for the epilogue's final practical exam (chapter 8, mission 1).
//
// This is NOT a normal Lesson/Question entry, and it is NOT added to the
// LESSONS map in lessons.ts on purpose. The exam works differently from
// every other mission: ten items answered in one sitting with no
// per-item feedback, and only a score at the end. Whoever builds the exam
// screen drives it with startExam() / answerExam() / finishExam() from
// api/client.ts (see Documents/api-contract.md) and imports EXAM_QUESTIONS
// below for what to show on each of the ten screens.
//
// The choices are reordered from the client's document on purpose: in their
// order, the correct choice is the 2nd one in 7 of the 10 items, so a player
// who always picks the 2nd choice would score exactly the 7/10 needed to
// pass without knowing anything. Only the ORDER changed - the wording of
// every choice is untouched and matches backend/content/chapter-8.json
// exactly. See Documents/epilogue-choice-order.md for the full table and
// the reasoning, and for the client's sign-off note.
//
// Do not add a "which choice is correct" field here: this file ships inside
// the game's bundle, so anything written in it is readable by a curious
// player (view source, or the browser's dev tools). The server is the only
// place that ever compares an answer against the key - that's the whole
// point of the exam's own API routes instead of the normal submit route.
// The client never learns the answer, not even after the exam is over.

export type ExamItem = {
  // Shown on the SITUATION card, same style as every other mission's.
  situation: string
  // Shown in order, top to bottom. Never reorder these again without
  // re-checking Documents/epilogue-choice-order.md first.
  choices: string[]
}

export const EXAM_QUESTIONS: ExamItem[] = [
  {
    situation:
      'The university entrance gate is connected to an automated security system.\n\nOnly students with a valid school ID are allowed to enter the campus.',
    choices: [
      'if hasID\n{\n    EnterCampus();\n}',
      'if(hasID);\n{\n    EnterCampus();\n}',
      'if(hasID)\n{\n    EnterCampus();\n}',
      'if(hasID)\n    EnterCampus()',
    ],
  },
  {
    situation:
      "The university's online enrollment system checks whether a student has already paid the tuition fee.\n\n• If the payment is confirmed, the student may continue with enrollment.\n• Otherwise, the system displays a payment reminder.",
    choices: [
      'if(hasPaid)\n{\n    ContinueEnrollment();\n}\nelse\n{\n    DisplayPaymentReminder();\n}',
      'if(hasPaid)\n{\n    ContinueEnrollment();\n}',
      'if(hasPaid);\n{\n    ContinueEnrollment();\n}\nelse\n{\n    DisplayPaymentReminder();\n}',
      'if(hasPaid)\n{\n    ContinueEnrollment()\n}\nelse\n{\n    DisplayPaymentReminder();\n}',
    ],
  },
  {
    situation:
      "The university's scholarship system evaluates students based on their final average.\n\n• If the average is 98 or above, the student receives the President's Scholar Award.\n• If the average is 95 or above, the student receives the Dean's Scholar Award.\n• Otherwise, the student receives a Certificate of Participation.",
    choices: [
      'if(average >= 98)\n{\n    AwardPresidentScholar();\n}\nif(average >= 95)\n{\n    AwardDeanScholar();\n}\nelse\n{\n    AwardCertificate();\n}',
      'if(average >= 98);\n{\n    AwardPresidentScholar();\n}\nelse if(average >= 95)\n{\n    AwardDeanScholar();\n}\nelse\n{\n    AwardCertificate();\n}',
      'if(average >= 98)\n{\n    AwardPresidentScholar();\n}\nelse if(average >= 95)\n{\n    AwardDeanScholar()\n}\nelse\n{\n    AwardCertificate();\n}',
      'if(average >= 98)\n{\n    AwardPresidentScholar();\n}\nelse if(average >= 95)\n{\n    AwardDeanScholar();\n}\nelse\n{\n    AwardCertificate();\n}',
    ],
  },
  {
    situation:
      'The university\'s self-service kiosk allows students to access different services. The student enters a menu number:\n\n• 1 ➡ View Class Schedule\n• 2 ➡ View Grades\n• 3 ➡ Print Certificate of Registration\n\nIf the entered number does not match any available service, an "Invalid Option" message should be displayed.',
    choices: [
      'if(menu == 1)\n{\n    ViewClassSchedule();\n}\nelse if(menu == 2)\n{\n    ViewGrades();\n}\nelse if(menu == 3)\n{\n    PrintRegistrationCertificate();\n}\nelse\n{\n    ShowInvalidOption();\n}',
      'switch(menu)\n{\n    case 1:\n        ViewClassSchedule();\n        break;\n\n    case 2:\n        ViewGrades();\n        break;\n\n    case 3:\n        PrintRegistrationCertificate();\n        break;\n\n    default:\n        ShowInvalidOption();\n        break;\n}',
      'switch(menu)\n{\n    case 1\n        ViewClassSchedule();\n        break;\n\n    case 2:\n        ViewGrades();\n        break;\n\n    default:\n        ShowInvalidOption();\n        break;\n}',
      'switch(menu)\n{\n    case 1:\n        ViewClassSchedule();\n\n    case 2:\n        ViewGrades();\n\n    case 3:\n        PrintRegistrationCertificate();\n\n    default:\n        ShowInvalidOption();\n}',
    ],
  },
  {
    situation:
      'The university library has developed an automated borrowing system.\n\nA student borrows several books. The system must continue processing each borrowed book until all requested books have been recorded.',
    choices: [
      'do\n{\n    ProcessBorrowedBook();\n}\nwhile(processedBooks < totalBooks);',
      'for(int i = 0; i < totalBooks; i++)\n{\n    ProcessBorrowedBook();\n}',
      'while(processedBooks < totalBooks)\n{\n    ProcessBorrowedBook();\n}',
      'while(processedBooks < totalBooks)\n{\n    ProcessBorrowedBook()\n}',
    ],
  },
  {
    situation:
      "The university's online portal requires students to log in before accessing their accounts.\n\nThe system must always process the first login attempt. After each attempt, if the login credentials are incorrect, the system asks the student to try again.",
    choices: [
      'while(loginFailed)\n{\n    Login();\n}',
      'do\n{\n    Login()\n}\nwhile(loginFailed);',
      'do\n{\n    Login();\n}\nwhile(loginFailed)',
      'do\n{\n    Login();\n}\nwhile(loginFailed);',
    ],
  },
  {
    situation:
      'The university registrar is preparing the final grade reports.\n\nA total of 30 students are enrolled in the class. The system must generate one grade report for each student until all reports have been completed.',
    choices: [
      'for(int student = 1; student <= 30; student++)\n{\n    GenerateGradeReport();\n}',
      'while(student < 30)\n{\n    GenerateGradeReport();\n}',
      'do\n{\n    GenerateGradeReport();\n}\nwhile(student < 30);',
      'for(int student = 1 student <= 30; student++)\n{\n    GenerateGradeReport();\n}',
    ],
  },
  {
    situation:
      'The university parking system controls access to the campus parking area. When a vehicle arrives, the system checks whether the driver has a valid parking permit.\n\n• If the permit is valid, the gate opens.\n• Otherwise, an "Access Denied" message is displayed.',
    choices: [
      'if(hasPermit)\n{\n    OpenGate();\n}',
      'if(hasPermit)\n{\n    OpenGate();\n}\nelse\n{\n    DisplayAccessDenied();\n}',
      'switch(hasPermit)\n{\n    case true:\n        OpenGate();\n        break;\n}',
      'if(hasPermit)\n{\n    OpenGate()\n}\nelse\n{\n    DisplayAccessDenied();\n}',
    ],
  },
  {
    situation:
      'The university\'s student portal allows students to choose a document to request. The student enters a document number:\n\n• 1 ➡ Certificate of Registration\n• 2 ➡ Certificate of Grades\n• 3 ➡ Good Moral Certificate\n• 4 ➡ Transcript of Records\n\nIf the entered number does not match any available service, the system displays "Invalid Document Selection."',
    choices: [
      'if(document == 1)\n{\n    RequestCertificateOfRegistration();\n}\nelse if(document == 2)\n{\n    RequestCertificateOfGrades();\n}\nelse if(document == 3)\n{\n    RequestGoodMoralCertificate();\n}\nelse if(document == 4)\n{\n    RequestTranscriptOfRecords();\n}\nelse\n{\n    ShowInvalidSelection();\n}',
      'switch(document)\n{\n    case 1\n        RequestCertificateOfRegistration();\n        break;\n\n    case 2:\n        RequestCertificateOfGrades();\n        break;\n\n    case 3:\n        RequestGoodMoralCertificate();\n        break;\n\n    default:\n        ShowInvalidSelection();\n        break;\n}',
      'switch(document)\n{\n    case 1:\n        RequestCertificateOfRegistration();\n        break;\n\n    case 2:\n        RequestCertificateOfGrades();\n        break;\n\n    case 3:\n        RequestGoodMoralCertificate();\n        break;\n\n    case 4:\n        RequestTranscriptOfRecords();\n        break;\n\n    default:\n        ShowInvalidSelection();\n        break;\n}',
      'switch(document)\n{\n    case 1:\n        RequestCertificateOfRegistration();\n\n    case 2:\n        RequestCertificateOfGrades();\n\n    case 3:\n        RequestGoodMoralCertificate();\n\n    case 4:\n        RequestTranscriptOfRecords();\n\n    default:\n        ShowInvalidSelection();\n}',
    ],
  },
  {
    situation:
      'The university is conducting its annual graduation clearance.\n\nEach graduating student must complete all required clearance offices before being marked as CLEARED. The system processes each office one by one until every required clearance has been completed.',
    choices: [
      'for(int currentOffice = 1; currentOffice <= totalOffices; currentOffice++)\n{\n    ProcessClearance();\n}',
      'while(currentOffice <= totalOffices)\n{\n    ProcessClearance();\n}',
      'if(currentOffice <= totalOffices)\n{\n    ProcessClearance();\n}',
      'do\n{\n    ProcessClearance();\n}\nwhile(currentOffice <= totalOffices);',
    ],
  },
]
