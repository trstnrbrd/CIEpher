import { assert, assertEquals, assertFalse } from "@std/assert";
import { CHAPTERS } from "../../../content/index.ts";
import { findMistakes, sameCode, tokenize } from "./csharp.ts";

const texts = (code: string) => tokenize(code).map((t) => t.text);

// ---------- splitting code into pieces ----------

Deno.test("code is split into the pieces C# sees", () => {
  assertEquals(texts("if(score >= 75){Pass();}"), [
    "if",
    "(",
    "score",
    ">=",
    "75",
    ")",
    "{",
    "Pass",
    "(",
    ")",
    ";",
    "}",
  ]);
});

Deno.test("each piece knows where it is in what was typed", () => {
  assertEquals(tokenize("  if (x)"), [
    { text: "if", start: 2, end: 4 },
    { text: "(", start: 5, end: 6 },
    { text: "x", start: 6, end: 7 },
    { text: ")", start: 7, end: 8 },
  ]);
});

Deno.test("text in quotes stays one piece, spaces included", () => {
  assertEquals(texts('Console.WriteLine("Hi   there");'), [
    "Console",
    ".",
    "WriteLine",
    "(",
    '"Hi   there"',
    ")",
    ";",
  ]);
  assertEquals(texts(`x = 'a'; y = "say \\"hi\\"";`), [
    "x",
    "=",
    "'a'",
    ";",
    "y",
    "=",
    '"say \\"hi\\""',
    ";",
  ]);
});

Deno.test("comments are ignored, like in C#", () => {
  assertEquals(texts("OpenDoor(); // opens it\n/* done */"), [
    "OpenDoor",
    "(",
    ")",
    ";",
  ]);
});

Deno.test("numbers with a decimal point stay one piece", () => {
  assertEquals(texts("x = 1.5f + 2e-3;"), ["x", "=", "1.5f", "+", "2e-3", ";"]);
});

// ---------- right or wrong (the client's rules) ----------

Deno.test("extra spaces, line breaks and indentation don't matter", () => {
  assert(sameCode("OpenDoor ( ) ;", "OpenDoor();"));
  assert(
    sameCode(
      "if (hasPower) { StartComputer(); }",
      "if(hasPower)\n{\n    StartComputer();\n}",
    ),
  );
  assert(
    sameCode(
      "if(hasPower){StartComputer();}",
      "if(hasPower)\n{\n    StartComputer();\n}",
    ),
  );
  assert(sameCode("else  \t if", "else if"));
});

Deno.test("capitals matter, like in real C#", () => {
  assertFalse(sameCode("opendoor();", "OpenDoor();"));
  assertFalse(
    sameCode(
      "IF(isCompleted){SubmitActivity();}",
      "if(isCompleted){SubmitActivity();}",
    ),
  );
  assertFalse(
    sameCode(
      "if(hasSchoolId){EnterSchool();}",
      "if(hasSchoolID){EnterSchool();}",
    ),
  );
});

Deno.test("a space inside a name is a mistake", () => {
  assertFalse(sameCode("Open Door();", "OpenDoor();"));
});

Deno.test("symbols split by a space are wrong, as C# says", () => {
  assertFalse(
    sameCode("if(score = = 75){Pass();}", "if(score == 75){Pass();}"),
  );
  assertFalse(
    sameCode("if(score > = 75){Pass();}", "if(score >= 75){Pass();}"),
  );
  assertFalse(sameCode("if(a & & b){Pass();}", "if(a && b){Pass();}"));
  assertFalse(sameCode("i + +;", "i++;"));
  assertFalse(sameCode("x = 1 . 5;", "x = 1.5;"));
  // Touching symbols are still fine, however they're spaced from the rest.
  assert(sameCode("if ( score>=75 )", "if(score >= 75)"));
});

Deno.test("text in quotes must match exactly", () => {
  assertFalse(
    sameCode(
      'Console.WriteLine("Hi   there");',
      'Console.WriteLine("Hi there");',
    ),
  );
  assert(
    sameCode(
      'Console.WriteLine( "Hi there" ) ;',
      'Console.WriteLine("Hi there");',
    ),
  );
});

Deno.test("phone keyboards' curly quotes count as plain quotes", () => {
  const open = String.fromCharCode(0x201c);
  const close = String.fromCharCode(0x201d);
  assert(
    sameCode(
      `Console.WriteLine(${open}hi${close});`,
      'Console.WriteLine("hi");',
    ),
  );
  const nbsp = String.fromCharCode(0xa0);
  assert(sameCode(`else${nbsp}if`, "else if"));
});

// ---------- the game's answer keys ----------

// Every chapter's answer keys and the wrong choices from the client's docs
// (backend/content/). `npm run answers:check` also proves them with the real
// C# compiler.
Deno.test("each answer key is right, also on one line or spaced out", () => {
  for (const chapter of CHAPTERS) {
    for (const { answer } of chapter.questions) {
      assert(sameCode(answer, answer), answer);
      assert(sameCode(answer.replace(/\s*\n\s*/g, " "), answer), answer);
      const spacedOut = tokenize(answer)
        .map((t) => t.text)
        .join(" ");
      assert(sameCode(`  ${spacedOut}  `, answer), answer);
    }
  }
});

Deno.test("each wrong choice in the client's docs is wrong", () => {
  for (const chapter of CHAPTERS) {
    for (const { answer, wrong } of chapter.questions) {
      for (const choice of wrong) {
        assertFalse(sameCode(choice, answer), choice);
        // ...and has something to point out.
        assert(findMistakes(choice, [answer]).length > 0, choice);
      }
    }
  }
});

// ---------- which part is wrong ----------

Deno.test("mistakes: missing parentheses around the condition", () => {
  // The doc's wrong choice for chapter 1, mission 1.
  const typed = "if hasSchoolID\n{\n    EnterSchool();\n}";
  // Something is missing right after "if" and right after "hasSchoolID".
  assertEquals(
    findMistakes(typed, ["if(hasSchoolID)\n{\n    EnterSchool();\n}"]),
    [
      { start: 2, end: 2 },
      { start: 14, end: 14 },
    ],
  );
});

Deno.test("mistakes: IF in capitals", () => {
  assertEquals(
    findMistakes("IF(isCompleted){SubmitActivity();}", [
      "if(isCompleted){SubmitActivity();}",
    ]),
    [{ start: 0, end: 2 }],
  );
});

Deno.test("mistakes: a missing semicolon", () => {
  // Missing right after "StartComputer()".
  assertEquals(
    findMistakes("if(hasPower){StartComputer()}", [
      "if(hasPower){StartComputer();}",
    ]),
    [{ start: 28, end: 28 }],
  );
});

Deno.test("mistakes: missing braces", () => {
  const typed = "if(isPresent) RecordAttendance();";
  assertEquals(findMistakes(typed, ["if(isPresent){RecordAttendance();}"]), [
    { start: 13, end: 13 },
    { start: 33, end: 33 },
  ]);
});

Deno.test("mistakes: wrong pieces next to each other are one mistake", () => {
  assertEquals(findMistakes("Open Door();", ["OpenDoor();"]), [
    { start: 0, end: 9 },
  ]);
});

Deno.test("mistakes: a wrong choice word", () => {
  assertEquals(findMistakes("while", ["if"]), [{ start: 0, end: 5 }]);
});

Deno.test("mistakes: positions count from what was typed", () => {
  assertEquals(findMistakes("  opendoor();", ["OpenDoor();"]), [
    { start: 2, end: 10 },
  ]);
});

Deno.test("mistakes: compared with the closest accepted answer", () => {
  assertEquals(findMistakes("Open()", ["OpenDoor();", "Open();"]), [
    { start: 6, end: 6 },
  ]);
});

Deno.test("mistakes: only a comment typed", () => {
  assertEquals(findMistakes("// hi", ["OpenDoor();"]), [{ start: 0, end: 0 }]);
});

Deno.test("mistakes: a right answer has none", () => {
  assertEquals(findMistakes("OpenDoor ( ) ;", ["OpenDoor();"]), []);
});
