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
  uses: string[]
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
    uses: [
      'Showing your school ID at the entrance if you have it with you.',
      'if (hasSchoolId)\n{\n    Console.WriteLine("Access granted. Welcome to school!");\n}',
    ],
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
      'if (enteredPassword == correctPassword)\n{\n    Console.WriteLine("Connected to Wi-Fi.");\n}\nelse\n{\n    Console.WriteLine("Error: Incorrect password.");\n}',
    ],
  },
  {
    chapter: 3,
    title: 'Lesson 3: The else if Statement',
    definition: [
      'The else if statement specifies a new condition if the first condition is false.',
    ],
    syntax:
      'int time = 22;\n\nif (time < 10) {\n    Console.WriteLine("Good morning");\n} else if (time < 20) {\n    Console.WriteLine("Good day");\n} else {\n    Console.WriteLine("Good evening");\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'if (...) { } else { } else if (...) { }',
        fix: 'The alternative else block should always come last in the sequence of conditions.',
      },
    ],
    uses: [
      'A grading system checks whether a student has a grade of 90, 80, or 70, or a failing grade.',
      'int grade = 85;\n\nif (grade >= 90)\n{\n    Console.WriteLine("Grade: A (Excellent)");\n}\nelse if (grade >= 80)\n{\n    Console.WriteLine("Grade: B (Good)");\n}\nelse if (grade >= 70)\n{\n    Console.WriteLine("Grade: C (Pass)");\n}\nelse\n{\n    Console.WriteLine("Failing grade.");\n}',
    ],
  },
  {
    chapter: 4,
    title: 'Lesson 4: The Switch Statement',
    definition: [
      'Evaluates an expression once and compares its value against multiple case options to execute matching code blocks.',
    ],
    syntax:
      'switch(expression)\n{\n  case x:\n    // code block\n    break;\n\n  case y:\n    // code block\n    break;\n\n  default:\n    // code block\n    break;\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'Missing break statements',
        fix: 'Forgetting break, return, or goto causes execution to mistakenly bleed into the next case.',
      },
    ],
    uses: [
      'Menu navigation in an activity tab can open an exercise for variables or operators.',
      'switch (selectedActivity)\n{\n    case "Variables":\n        Console.WriteLine("Opening Variables practice exercise...");\n        break;\n\n    case "Operators":\n        Console.WriteLine("Opening Operators practice exercise...");\n        break;\n\n    default:\n        Console.WriteLine("Unknown menu selection.");\n        break;\n}',
    ],
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
      'while (isConnected && downloadProgress < 100)\n{\n    downloadProgress += 25;\n    Console.WriteLine("Downloading: " + downloadProgress + "%");\n}',
    ],
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
      'do\n{\n    Console.Write("Enter your PIN: ");\n    inputPin = Console.ReadLine();\n}\nwhile (inputPin != "1234");\n\nConsole.WriteLine("PIN accepted. Logged in successfully!");',
    ],
  },
  {
    chapter: 7,
    title: 'Lesson 7: The For while Loop',
    definition: [
      'The for loop illustrates how many times you want to loop through a block of code. Use the for loop instead of a while loop for this pattern.',
    ],
    syntax: 'for (int i = 0; i < 5; i++) {\n  cout << i << "\\n";\n}',
    syntaxNotes: [],
    mistakes: [
      {
        wrong: 'i <= 5 instead of i < 5',
        fix: 'Off-by-one errors can cause the loop to run one too many or one too few times.',
      },
    ],
    uses: [
      'A queue of five students arrives at the university entrance gate one by one. The security system checks each student for a valid school ID.',
      'for (int i = 0; i < hasValidId.Length; i++) {\n    if (hasValidId[i]) {\n        Console.WriteLine($"Student {i + 1}: Valid ID presented. Access granted.");\n    } else {\n        Console.WriteLine($"Student {i + 1}: No ID detected. Access denied.");\n    }\n}',
    ],
  },
]
