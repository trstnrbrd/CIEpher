// The lessons the Code Journal shows. The server only knows answers and
// progress (see backend's game_tables migration); the lessons themselves
// live here, in the frontend.
//
// A mission only appears in the journal once the player has completed it.
// Adding an entry here for a new mission grows the journal automatically.

import closeDoorImg from './assets/prologue/CloseDoor.webp'
import outsideDoorImg from './assets/prologue/OutsideDoor.webp'
import jeepneyTerminalImg from './assets/prologue/JeepneyTerminal.webp'
import schoolImg from './chapter1/Schoool.webp'
import classroomImg from './chapter1/classroom.webp'
import powerImg from './chapter1/power.webp'
import pcChapter1Img from './chapter1/PC.webp'
import profClassroomImg from './chapter1/prof_classroom.webp'
import bookstoreImg from './chapter 2/bookstore.webp'
import noWifiImg from './chapter 2/no wifi.webp'
import pcImg from './chapter 2/pc.webp'
import chapterThreeRoomImg from './chapter 3/room.png'

// One piece of the code being taught, e.g. the name of a method.
export type CodeAnatomy = {
  // The exact text of the piece, e.g. 'OpenDoor'.
  text: string
  // What that piece does, e.g. 'The name of the method or action.'
  label: string
}

// The "UNDERSTAND THE CORE" screen shown after a correct answer.
export type CoreBreakdown = {
  // A wrong way to write the code, shown in the red comparison panel.
  incorrectExample: string
  // Why that wrong version fails, e.g. 'It is missing parentheses.'
  incorrectNote: string
  // The green validation line, e.g. 'This is the correct syntax.'
  correctNote: string
  // The color-coded pieces of the code with their explanations.
  anatomy: CodeAnatomy[]
  // The vertical program flow: Start ... End.
  flow: string[]
  // The little graphic next to the flow: the bedroom door by default, or a
  // computer terminal monitor for scenes that happen at one.
  flowGraphic?: 'door' | 'terminal'
  // The yellow banner summarized the lesson.
  takeaway: string
}

// A single question within a multi-question mission.
export type Question = {
  prompt: string
  choices?: string[]
  // A question can introduce a fresh situation after an interstitial story
  // scene, without changing the lesson's original opening situation.
  situation?: string
  // Where this question happens, when it differs from the lesson's sceneBg
  // (e.g. the purchase happens at the bookstore but the lesson is in the lab).
  sceneBg?: string
}

import type { Workflow } from './components/CodeWorkflow'

export type Lesson = {
  chapter: number
  mission: number
  title: string
  // What was happening in the story before this code ran.
  story: string
  // The lesson itself: the control structure taught.
  lesson: string
  // The canonical syntax shown after the server accepts a mission answer.
  code?: string
  // The game story scene where the question pops up; it becomes the mission
  // screen's background for that mission.
  sceneBg?: string
  // The coding challenge shown on the mission screen: the prompt, the hint
  // choices the player types in the TYPE HERE box, and the core breakdown shown after
  // a correct answer. Missions without these keep the plain TYPE HERE box.
  prompt?: string
  choices?: string[]
  core?: CoreBreakdown
  // The "UNDERSTAND THE CODE" poster (CodeWorkflow): same layout for every
  // mission, its own content.
  workflow?: Workflow
  // A readiness quiz / chapter-end mission: after a correct answer the game
  // shows program flow of the entered code first (no anatomy breakdown),
  // then the result. Takes priority over `core`.
  programFlow?: string[]
  // Multi-question missions: each question has its own prompt, choices, and
  // scene. When present, this overrides the single prompt/choices above.
  questions?: Question[]
}

// The explanation rows of the poster: only the names change per mission.
function codeParts(condition: string, call: string): Workflow['parts'] {
  return [
    {
      chip: 'if',
      tone: 'blue',
      text: 'Tells the program: Make a decision.',
      icon: 'bulb',
    },
    {
      chip: `(${condition})`,
      tone: 'green',
      text: 'The condition to check.',
      icon: 'check',
    },
    {
      chip: '{ }',
      tone: 'yellow',
      text: 'The code inside will run only if the condition is TRUE.',
      icon: 'doc',
    },
    {
      chip: call,
      tone: 'pink',
      text: 'The action the program performs.',
      icon: 'clip',
    },
  ]
}

const LESSONS: Record<string, Lesson> = {
  '0:1': {
    chapter: 0,
    mission: 1,
    title: 'The Locked Door',
    story: 'The door is locked!',
    lesson:
      'Lesson content coming soon. The mission is teaching how a method call opens the way forward.',
    sceneBg: closeDoorImg,
    prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX.',
    choices: ['OpenDoor();', 'OpenDoor:'],
    core: {
      incorrectExample: 'OpenDoor ;',
      incorrectNote: 'It is missing parentheses.',
      correctNote: 'This is the correct syntax.',
      anatomy: [
        {
          text: 'OpenDoor',
          label: 'The name of the method or action.',
        },
        {
          text: '()',
          label: 'Parentheses are needed to call the method.',
        },
        {
          text: ';',
          label: 'The semicolon ends the statement.',
        },
      ],
      flow: [
        'Start',
        'Read OpenDoor();',
        'Call OpenDoor();',
        'Door Unlocks',
        'Door Opens',
        'End',
      ],
      takeaway: 'Use () to call a method and always end the statement with ;',
    },
  },
  '0:2': {
    chapter: 0,
    mission: 2,
    title: 'The Jeep Terminal',
    story: 'Make your way to the jeep terminal.',
    lesson:
      'Calling the GoToTerminal(); method switches the program to the jeep terminal and opens the way forward. A method needs () to be called and ; to end the statement.',
    // Asked at the outside-door scene, right after leaving the house.
    sceneBg: outsideDoorImg,
    prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX.',
    choices: ['GoToTerminal();', 'GoToTerminal;'],
    core: {
      incorrectExample: 'GoToTerminal ;',
      incorrectNote: 'It is missing the parentheses.',
      correctNote: 'This is the correct syntax.',
      anatomy: [
        {
          text: 'GoToTerminal',
          label: 'The name of the method or action to be performed.',
        },
        {
          text: '()',
          label: 'Parentheses are needed to call the method.',
        },
        {
          text: ';',
          label: 'The semicolon ends the statement.',
        },
      ],
      flow: [
        'Start',
        'Read GoToTerminal();',
        'Call GoToTerminal()',
        'Switches to Terminal',
        'Terminal Opens',
        'End',
      ],
      flowGraphic: 'terminal',
      takeaway: 'Use () to call a method and always end the statement with ;',
    },
  },
  '0:3': {
    chapter: 0,
    mission: 3,
    title: 'Ride the Jeepney',
    story: 'The jeepney is ready.',
    lesson:
      'Calling the RideJeep(); method starts the journey along the route. A method needs () to be called and ; to end the statement.',
    sceneBg: jeepneyTerminalImg,
    prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX.',
    choices: ['RideJeep();', 'RideJeep:'],
    core: {
      incorrectExample: 'RideJeep ;',
      incorrectNote: 'It is missing the parentheses.',
      correctNote: 'This is the correct syntax.',
      anatomy: [
        {
          text: 'RideJeep',
          label: 'The name of the method or action to be performed.',
        },
        {
          text: '()',
          label: 'Parentheses are needed to call the method.',
        },
        {
          text: ';',
          label: 'The semicolon ends the statement.',
        },
      ],
      flow: [
        'Start',
        'Read RideJeep();',
        'Call RideJeep()',
        'The Jeepney Starts',
        'The Journey Begins',
        'End',
      ],
      flowGraphic: 'terminal',
      takeaway: 'Use () to call a method and always end the statement with ;',
    },
  },
  '1:1': {
    workflow: {
      subtitle: 'ENTER THE UNIVERSITY',
      parts: codeParts('hasSchoolID', 'EnterSchool();'),
      check: 'Check hasSchoolID',
      condition: 'hasSchoolID == true?',
      yes: ['EnterSchool();', 'Gate opens'],
      no: 'Gate stays closed',
      label: 'CHAPTER 1 MISSION 1',
    },
    chapter: 1,
    mission: 1,
    title: 'The if Statement',
    story: 'The university follows a No ID, No Entry policy.',
    lesson:
      'An if statement checks a condition. If the condition is true, the code inside the curly brackets runs. If false, it is skipped.',
    sceneBg: schoolImg,
    questions: [
      {
        prompt: 'Which C# control structure is most appropriate?',
        choices: ['if', 'while'],
      },
      {
        prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX.',
        choices: [
          'if(hasSchoolID)\n{\n    EnterSchool();\n}',
          'if hasSchoolID\n{\n    EnterSchool();\n}',
        ],
      },
    ],
    core: {
      incorrectExample: 'if hasSchoolID\n{\n    EnterSchool();\n}',
      incorrectNote: 'It is missing parentheses around the condition.',
      correctNote: 'This is the correct syntax.',
      anatomy: [
        {
          text: 'if',
          label: 'Tells the program to make a decision.',
        },
        {
          text: '(hasSchoolID)',
          label: 'The condition to check.',
        },
        {
          text: '{ }',
          label: 'The code inside will run only if the condition is TRUE.',
        },
        {
          text: 'EnterSchool();',
          label: 'The action the program performs.',
        },
      ],
      flow: [
        'START',
        'Check hasSchoolID',
        'hasSchoolID == true?',
        'YES → EnterSchool()',
        'NO → Skip',
        'END',
      ],
      takeaway:
        'Use an if statement to check a condition before allowing an action to happen. If the condition is false, the action is skipped.',
    },
  },
  '1:2': {
    workflow: {
      subtitle: 'RECORD YOUR ATTENDANCE',
      parts: codeParts('isPresent', 'RecordAttendance();'),
      check: 'Check isPresent',
      condition: 'isPresent == true?',
      yes: ['RecordAttendance();', 'Attendance recorded'],
      no: 'Attendance not recorded',
      label: 'CHAPTER 1 MISSION 2',
    },
    chapter: 1,
    mission: 2,
    title: 'Record Attendance',
    story: 'The attendance kiosk only records students who are present.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    sceneBg: classroomImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(isPresent)\n{\n    RecordAttendance();\n}',
      'if(isPresent)\n    RecordAttendance();',
    ],
    core: {
      incorrectExample: 'if(isPresent)\n    RecordAttendance();',
      incorrectNote: 'It is missing the curly braces { } around the action.',
      correctNote: 'This is the correct syntax.',
      anatomy: [
        {
          text: 'if',
          label: 'Tells the program: Make a decision.',
        },
        {
          text: '(isPresent)',
          label: 'The condition to check.',
        },
        {
          text: '{ }',
          label: 'The code inside will run only if the condition is TRUE.',
        },
        {
          text: 'RecordAttendance();',
          label: 'The action the program performs.',
        },
      ],
      flow: [
        'START',
        'Check isPresent',
        'isPresent == true?',
        'YES → RecordAttendance();',
        'NO → Skip',
        'END',
      ],
      flowGraphic: 'terminal',
      takeaway:
        'The if statement checks whether a condition (like being present) is true before executing a specific action (like recording attendance). If it is false, the action is bypassed.',
    },
  },
  '1:3': {
    workflow: {
      subtitle: 'START YOUR WORKSTATION',
      parts: codeParts('hasPower', 'StartComputer();'),
      check: 'Check hasPower',
      condition: 'hasPower == true?',
      yes: ['StartComputer();', 'Computer starts'],
      no: 'Computer remains off',
      label: 'CHAPTER 1 MISSION 3',
    },
    chapter: 1,
    mission: 3,
    title: 'Start the Workstation',
    story: 'The computer should only turn on if power is available.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    sceneBg: powerImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(hasPower)\n{\n    StartComputer();\n}',
      'if(hasPower)\n{\n    StartComputer()\n}',
    ],
    core: {
      incorrectExample: 'if(hasPower)\n{\n    StartComputer()\n}',
      incorrectNote:
        'It is missing the semicolon ; at the end of the statement.',
      correctNote:
        "Correct! Don't forget the semicolon (;) at the end of every statement.",
      anatomy: [
        {
          text: 'if',
          label: 'Tells the program: Make a decision.',
        },
        {
          text: '(hasPower)',
          label: 'The condition to check.',
        },
        {
          text: '{ }',
          label: 'The code inside will run only if the condition is TRUE.',
        },
        {
          text: 'StartComputer();',
          label: 'The action the program performs.',
        },
      ],
      flow: [
        'START',
        'Check hasPower',
        'hasPower == true?',
        'YES → StartComputer();',
        'NO → Skip',
        'END',
      ],
      flowGraphic: 'terminal',
      takeaway:
        'The if statement checks whether a condition (like having power) is true before executing a specific action (like starting the computer). If the condition is false, the action is bypassed entirely.',
    },
  },
  '1:4': {
    workflow: {
      subtitle: 'SUBMIT YOUR FIRST ACTIVITY',
      parts: codeParts('isCompleted', 'SubmitActivity();'),
      check: 'Check isCompleted',
      condition: 'isCompleted == true?',
      yes: ['SubmitActivity();', 'Activity submitted'],
      no: 'Activity not submitted',
      label: 'CHAPTER 1 MISSION 4',
    },
    chapter: 1,
    mission: 4,
    title: 'Submit the Activity',
    story: 'The system should only accept activities that are completed.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    sceneBg: pcChapter1Img,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(isCompleted)\n{\n    SubmitActivity();\n}',
      'IF(isCompleted)\n{\n    SubmitActivity();\n}',
    ],
    core: {
      incorrectExample: 'IF(isCompleted)\n{\n    SubmitActivity();\n}',
      incorrectNote: 'C# keywords are case-sensitive. Always use lowercase if.',
      correctNote:
        'Correct! C# keywords are case-sensitive. Always use lowercase if.',
      anatomy: [
        {
          text: 'if',
          label: 'Tells the program: Make a decision.',
        },
        {
          text: '(isCompleted)',
          label: 'The condition to check.',
        },
        {
          text: '{ }',
          label: 'The code inside will run only if the condition is TRUE.',
        },
        {
          text: 'SubmitActivity();',
          label: 'The action the program performs.',
        },
      ],
      flow: [
        'START',
        'Check isCompleted',
        'isCompleted == true?',
        'YES → SubmitActivity();',
        'NO → Skip',
        'END',
      ],
      flowGraphic: 'terminal',
      takeaway:
        'The if statement checks whether a condition (like the activity being completed) is true before executing a specific action (like submitting it). If it is false, the action is bypassed.',
    },
  },
  '1:5': {
    workflow: {
      subtitle: 'TAKE THE READINESS QUIZ',
      parts: codeParts('hasAttendance', 'OpenQuiz();'),
      check: 'Check hasAttendance',
      condition: 'hasAttendance == true?',
      yes: ['OpenQuiz();', 'Quiz opens'],
      no: 'Quiz stays locked',
      label: 'CHAPTER 1 MISSION 5',
    },
    chapter: 1,
    mission: 5,
    title: 'The Readiness Quiz',
    story: 'Only students with recorded attendance may take the quiz.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    sceneBg: profClassroomImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(hasAttendance)\n{\n    OpenQuiz();\n}',
      'if(hasAttendance)\nOpenQuiz();',
    ],
    programFlow: [
      'START',
      'Check hasAttendance',
      'hasAttendance == true?',
      'YES → OpenQuiz();',
      'NO → Skip',
      'END',
    ],
  },
  '2:1': {
    chapter: 2,
    mission: 1,
    title: 'Buy the Programming Worksheet',
    story:
      'Before the laboratory activity begins, students must purchase a programming worksheet from the campus bookstore. The worksheet costs ₱50. The cashier checks whether the student has enough coins.',
    lesson:
      'An if...else statement checks a condition and runs one block of code when it is true, and a different block when it is false.',
    code: 'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nelse\n{\n    DisplayInsufficientCoins();\n}',
    sceneBg: pcImg,
    questions: [
      {
        prompt:
          'Which C# control structure is most appropriate for this situation?',
        choices: ['if', 'if...else'],
      },
      {
        prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
        choices: [
          'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nelse\n{\n    DisplayInsufficientCoins();\n}',
          'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nElse\n{\n    DisplayInsufficientCoins();\n}',
        ],
        sceneBg: bookstoreImg,
      },
    ],
    core: {
      incorrectExample:
        'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nElse\n{\n    DisplayInsufficientCoins();\n}',
      incorrectNote:
        'C# keywords are case-sensitive. Always write "else" in lowercase.',
      correctNote:
        'Correct! An if...else statement runs one block of code when the condition is true and a different block when it is false.',
      anatomy: [
        { text: 'if', label: 'Checks if the condition is true.' },
        {
          text: 'coins >= 50',
          label: 'The condition to check (has the player 50 or more coins?).',
        },
        {
          text: 'BuyWorksheet();',
          label: 'Runs when the player has enough coins.',
        },
        { text: 'else', label: 'Runs when the condition is false.' },
        {
          text: 'DisplayInsufficientCoins();',
          label: 'Shows that there are not enough coins.',
        },
      ],
      flow: [
        'START',
        'Check coins',
        'coins >= 50?',
        'YES → BuyWorksheet(); · Worksheet Purchased',
        'NO → DisplayInsufficientCoins(); · Not Enough Coins',
        'END',
      ],
      flowGraphic: 'terminal',
      takeaway:
        'The if...else statement is used because there are two possible outcomes. If the student has enough money, the program buys the worksheet. Otherwise, the purchase cannot continue.',
    },
  },
  '2:2': {
    chapter: 2,
    mission: 2,
    title: 'Connect to the Wi-Fi',
    story:
      'The laboratory computers require an internet connection before students can access the online learning platform. If the Wi-Fi password is correct, the computer connects. Otherwise, access is denied.',
    lesson:
      'An if...else statement runs one block of code when the condition is true, and a different block when it is false.',
    code: 'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\n{\n    DisplayConnectionError();\n}',
    sceneBg: noWifiImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\n{\n    DisplayConnectionError();\n}',
      'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\nDisplayConnectionError();',
    ],
    core: {
      incorrectExample:
        'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\nDisplayConnectionError();',
      incorrectNote:
        'It is missing the curly braces { } around the else block.',
      correctNote:
        'Correct! The else block contains the statements that execute when the condition is false. Use braces { } to clearly define the block.',
      anatomy: [
        { text: 'if', label: 'Checks if the condition is true.' },
        { text: 'correctPassword', label: 'The condition to check.' },
        {
          text: 'ConnectWiFi();',
          label: 'Runs when the password is correct.',
        },
        { text: 'else', label: 'Runs when the condition is false.' },
        {
          text: 'DisplayConnectionError();',
          label: 'Shows a connection error message.',
        },
      ],
      flow: [
        'START',
        'Check correctPassword',
        'correctPassword == true?',
        'YES → ConnectWiFi(); · WiFi Connected',
        'NO → DisplayConnectionError(); · Connection Error',
        'END',
      ],
      takeaway:
        'Use an if/else statement to give the program two different paths. If the condition is true, it does one thing; if the condition is false, it does something else.',
    },
  },
  '2:3': {
    chapter: 2,
    mission: 3,
    title: 'Access the Learning Portal',
    story:
      "Students must log in before accessing today's laboratory activity. If the username and password are correct, the learning portal opens. Otherwise, an error message appears.",
    lesson:
      'An if...else statement controls access: the block under if runs on true, the one under else runs on false.',
    code: 'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nelse\n{\n    DisplayLoginError();\n}',
    sceneBg: pcImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nElse\n{\n    DisplayLoginError();\n}',
      'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nelse\n{\n    DisplayLoginError();\n}',
    ],
    core: {
      incorrectExample:
        'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nElse\n{\n    DisplayLoginError();\n}',
      incorrectNote:
        'C# keywords are case-sensitive. Always use lowercase else.',
      correctNote:
        'Correct! C# keywords are case-sensitive. Always write "else" in lowercase.',
      anatomy: [
        { text: 'if', label: 'Checks if the condition is true.' },
        { text: 'isLoggedIn', label: 'The condition to check.' },
        {
          text: 'OpenLearningPortal();',
          label: 'Runs when the student is logged in.',
        },
        { text: 'else', label: 'Runs when the condition is false.' },
        { text: 'DisplayLoginError();', label: 'Shows a login error message.' },
      ],
      flow: [
        'START',
        'Check isLoggedIn',
        'isLoggedIn == true?',
        'YES → OpenLearningPortal(); · Portal Opened',
        'NO → DisplayLoginError(); · Login Error',
        'END',
      ],
      takeaway:
        'Use an if/else statement to control access. If the required condition (being logged in) is true, the program grants entry; if it is false, the program provides an alternate response, like an error message.',
    },
  },
  '2:4': {
    chapter: 2,
    mission: 4,
    title: 'Submit the Laboratory Exercise',
    story:
      'The laboratory system checks whether the file was uploaded successfully. If the upload is complete, the activity is submitted. Otherwise, the system displays an upload error.',
    lesson:
      'An if...else statement verifies a prerequisite: the block under if runs on true, the one under else runs on false.',
    code: 'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError();\n}',
    sceneBg: pcImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError();\n}',
      'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError()\n}',
    ],
    core: {
      incorrectExample:
        'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError()\n}',
      incorrectNote:
        'It is missing the semicolon ; at the end of the statement.',
      correctNote:
        'Correct! Every statement in C# must end with a semicolon (;).',
      anatomy: [
        { text: 'if', label: 'Checks if the condition is true.' },
        { text: 'uploadComplete', label: 'The condition to check.' },
        {
          text: 'SubmitActivity();',
          label: 'Runs when the upload is complete.',
        },
        { text: 'else', label: 'Runs when the condition is false.' },
        { text: 'ShowUploadError();', label: 'Shows an upload error message.' },
      ],
      flow: [
        'START',
        'Check uploadComplete',
        'uploadComplete == true?',
        'YES → SubmitActivity(); · Activity Submitted',
        'NO → ShowUploadError(); · Upload Error',
        'END',
      ],
      takeaway:
        'An if/else statement is perfect for verifying a prerequisite. If the condition (a completed upload) is met, the program finalizes the submission; if it is not, the program catches the issue and displays an error so the user knows it failed.',
    },
  },
  '2:5': {
    chapter: 2,
    mission: 5,
    title: 'Unlock the Laboratory Door',
    story:
      'A laboratory door should unlock only if the student has completed the safety orientation. If completed, unlock the door. Otherwise, display an access denied message.',
    lesson:
      'An if...else statement handles both outcomes of a condition: one path when it is true, another when it is false.',
    code: 'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\n{\n    DisplayAccessDenied();\n}',
    sceneBg: pcImg,
    prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\n{\n    DisplayAccessDenied();\n}',
      'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\nDisplayAccessDenied();',
    ],
    core: {
      incorrectExample:
        'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\nDisplayAccessDenied();',
      incorrectNote:
        'It is missing the curly braces { } around the else block.',
      correctNote:
        'Correct! Use if/else to handle both the true and the false case.',
      anatomy: [
        { text: 'if', label: 'Checks if the condition is true.' },
        { text: 'hasCompletedOrientation', label: 'The condition to check.' },
        {
          text: 'UnlockDoor();',
          label: 'Runs when the orientation is complete.',
        },
        { text: 'else', label: 'Runs when the condition is false.' },
        {
          text: 'DisplayAccessDenied();',
          label: 'Shows an access denied message.',
        },
      ],
      flow: [
        'START',
        'Check hasCompletedOrientation',
        'hasCompletedOrientation == true?',
        'YES → UnlockDoor(); · Door Unlocked',
        'NO → DisplayAccessDenied(); · Access Denied',
        'END',
      ],
      takeaway: 'Use else to handle what happens when the condition is FALSE.',
    },
  },
  '3:1': {
    chapter: 3,
    mission: 1,
    title: 'Evaluate Student Performance',
    story:
      "The laboratory system automatically evaluates a student's performance.\n\n• If the score is 90 or above, display Excellent.\n• If the score is 75 or above, display Passed.\n• Otherwise, display Needs Improvement.",
    lesson:
      'An else if statement checks another condition when the earlier if condition is false.',
    code: 'if(score >= 90)\n{\n    ShowExcellent();\n}\nelse if(score >= 75)\n{\n    ShowPassed();\n}\nelse\n{\n    ShowNeedsImprovement();\n}',
    sceneBg: chapterThreeRoomImg,
    questions: [
      {
        prompt: 'Which C# control structure is most appropriate?',
        choices: ['if', 'else if', 'if...else'],
      },
      {
        prompt: 'CHALLENGE: CHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
        situation:
          "The History tab shows that laboratory activities are graded from the student's score. Complete the program so it displays Excellent for scores of 90 or higher, Passed for scores of 75 or higher, and Needs Improvement for every other score.",
        choices: [
          'if(score >= 90)\n{\n    ShowExcellent();\n}\nelse if(score >= 75)\n{\n    ShowPassed();\n}\nelse\n{\n    ShowNeedsImprovement();\n}',
          'if(score >= 90)\n{\n    ShowExcellent();\n}\nelseif(score >= 75)\n{\n    ShowPassed();\n}\nelse\n{\n    ShowNeedsImprovement();\n}',
          'if(score >= 90)\n{\n    ShowExcellent();\n}\nelse(score >= 75)\n{\n    ShowPassed();\n}\nelse\n{\n    ShowNeedsImprovement();\n}',
        ],
      },
    ],
    core: {
      incorrectExample:
        'if(score >= 90)\n{\n    ShowExcellent();\n}\nelse\n{\n    ShowNeedsImprovement();\n}',
      incorrectNote:
        'This if...else statement skips the Passed outcome, so it cannot evaluate all three score ranges.',
      correctNote:
        'The else if statement is used when there are more than two possible outcomes.',
      anatomy: [
        { text: 'if', label: 'Checks the first condition.' },
        { text: 'score >= 90', label: 'Tests for an Excellent score.' },
        {
          text: 'else if',
          label: 'Checks another condition when the first one is false.',
        },
        { text: 'score >= 75', label: 'Tests for a Passed score.' },
        { text: 'else', label: 'Handles every remaining score.' },
      ],
      flow: [
        'START',
        'Check score >= 90',
        'YES → ShowExcellent()',
        'NO → Check score >= 75',
        'YES → ShowPassed()',
        'NO → ShowNeedsImprovement()',
        'END',
      ],
      flowGraphic: 'terminal',
      takeaway:
        'Use else if when the program needs to check more than two possible outcomes in sequence.',
    },
  },
}

export function getLesson(
  chapter: number,
  mission: number,
): Lesson | undefined {
  return LESSONS[`${chapter}:${mission}`]
}
