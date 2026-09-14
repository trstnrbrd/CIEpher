// Every chapter's answer keys, one file per chapter: the one place to add a
// new chapter's answers (see README.md). From here:
// - `npm run answers:check` proves them with the real C# compiler and checks
//   the local database holds exactly these answers;
// - `npm run answers:sql -- <chapter>` writes the chapter's migration;
// - the API tests (csharp.test.ts) check them against the answer checker.
import chapter0 from "./chapter-0.json" with { type: "json" };
import chapter1 from "./chapter-1.json" with { type: "json" };
import chapter2 from "./chapter-2.json" with { type: "json" };
import chapter3 from "./chapter-3.json" with { type: "json" };

export type Question = {
  mission: number;
  // Counted from 1 in each mission. Most missions ask one question.
  question: number;
  // The accepted answer, exactly as stored in the database.
  answer: string;
  // The wrong choice(s) shown next to it in the client's doc.
  wrong: string[];
  // false for a choice that isn't a line of code (e.g. "if" or "while").
  code?: boolean;
};

export type Chapter = {
  chapter: number;
  title: string;
  // The client's doc this chapter comes from.
  source: string;
  // The C# the answers rely on (variables and methods), so each answer can
  // be compiled as part of a real program. Wrong choices get only these too,
  // so a misspelled name is still an error.
  program: string[];
  questions: Question[];
};

export const CHAPTERS: Chapter[] = [chapter0, chapter1, chapter2, chapter3];
