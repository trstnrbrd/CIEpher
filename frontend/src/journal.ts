// The Code Journal: one lesson per chapter. Completing a chapter writes its
// lesson into the notebook (the server's GET /progress says which chapters
// are completed). Each lesson fills one open notebook: the left page holds
// the definition and the basic syntax, the right page the common syntax
// errors and the real-world applications, the four parts the client's
// chapter docs list for every lesson.
//
// The text follows the client's chapter docs (the "Correct!" messages and
// the mission situations). Replace it when the client sends the final
// journal text. Keep each lesson short enough to fit its pages on a laptop
// screen. The examples are general on purpose: never copy a mission's exact
// answer in here.

export type JournalMistake = {
  // The wrong code, shown in red.
  wrong: string
  // What to do instead.
  fix: string
}

export type JournalLesson = {
  // The chapter that adds this lesson to the journal once it's completed.
  chapter: number
  title: string
  definition: string[]
  // The general form of the code, line breaks kept.
  syntax: string
  syntaxNotes: string[]
  mistakes: JournalMistake[]
  uses: string[]
}

export const JOURNAL: JournalLesson[] = [
  {
    chapter: 0,
    title: 'Prologue: Calling a Method',
    definition: [
      'A method call runs an action by its name.',
      'A method needs ( ) to be called and ; to end the statement.',
    ],
    syntax: 'MethodName();',
    syntaxNotes: [
      'MethodName is the action.',
      '( ) calls the method.',
      '; ends the statement.',
    ],
    mistakes: [
      {
        wrong: 'MethodName;',
        fix: 'Missing ( ). A method needs parentheses to be called.',
      },
      { wrong: 'MethodName():', fix: 'Statements end with ; not :.' },
      { wrong: 'Method Name();', fix: "A method's name has no spaces." },
    ],
    uses: [
      'Open the bedroom door',
      'Go to the jeep terminal',
      'Ride the jeepney to school',
    ],
  },
  {
    chapter: 1,
    title: 'Lesson 1: The if Statement',
    definition: [
      'The if statement executes a block of code only when its condition is true.',
      'Use it to check a single condition.',
    ],
    syntax:
      'if(condition)\n{\n    // runs only when the\n    // condition is true\n}',
    syntaxNotes: ['If the condition is false, the program skips the block.'],
    mistakes: [
      {
        wrong: 'IF(condition)',
        fix: 'C# is case-sensitive. Always use lowercase if.',
      },
      {
        wrong: 'if condition',
        fix: 'Put the condition inside parentheses ( ).',
      },
      {
        wrong: 'DoSomething()',
        fix: 'End every statement with a semicolon (;).',
      },
      {
        wrong: '{ DoSomething();',
        fix: 'Use braces { } to define the block. Every { needs a }.',
      },
    ],
    uses: [
      'Gate: No ID, No Entry',
      'Kiosk: record if present',
      'Lab PC: start if powered',
      'Submit only finished work',
      'Quiz: only if attended',
    ],
  },
  {
    chapter: 2,
    title: 'Lesson 2: The if...else Statement',
    definition: [
      'The if...else statement allows a program to choose between two different actions depending on whether the condition is true or false.',
      'The else block runs when the condition is false.',
    ],
    syntax:
      'if(condition)\n{\n    // runs when true\n}\nelse\n{\n    // runs when false\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'Else',
        fix: 'C# is case-sensitive. Always write else in lowercase.',
      },
      {
        wrong: 'DoSomething()',
        fix: 'Every statement in C# must end with a semicolon (;).',
      },
      {
        wrong: 'else { DoSomething();',
        fix: 'Use braces { } to clearly define the block.',
      },
    ],
    uses: [
      'Coins: buy, or not enough',
      'Wi-Fi: connect, or error',
      'Login: portal, or error',
      'Upload: submit, or error',
      'Door: unlock, or denied',
    ],
  },
]
