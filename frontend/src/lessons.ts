// The lessons the Code Journal shows. The server only knows answers and
// progress (see backend's game_tables migration); the lessons themselves
// live here, in the frontend.
//
// A mission only appears in the journal once the player has completed it.
// Adding an entry here for a new mission grows the journal automatically.

import closeDoorImg from './assets/prologue/CloseDoor.png'
import outsideDoorImg from './assets/prologue/OutsideDoor.png'
import jeepneyTerminalImg from './assets/prologue/JeepneyTerminal.png'
import schoolImg from './chapter1/Schoool.png'
import classroomImg from './chapter1/classroom.png'
import powerImg from './chapter1/power.png'
import profClassroomImg from './chapter1/prof_classroom.jpg'
import wifiRoomImg from './chapter 2/wifiroom.jpg'
import pcImg from './chapter 2/pc.png'

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
  code: string
}

export type Lesson = {
  chapter: number
  mission: number
  title: string
  // What was happening in the story before this code ran.
  story: string
  // The lesson itself: the control structure taught.
  lesson: string
  // The code the player wrote to pass the mission.
  code: string
  // The game story scene where the question pops up; it becomes the mission
  // screen's background for that mission.
  sceneBg?: string
  // The coding challenge shown on the mission screen: the prompt, the hint
  // choices that fill the TYPE HERE box, and the core breakdown shown after
  // a correct answer. Missions without these keep the plain TYPE HERE box.
  prompt?: string
  choices?: string[]
  core?: CoreBreakdown
  // A readiness quiz / chapter-end mission: after a correct answer the game
  // shows program flow of the entered code first (no anatomy breakdown),
  // then the result. Takes priority over `core`.
  programFlow?: string[]
  // Multi-question missions: each question has its own prompt, choices, and
  // code. When present, this overrides the single prompt/choices/code above.
  questions?: Question[]
}

const LESSONS: Record<string, Lesson> = {
  '0:1': {
    chapter: 0,
    mission: 1,
    title: 'The Locked Door',
    story: 'The door is locked!',
    lesson:
      'Lesson content coming soon. The mission is teaching how a method call opens the way forward.',
    code: 'OpenDoor();',
    sceneBg: closeDoorImg,
    prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX',
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
      takeaway:
        'Use () to call a method and always end the statement with ;',
    },
  },
  '0:2': {
    chapter: 0,
    mission: 2,
    title: 'The Jeep Terminal',
    story: 'Make your way to the jeep terminal.',
    lesson:
      'Calling the GoToTerminal(); method switches the program to the jeep terminal and opens the way forward. A method needs () to be called and ; to end the statement.',
    code: 'GoToTerminal();',
    // Asked at the outside-door scene, right after leaving the house.
    sceneBg: outsideDoorImg,
    prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX',
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
    code: 'RideJeep();',
    sceneBg: jeepneyTerminalImg,
    prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX',
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
    chapter: 1,
    mission: 1,
    title: 'The if Statement',
    story: 'The university follows a No ID, No Entry policy.',
    lesson:
      'An if statement checks a condition. If the condition is true, the code inside the curly brackets runs. If false, it is skipped.',
    code: 'if(hasSchoolID)\n{\n    EnterSchool();\n}',
    sceneBg: schoolImg,
    questions: [
      {
        prompt:
          'Which C# control structure should be used?\nIf the student has a valid school ID, the student can enter the university.',
        choices: ['if', 'while'],
        code: 'if',
      },
      {
        prompt: 'CHALLENGE: TYPE THE CORRECT SYNTAX',
        choices: [
          'if(hasSchoolID)\n{\n    EnterSchool();\n}',
          'if hasSchoolID\n{\n    EnterSchool();\n}',
        ],
        code: 'if(hasSchoolID)\n{\n    EnterSchool();\n}',
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
    chapter: 1,
    mission: 2,
    title: 'Record Attendance',
    story: 'The attendance kiosk only records students who are present.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    code: 'if(isPresent)\n{\n    RecordAttendance();\n}',
    sceneBg: classroomImg,
    prompt:
      'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(isPresent)\n{\n    RecordAttendance();\n}',
      'if(isPresent)\n    RecordAttendance();',
    ],
    core: {
      incorrectExample: 'if(isPresent)\n    RecordAttendance();',
      incorrectNote:
        'It is missing the curly braces { } around the action.',
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
    chapter: 1,
    mission: 3,
    title: 'Start the Workstation',
    story: 'The computer should only turn on if power is available.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    code: 'if(hasPower)\n{\n    StartComputer();\n}',
    sceneBg: powerImg,
    prompt:
      'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
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
    chapter: 1,
    mission: 4,
    title: 'Submit the Activity',
    story: 'The system should only accept activities that are completed.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    code: 'if(isCompleted)\n{\n    SubmitActivity();\n}',
    sceneBg: profClassroomImg,
    prompt:
      'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(isCompleted)\n{\n    SubmitActivity();\n}',
      'IF(isCompleted)\n{\n    SubmitActivity();\n}',
    ],
    core: {
      incorrectExample: 'IF(isCompleted)\n{\n    SubmitActivity();\n}',
      incorrectNote:
        'C# keywords are case-sensitive. Always use lowercase if.',
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
    chapter: 1,
    mission: 5,
    title: 'The Readiness Quiz',
    story: 'Only students with recorded attendance may take the quiz.',
    lesson:
      'An if statement checks a condition. If it is true, the code inside the curly brackets runs. If false, it is skipped.',
    code: 'if(hasAttendance)\n{\n    OpenQuiz();\n}',
    sceneBg: profClassroomImg,
    prompt:
      'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
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
        code: 'if...else',
      },
      {
        prompt:
          'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
        choices: [
          'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nelse\n{\n    DisplayInsufficientCoins();\n}',
          'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nElse\n{\n    DisplayInsufficientCoins();\n}',
        ],
        code: 'if(coins >= 50)\n{\n    BuyWorksheet();\n}\nelse\n{\n    DisplayInsufficientCoins();\n}',
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
          text: 'DisplayInsufffientCoins();',
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
    story: 'The lab computer connects only if the Wi-Fi password is correct.',
    lesson:
      'An if...else statement runs one block of code when the condition is true, and a different block when it is false.',
    code: 'if(correctPassword)\n{\n    ConnectWiFi();\n}\nelse\n{\n    DisplayConnectionError();\n}',
    sceneBg: wifiRoomImg,
    prompt: 'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
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
        "Correct! The else block contains the statements that execute when the condition is false. Use braces { } to clearly define the block.",
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
    story: 'The learning portal opens only if the student is logged in.',
    lesson:
      'An if...else statement controls access: the block under if runs on true, the one under else runs on false.',
    code: 'if(isLoggedIn)\n{\n    OpenLearningPortal();\n}\nelse\n{\n    DisplayLoginError();\n}',
    sceneBg: pcImg,
    prompt: 'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
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
    story: 'The activity is submitted only if the upload completed.',
    lesson:
      'An if...else statement verifies a prerequisite: the block under if runs on true, the one under else runs on false.',
    code: 'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError();\n}',
    sceneBg: pcImg,
    prompt: 'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
    choices: [
      'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError();\n}',
      'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError()\n}',
    ],
    core: {
      incorrectExample:
        'if(uploadComplete)\n{\n    SubmitActivity();\n}\nelse\n{\n    ShowUploadError()\n}',
      incorrectNote: 'It is missing the semicolon ; at the end of the statement.',
      correctNote: 'Correct! Every statement in C# must end with a semicolon (;).',
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
    story: 'The lab door unlocks only if the safety orientation is completed.',
    lesson:
      'An if...else statement handles both outcomes of a condition: one path when it is true, another when it is false.',
    code: 'if(hasCompletedOrientation)\n{\n    UnlockDoor();\n}\nelse\n{\n    DisplayAccessDenied();\n}',
    sceneBg: pcImg,
    prompt: 'SYNTAX CHALLENGE\nCHOOSE THE CORRECT SYNTAX, THEN TYPE IT EXACTLY.',
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
        "Correct! Use if/else to handle both the true and the false case.",
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
}

export function getLesson(chapter: number, mission: number): Lesson | undefined {
  return LESSONS[`${chapter}:${mission}`]
}