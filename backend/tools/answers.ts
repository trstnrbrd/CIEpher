// The game's answer keys (content/): checks them, and writes a new chapter's
// migration. Run from backend/:
//
//   npm run answers:check      proves every chapter with the real C# compiler
//                              (needs Docker Desktop) and compares the answers
//                              with the local database
//   npm run answers:sql -- 2   writes chapter 2's migration from its content
//                              file (content/chapter-2.json), and updates
//                              the database test answer_keys.test.sql
//   npm run answers:tests      only updates answer_keys.test.sql (e.g. after
//                              fixing an answer with a new migration)
//
// Adding a chapter, step by step: content/README.md.
import { sameCode } from "../supabase/functions/api/csharp.ts";
import { type Chapter, CHAPTERS, type Question } from "../content/index.ts";

// The official .NET SDK: the same C# compiler (Roslyn) as Visual Studio.
const DOTNET_IMAGE = "mcr.microsoft.com/dotnet/sdk:10.0";
// The local Supabase database (config.toml's project_id is "ciepher").
const DB_CONTAINER = "supabase_db_ciepher";

type Report = { problems: number; warnings: number };

const report: Report = { problems: 0, warnings: 0 };
const ok = (text: string) => console.log(`  ok    ${text}`);
const warn = (text: string) => {
  report.warnings++;
  console.log(`  WARN  ${text}`);
};
const problem = (text: string) => {
  report.problems++;
  console.log(`  FAIL  ${text}`);
};

// "M1" or "M1 Q2" (the question number only when the mission has more).
function where(chapter: Chapter, q: Question): string {
  const many = chapter.questions.some(
    (other) => other.mission === q.mission && other.question > 1,
  );
  return many ? `M${q.mission} Q${q.question}` : `M${q.mission}`;
}

// Code on one line, for the report.
const oneLine = (code: string) => code.replace(/\s*\n\s*/g, " ");

// ---------- 1. the content files themselves ----------

function checkContent(): void {
  console.log("\nContent files");
  const numbers = CHAPTERS.map((c) => c.chapter);
  if (new Set(numbers).size !== numbers.length) {
    problem(`a chapter number is used twice: ${numbers.join(", ")}`);
  }
  let fine = true;
  for (const chapter of CHAPTERS) {
    const missions = [...new Set(chapter.questions.map((q) => q.mission))];
    if (missions.some((m, i) => m !== i + 1)) {
      fine = false;
      problem(
        `chapter ${chapter.chapter}: missions must be 1, 2, 3... in order (got ${missions.join(", ")})`,
      );
    }
    for (const m of missions) {
      const qs = chapter.questions
        .filter((q) => q.mission === m)
        .map((q) => q.question);
      if (qs.some((n, i) => n !== i + 1)) {
        fine = false;
        problem(
          `chapter ${chapter.chapter}, mission ${m}: questions must be 1, 2... in order (got ${qs.join(", ")})`,
        );
      }
    }
    for (const q of chapter.questions) {
      if (q.answer.trim() === "") {
        fine = false;
        problem(
          `chapter ${chapter.chapter} ${where(chapter, q)}: the answer is empty`,
        );
      }
      if (q.wrong.length === 0) {
        warn(
          `chapter ${chapter.chapter} ${where(chapter, q)}: no wrong choice to check`,
        );
      }
      for (const wrong of q.wrong) {
        if (sameCode(wrong, q.answer)) {
          fine = false;
          problem(
            `chapter ${chapter.chapter} ${where(chapter, q)}: the wrong choice "${oneLine(wrong)}" counts as the right answer`,
          );
        }
      }
    }
  }
  if (fine) {
    ok("missions and questions are in order; no wrong choice counts as right");
  }
}

// ---------- 2. the real C# compiler ----------

type Errors = Map<string, string[]>;

// One C# file: the chapter's program, with the snippet inside a method.
function csharpFile(name: string, program: string[], snippet: string): string {
  const members = program.map((line) => `    ${line}`).join("\n");
  const body = snippet
    .split("\n")
    .map((line) => `        ${line}`)
    .join("\n");
  return `using System;\nclass ${name}\n{\n${members}\n\n    void Run()\n    {\n${body}\n    }\n}\n`;
}

// Compiles files in one go and returns each file's errors ("CS1002: ; expected").
// Throws if Docker itself fails.
async function compile(files: Map<string, string>): Promise<Errors> {
  const dir = await Deno.makeTempDir({ prefix: "ciepher-csharp-" });
  try {
    for (const [name, source] of files) {
      await Deno.writeTextFile(`${dir}/${name}.cs`, source);
    }
    const script = [
      "SDK=$(ls -d /usr/share/dotnet/sdk/*/ | head -1)",
      "REF=$(ls -d /usr/share/dotnet/packs/Microsoft.NETCore.App.Ref/*/ref/net*/ | head -1)",
      'for r in "$REF"*.dll; do echo "-r:$r"; done > /tmp/refs.rsp',
      'cd /w && dotnet "${SDK}Roslyn/bincore/csc.dll" -nologo -t:library -out:/tmp/o.dll @/tmp/refs.rsp *.cs',
    ].join(" && ");
    const run = await new Deno.Command("docker", {
      args: [
        "run",
        "--rm",
        "-v",
        `${dir}:/w`,
        DOTNET_IMAGE,
        "sh",
        "-c",
        script,
      ],
      stdout: "piped",
      stderr: "piped",
    }).output();
    const text = new TextDecoder().decode(run.stdout);
    const errors: Errors = new Map();
    for (const line of text.split("\n")) {
      const found = line.match(
        /^(\w+)\.cs\(\d+,\d+\): error (CS\d+): (.*?)( \[.*\])?\s*$/,
      );
      if (found) {
        errors.set(found[1], [
          ...(errors.get(found[1]) ?? []),
          `${found[2]}: ${found[3]}`,
        ]);
      }
    }
    // csc fails when the code has errors; anything else means Docker failed.
    if (!run.success && errors.size === 0) {
      throw new Error(
        new TextDecoder().decode(run.stderr).trim() || text.trim(),
      );
    }
    return errors;
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

// Compiles each file, reliably: C# skips its deeper checks (like "does this
// name exist?") when any file has a grammar error, so the files without one
// are compiled again on their own.
async function compileEach(files: Map<string, string>): Promise<Errors> {
  const first = await compile(files);
  const rest = new Map([...files].filter(([name]) => !first.has(name)));
  const second = rest.size > 0 ? await compile(rest) : new Map();
  return new Map([...first, ...second]);
}

// Every way of adding one space to the answer that the game still accepts.
function acceptedSpacings(answer: string): string[] {
  const versions = new Set<string>([oneLine(answer)]);
  for (let i = 0; i <= answer.length; i++) {
    const version = answer.slice(0, i) + " " + answer.slice(i);
    if (sameCode(version, answer)) versions.add(version);
  }
  return [...versions];
}

async function checkWithCompiler(): Promise<void> {
  console.log("\nThe real C# compiler");
  const answers = new Map<string, string>();
  const wrongs = new Map<string, string>();
  const spacings = new Map<string, string[]>(); // question -> its files
  for (const chapter of CHAPTERS) {
    for (const q of chapter.questions) {
      if (q.code === false) continue;
      const id = `C${chapter.chapter}M${q.mission}Q${q.question}`;
      answers.set(`${id}A`, csharpFile(`${id}A`, chapter.program, q.answer));
      const names: string[] = [];
      acceptedSpacings(q.answer).forEach((version, i) => {
        names.push(`${id}S${i}`);
        answers.set(
          `${id}S${i}`,
          csharpFile(`${id}S${i}`, chapter.program, version),
        );
      });
      spacings.set(id, names);
      q.wrong.forEach((wrong, i) => {
        wrongs.set(
          `${id}W${i}`,
          csharpFile(`${id}W${i}`, chapter.program, wrong),
        );
      });
    }
  }

  let rightErrors: Errors;
  let wrongErrors: Errors;
  try {
    rightErrors = await compileEach(answers);
    wrongErrors = await compileEach(wrongs);
  } catch (error) {
    problem(
      `couldn't run the compiler: is Docker Desktop running? (${String(error).split("\n")[0]})`,
    );
    return;
  }

  for (const chapter of CHAPTERS) {
    console.log(`\nChapter ${chapter.chapter}: ${chapter.title}`);
    for (const q of chapter.questions) {
      const at = where(chapter, q);
      if (q.code === false) {
        ok(`${at}  "${q.answer}" is a choice, not code (not compiled)`);
        continue;
      }
      const id = `C${chapter.chapter}M${q.mission}Q${q.question}`;
      const answerErrors = rightErrors.get(`${id}A`);
      if (answerErrors) {
        problem(`${at}  the answer doesn't compile: ${answerErrors[0]}`);
      } else {
        const names = spacings.get(id) ?? [];
        const broken = names.filter((name) => rightErrors.has(name));
        if (broken.length > 0) {
          problem(
            `${at}  the answer compiles, but ${broken.length} of the ${names.length} spacings the game accepts don't (${rightErrors.get(broken[0])![0]})`,
          );
        } else {
          ok(
            `${at}  the answer compiles, and so do all ${names.length} spacings the game accepts`,
          );
        }
      }
      q.wrong.forEach((wrong, i) => {
        const errors = wrongErrors.get(`${id}W${i}`);
        if (errors) {
          ok(
            `${at}  wrong choice "${oneLine(wrong)}" is an error in C# (${errors[0]})`,
          );
        } else if (q.appropriateness) {
          // The epilogue exam tests judgement: a choice can compile and still
          // be wrong (wrong structure, or a stray ";" that skips the block).
          ok(
            `${at}  wrong choice "${oneLine(wrong)}" is valid C# on purpose (this question tests judgement, not only syntax)`,
          );
        } else {
          warn(
            `${at}  wrong choice "${oneLine(wrong)}" is valid C#: the game calls it wrong, so check it with the client`,
          );
        }
      });
    }
  }
}

// ---------- 3. the local database ----------

type Row = {
  chapter: number;
  mission: number;
  question: number;
  answer: string;
};
const rowKey = (r: Row) =>
  `${r.chapter}|${r.mission}|${r.question}|${r.answer}`;

async function databaseAnswers(): Promise<Row[] | null> {
  const sql =
    "select coalesce(json_agg(json_build_object('chapter', chapter_id, 'mission', mission_number, 'question', question, 'answer', answer)), '[]') from public.mission_answers";
  try {
    const run = await new Deno.Command("docker", {
      args: [
        "exec",
        DB_CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-tAc",
        sql,
      ],
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (!run.success) return null;
    return JSON.parse(new TextDecoder().decode(run.stdout));
  } catch {
    return null;
  }
}

async function checkDatabase(): Promise<void> {
  console.log("\nThe local database");
  const rows = await databaseAnswers();
  if (!rows) {
    warn(
      "the local database isn't running, so it wasn't compared (start it: npx supabase start)",
    );
    return;
  }
  const content: Row[] = CHAPTERS.flatMap((c) =>
    c.questions.map((q) => ({
      chapter: c.chapter,
      mission: q.mission,
      question: q.question,
      answer: q.answer,
    })),
  );
  const inDatabase = new Set(rows.map(rowKey));
  const inContent = new Set(content.map(rowKey));
  const chaptersInDatabase = new Set(rows.map((r) => r.chapter));
  let same = true;
  for (const chapter of CHAPTERS) {
    if (!chaptersInDatabase.has(chapter.chapter)) {
      same = false;
      warn(
        `chapter ${chapter.chapter} isn't in the local database yet (add its migration, then: npx supabase migration up --local)`,
      );
      continue;
    }
    for (const q of chapter.questions) {
      const row = {
        chapter: chapter.chapter,
        mission: q.mission,
        question: q.question,
        answer: q.answer,
      };
      if (!inDatabase.has(rowKey(row))) {
        same = false;
        problem(
          `chapter ${chapter.chapter} ${where(chapter, q)}: the database's answer is different from the content file`,
        );
      }
    }
  }
  for (const row of rows) {
    if (
      !inContent.has(rowKey(row)) &&
      CHAPTERS.some((c) => c.chapter === row.chapter)
    ) {
      same = false;
      problem(
        `chapter ${row.chapter} M${row.mission} Q${row.question}: the database has an answer the content file doesn't`,
      );
    }
  }
  const unknown = [...chaptersInDatabase].filter(
    (n) => !CHAPTERS.some((c) => c.chapter === n),
  );
  if (unknown.length > 0) {
    same = false;
    problem(
      `the database has answers for chapter(s) ${unknown.join(", ")}, which have no content file`,
    );
  }
  if (same) ok(`the database holds exactly these ${content.length} answers`);
}

async function check(): Promise<number> {
  const count = CHAPTERS.reduce((n, c) => n + c.questions.length, 0);
  console.log(
    `CIEpher answer keys: ${CHAPTERS.length} chapters, ${count} answers`,
  );
  checkContent();
  await checkWithCompiler();
  await checkDatabase();
  await checkKeysTest();
  console.log(
    `\n${report.problems === 0 ? "All good" : "Fix these first"}: ${report.problems} problem(s), ${report.warnings} warning(s).`,
  );
  return report.problems === 0 ? 0 : 1;
}

// ---------- the database test: answer_keys.test.sql ----------

const KEYS_TEST = new URL(
  "../supabase/tests/database/answer_keys.test.sql",
  import.meta.url,
);

// The whole of answer_keys.test.sql, written from the content files. CI runs
// it on every PR, so the database must hold exactly these answer keys.
function answerKeysTest(): string {
  const tests = [
    `-- Every mission has at least one answer.
select is_empty(
  $$select m.chapter_id, m.number from public.missions m
    where not exists (
      select 1 from public.mission_answers a
      where a.chapter_id = m.chapter_id and a.mission_number = m.number
    )$$,
  'every mission has an answer'
);`,
    `-- A mission's questions are numbered 1, 2, 3... with no gaps, so the
-- highest number really is the last question.
select is_empty(
  $$select chapter_id, mission_number from public.mission_answers
    group by chapter_id, mission_number
    having min(question) <> 1 or max(question) <> count(distinct question)$$,
  'questions are numbered from 1 with no gaps'
);`,
    `-- Every chapter with missions has a content file (backend/content/).
select is_empty(
  $$select distinct chapter_id from public.missions
    where chapter_id not in (${CHAPTERS.map((c) => c.chapter).join(", ")})$$,
  'every chapter with missions has a content file'
);`,
  ];
  for (const chapter of CHAPTERS) {
    const n = chapter.chapter;
    const missions = [...new Set(chapter.questions.map((q) => q.mission))];
    const layout = missions
      .map((m) => {
        const last = Math.max(
          ...chapter.questions
            .filter((q) => q.mission === m)
            .map((q) => q.question),
        );
        return `(${m}, ${last})`;
      })
      .join(", ");
    const rows = [...chapter.questions]
      .sort(
        (a, b) =>
          a.mission - b.mission ||
          a.question - b.question ||
          (a.answer < b.answer ? -1 : a.answer > b.answer ? 1 : 0),
      )
      .map((q) => `    (${q.mission}, ${q.question}, ${sqlText(q.answer)})`)
      .join(",\n");
    tests.push(`-- Chapter ${n}: ${chapter.title}. Its missions, and how many
-- questions each one asks.
select results_eq(
  $$select mission_number::int, max(question)::int from public.mission_answers
    where chapter_id = ${n} group by 1 order by 1$$,
  $$values ${layout}$$,
  'chapter ${n}: its missions and questions'
);`);
    tests.push(`-- Chapter ${n}'s answer keys, exactly.
select results_eq(
  $$select mission_number::int, question::int, answer from public.mission_answers
    where chapter_id = ${n} order by 1, 2, answer collate "C"$$,
  $keys$values
${rows}$keys$,
  'chapter ${n}: its answer keys'
);`);
  }
  return `-- Written by \`npm run answers:sql\` (or \`npm run answers:tests\`) from
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
select plan(${tests.length});

${tests.join("\n\n")}

select * from finish();
rollback;
`;
}

async function writeKeysTest(): Promise<void> {
  await Deno.writeTextFile(KEYS_TEST, answerKeysTest());
}

async function checkKeysTest(): Promise<void> {
  console.log("\nThe database test (answer_keys.test.sql)");
  let current = "";
  try {
    current = await Deno.readTextFile(KEYS_TEST);
  } catch {
    // Missing: out of date too.
  }
  if (current.replaceAll("\r\n", "\n") === answerKeysTest()) {
    ok("it matches the content files");
  } else {
    problem(
      "it's out of date with the content files: run npm run answers:tests",
    );
  }
}

// ---------- writing a chapter's migration ----------

// SQL text in E'...' form, so line breaks are written as \n and a Windows
// checkout can't add a carriage return to an answer.
function sqlText(text: string): string {
  const escaped = text
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\r", "")
    .replaceAll("\n", "\\n")
    .replaceAll("\t", "\\t");
  return `E'${escaped}'`;
}

async function writeMigration(number: number): Promise<number> {
  const chapter = CHAPTERS.find((c) => c.chapter === number);
  if (!chapter) {
    console.error(
      `There's no content for chapter ${number}. Add content/chapter-${number}.json and list it in content/index.ts first.`,
    );
    return 1;
  }
  const folder = new URL("../supabase/migrations/", import.meta.url);
  const name = `_chapter_${number}_missions.sql`;
  for await (const file of Deno.readDir(folder)) {
    if (file.name.endsWith(name)) {
      console.error(
        `Chapter ${number} already has a migration: ${file.name}. Change answers with a new migration instead.`,
      );
      return 1;
    }
  }

  const missions = [...new Set(chapter.questions.map((q) => q.mission))];
  const rows = chapter.questions.map(
    (q) => `  (${number}, ${q.mission}, ${q.question}, ${sqlText(q.answer)})`,
  );
  const sql = `-- Chapter ${number}: ${chapter.title} (from ${chapter.source}).
-- Written by \`npm run answers:sql -- ${number}\` from content/chapter-${number}.json,
-- and checked with the real C# compiler (\`npm run answers:check\`).
-- The story, the choices and the Program Flow live in the frontend.

insert into public.missions (chapter_id, number) values
  ${missions.map((m) => `(${number}, ${m})`).join(", ")};

insert into public.mission_answers
  (chapter_id, mission_number, question, answer)
values
${rows.join(",\n")};
`;
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const file = new URL(`${stamp}${name}`, folder);
  await Deno.writeTextFile(file, sql);
  await writeKeysTest();

  console.log(`Wrote supabase/migrations/${stamp}${name}
Updated supabase/tests/database/answer_keys.test.sql

Next, from backend/:
  npx supabase migration up --local
  npm run db:test
  npm test
  npm run answers:check`);
  return 0;
}

const [command, argument] = Deno.args;
if (command === "check") {
  Deno.exit(await check());
} else if (command === "sql" && /^\d+$/.test(argument ?? "")) {
  Deno.exit(await writeMigration(Number(argument)));
} else if (command === "tests") {
  await writeKeysTest();
  console.log("Updated supabase/tests/database/answer_keys.test.sql");
} else {
  console.error(
    'Use "check", "tests", or "sql" with a chapter number (e.g. sql 2).',
  );
  Deno.exit(1);
}
