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
}

export function getLesson(chapter: number, mission: number): Lesson | undefined {
  return LESSONS[`${chapter}:${mission}`]
}