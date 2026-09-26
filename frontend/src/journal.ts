// The Code Journal: one lesson per chapter. Completing a chapter writes its
// lesson into the notebook (the server's GET /progress says which chapters
// are completed). Each lesson fills one open notebook: the left page holds
// the definition and the basic syntax, the right page the common syntax
// errors and the real-world applications, the four parts the client's
// chapter docs list for every lesson.
//
// The text follows the client's Code Journal content. Entries are unlocked by
// completed chapters in JournalScreen, so Chapter 1 adds Lesson 1, Chapter 2
// adds Lesson 2, and so on.

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
  // Real-world uses, in words.
  uses: string[]
  // Code for the real-world use, line breaks kept. It's shown as a code
  // block under the uses; code inside `uses` would lose its line breaks.
  example?: string
}

export const JOURNAL: JournalLesson[] = [
  {
    chapter: 1,
    title: 'Lesson 1: The if Statement',
    definition: [
      'An if statement runs a block of code if the condition is true.',
    ],
    syntax: 'if (20 > 18)\n{\n  Console.WriteLine("20 is greater than 18");\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'If or IF',
        fix: 'The word if must be lowercase. Uppercase letters generate an error.',
      },
    ],
    uses: ['Showing your school ID at the entrance if you have it with you.'],
    example:
      'if (hasSchoolId)\n{\n    Console.WriteLine("Access granted. Welcome to school!");\n}',
  },
  {
    chapter: 2,
    title: 'Lesson 2: The if...else Statement',
    definition: [
      'The else statement specifies a block of code to execute if the condition is false.',
    ],
    syntax:
      'int time = 20;\n\nif (time < 18)\n{\n  Console.WriteLine("Good day.");\n}\nelse\n{\n  Console.WriteLine("Good evening.");\n}\n\n// Output "Good evening."',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'if (time < 18);',
        fix: 'A semicolon directly after the if condition terminates the statement prematurely.',
      },
    ],
    uses: [
      'A phone connects to the internet if the password is right; otherwise it shows an error.',
    ],
    example:
      'if (enteredPassword == correctPassword)\n{\n    Console.WriteLine("Connected to Wi-Fi.");\n}\nelse\n{\n    Console.WriteLine("Error: Incorrect password.");\n}',
  },
  {
    chapter: 3,
    title: 'Lesson 3: The else if Statement',
    definition: [
      'The else if statement specifies a new condition to evaluate if the previous condition is false.',
      'Multiple Conditions: Chain multiple else if statements between if and else to handle multi-tiered decisions.',
    ],
    syntax:
      'if (score >= 90)\n{\n    ShowExcellent();\n}\nelse if (score >= 80)\n{\n    ShowVeryGood();\n}\nelse if (score >= 75)\n{\n    ShowGood();\n}\nelse\n{\n    ShowNeedsImprovement();\n}',
    syntaxNotes: [
      'Checks conditions in order from top to bottom.',
      'Executes the first matching block and skips the rest.',
      'The else block is optional and acts as the fallback.',
    ],
    mistakes: [
      {
        wrong: 'elseif (condition)',
        fix: 'In C#, else if must be written as two separate words with a space.',
      },
      {
        wrong: 'if (...) { } else { } else if (...) { }',
        fix: 'The fallback else block must always come last in the sequence.',
      },
      {
        wrong: 'else if (condition)\n    action1();\n    action2();',
        fix: 'Always enclose blocks with curly braces { } so all statements execute together.',
      },
    ],
    uses: [
      'University Laboratory Performance: Rating students as Excellent, Very Good, Good, or Needs Improvement.',
      'Grading and Award Tiers: Assigning Gold, Silver, Bronze, or Certificate awards based on scores.',
    ],
    example:
      'int score = 88;\n\nif (score >= 90)\n{\n    Console.WriteLine("Performance: Excellent");\n}\nelse if (score >= 80)\n{\n    Console.WriteLine("Performance: Very Good");\n}\nelse if (score >= 75)\n{\n    Console.WriteLine("Performance: Good");\n}\nelse\n{\n    Console.WriteLine("Performance: Needs Improvement");\n}',
  },
  {
    chapter: 4,
    title: 'Lesson 4: The switch Statement',
    definition: [
      'The switch statement selects one of many code blocks to be executed based on a matching case value.',
      'Use switch when comparing a single variable against multiple fixed, discrete options instead of chaining multiple if...else statements.',
    ],
    syntax:
      'switch (option)\n{\n    case 1:\n        ViewSchedule();\n        break;\n    case 2:\n        ViewGrades();\n        break;\n    default:\n        ShowInvalidOption();\n        break;\n}',
    syntaxNotes: [
      'The switch expression is evaluated once and compared against each case value.',
      'Each case represents a possible value and must end with a colon (:).',
      'The break statement ends the selected case and exits the switch.',
      'The default block is optional and executes if no case values match.',
    ],
    mistakes: [
      {
        wrong: 'case 1 ViewSchedule();',
        fix: 'Each case label must include a value followed by a colon (:).',
      },
      {
        wrong: 'Missing break statement',
        fix: 'In C#, each non-empty case block must end with a break; statement to prevent unintended fall-through.',
      },
      {
        wrong: 'default InvalidChoice();',
        fix: 'The default keyword must always be followed by a colon (:).',
      },
    ],
    uses: [
      'Campus Self-Service Kiosks: Selecting between Schedule, Grades, and Registration forms.',
      'Laboratory Workstation Assignment: Directing students to Computer 1, 2, or 3.',
      'Menu Selection: Choosing exercises such as Variables, Operators, or Control Structures.',
      'Campus Navigation: Routing users to destinations like the Library, Cafeteria, or Programming Lab.',
    ],
    example:
      'int destination = 1;\n\nswitch (destination)\n{\n    case 1:\n        Console.WriteLine("Destination: Library");\n        break;\n    case 2:\n        Console.WriteLine("Destination: Cafeteria");\n        break;\n    case 3:\n        Console.WriteLine("Destination: Programming Laboratory");\n        break;\n    default:\n        Console.WriteLine("Error: Invalid destination.");\n        break;\n}',
  },
  {
    chapter: 5,
    title: 'Lesson 5: The while Loop',
    definition: [
      'The while loop loops through a block of code as long as a specified condition is true.',
    ],
    syntax:
      'int i = 0;\n\nwhile (i < 5)\n{\n  Console.WriteLine(i);\n  i++;\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'while (condition) { }',
        fix: 'Forgetting to increase the variable used in the condition makes the loop never end.',
      },
    ],
    uses: [
      'Downloading the learning module while the computer is still connected to the internet.',
    ],
    example:
      'while (isConnected && downloadProgress < 100)\n{\n    downloadProgress += 25;\n    Console.WriteLine("Downloading: " + downloadProgress + "%");\n}',
  },
  {
    chapter: 6,
    title: 'Lesson 6: The do...while Loop',
    definition: [
      'The do...while loop executes the code block once before checking if the condition is true, then repeats while the condition is true.',
    ],
    syntax:
      'int i = 0;\n\ndo\n{\n  Console.WriteLine(i);\n  i++;\n}\nwhile (i < 5);',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'do { } while (condition);',
        fix: 'Just like a while loop, forgetting to increase the variable used in the condition makes the loop never end.',
      },
    ],
    uses: [
      'A retry login prompt asks for credentials at least once and keeps prompting while the input remains invalid.',
    ],
    example:
      'do\n{\n    Console.Write("Enter your PIN: ");\n    inputPin = Console.ReadLine();\n}\nwhile (inputPin != "1234");\n\nConsole.WriteLine("PIN accepted. Logged in successfully!");',
  },
  {
    chapter: 7,
    title: 'Lesson 7: The for Loop',
    definition: [
      'The for loop illustrates how many times you want to loop through a block of code. Use the for loop instead of a while loop for this pattern.',
    ],
    syntax: 'for (int i = 0; i < 5; i++)\n{\n  Console.WriteLine(i);\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'i <= 5 instead of i < 5',
        fix: 'Off-by-one errors can cause the loop to run one too many or one too few times.',
      },
    ],
    uses: [
      'A queue of five students arrives at the university entrance gate one by one. The security system checks each student for a valid school ID.',
    ],
    example:
      'for (int i = 0; i < hasValidId.Length; i++) {\n    if (hasValidId[i]) {\n        Console.WriteLine($"Student {i + 1}: Valid ID presented. Access granted.");\n    } else {\n        Console.WriteLine($"Student {i + 1}: No ID detected. Access denied.");\n    }\n}',
  },
]
