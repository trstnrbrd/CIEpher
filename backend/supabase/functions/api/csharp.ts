// Reads C# code the way the C# compiler splits it up, so answers are compared
// piece by piece instead of letter by letter. That decides whether an answer
// is right, and when it isn't, which part of it is wrong.
//
// The client's rules: capitals matter, extra spaces don't. Spaces only matter
// where C# cares about them: "Open Door" is two names, "> =" is not ">=", and
// text in quotes must match exactly.

// One piece of code: a name or keyword (if, OpenDoor), a number (75), a symbol
// (( ) ; == >=) or text in quotes ("Hi"). `start` and `end` say where it is in
// the text the player typed (`end` is just past its last character).
export type Token = { text: string; start: number; end: number };

// A part of the player's answer to point out. When start < end, those
// characters are wrong. When start === end, something is missing right there.
export type Mistake = { start: number; end: number };

// C# symbols longer than one character, longest first. C# only reads them as
// one symbol when their characters touch: "a > = b" doesn't compile.
const SYMBOLS = [
  ">>>=",
  "<<=",
  ">>=",
  "??=",
  ">>>",
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "<<",
  ">>",
  "=>",
  "??",
  "?.",
  "::",
  "->",
  "..",
];

const WORD = /[\p{L}\p{N}_]/u;
const DIGIT = /[0-9]/;

// Phone keyboards type curly quotes and non-breaking spaces: read them as the
// plain characters C# uses. Each is one character, so positions don't move.
function plainCharacters(code: string): string {
  return code
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00a0/g, " ");
}

// Where a string starting at `i` ends (just past its closing quote), or where
// the text or line ends if it's never closed.
function stringEnd(text: string, i: number): number {
  let prefix = 0;
  while (text[i + prefix] === "$" || text[i + prefix] === "@") prefix++;
  const verbatim = text.slice(i, i + prefix).includes("@");
  let j = i + prefix;
  // A raw string: """ ... """
  if (text.startsWith('"""', j)) {
    const close = text.indexOf('"""', j + 3);
    return close === -1 ? text.length : close + 3;
  }
  j++; // past the opening quote
  while (j < text.length) {
    const ch = text[j];
    // In @"..." a quote inside is written "", and a backslash is just a
    // backslash. In a normal string a backslash escapes the next character,
    // and the string can't run past the end of the line.
    if (verbatim && ch === '"' && text[j + 1] === '"') j += 2;
    else if (!verbatim && ch === "\\") j += 2;
    else if (ch === '"') return j + 1;
    else if (!verbatim && ch === "\n") return j;
    else j++;
  }
  return text.length;
}

// Where a character literal like 'a' or '\n' starting at `i` ends.
function charEnd(text: string, i: number): number {
  let j = i + 1;
  while (j < text.length) {
    if (text[j] === "\\") j += 2;
    else if (text[j] === "'") return j + 1;
    else if (text[j] === "\n") return j;
    else j++;
  }
  return text.length;
}

function startsString(text: string, i: number): boolean {
  let j = i;
  while (j < i + 2 && (text[j] === "$" || text[j] === "@")) j++;
  return text[j] === '"';
}

// Splits code into its pieces. Spaces, line breaks and comments only separate
// pieces, like in C#.
export function tokenize(code: string): Token[] {
  const text = plainCharacters(code);
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (text.startsWith("//", i)) {
      const lineEnd = text.indexOf("\n", i);
      i = lineEnd === -1 ? text.length : lineEnd;
      continue;
    }
    if (text.startsWith("/*", i)) {
      const close = text.indexOf("*/", i + 2);
      i = close === -1 ? text.length : close + 2;
      continue;
    }

    const start = i;
    if (startsString(text, i)) {
      i = stringEnd(text, i);
    } else if (ch === "'") {
      i = charEnd(text, i);
    } else if (WORD.test(ch) || (ch === "@" && WORD.test(text[i + 1] ?? ""))) {
      // A name, keyword or number. "@if" is a name in C#.
      i++;
      while (i < text.length && WORD.test(text[i])) i++;
      if (DIGIT.test(ch)) {
        // The rest of a number: 1.5, 2.5f, 1e-5.
        if (text[i] === "." && DIGIT.test(text[i + 1] ?? "")) {
          i++;
          while (i < text.length && WORD.test(text[i])) i++;
        }
        if (/[eE]$/.test(text.slice(start, i)) && /[+-]/.test(text[i] ?? "")) {
          i++;
          while (i < text.length && WORD.test(text[i])) i++;
        }
      }
    } else {
      const symbol = SYMBOLS.find((s) => text.startsWith(s, i));
      i += symbol ? symbol.length : 1;
    }
    tokens.push({ text: text.slice(start, i), start, end: i });
  }
  return tokens;
}

// True when two pieces of code are the same C#, piece by piece.
export function sameCode(a: string, b: string): boolean {
  const x = tokenize(a);
  const y = tokenize(b);
  return x.length === y.length && x.every((t, k) => t.text === y[k].text);
}

// How the player's pieces line up with an answer's pieces.
type Step =
  | { kind: "same" | "changed" | "extra"; typed: number }
  | { kind: "missing"; before: number };

// The fewest changes that turn the typed pieces into the answer's pieces
// (edit distance), as a list of steps. When several are equally short, it
// lines pieces up as early as it can, so a missing part is marked after the
// last right piece: a missing "case 2: ... break;" is marked after the
// "break;" before it, not inside the "Call();" before that.
function alignment(typed: string[], answer: string[]): Step[] {
  const n = typed.length;
  const m = answer.length;
  // cost[i][j]: the fewest changes from typed[i..] to answer[j..].
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) =>
      i === n ? m - j : j === m ? n - i : 0,
    ),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const same = typed[i] === answer[j];
      cost[i][j] = Math.min(
        cost[i + 1][j + 1] + (same ? 0 : 1),
        cost[i + 1][j] + 1,
        cost[i][j + 1] + 1,
      );
    }
  }
  const steps: Step[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (
      i < n &&
      j < m &&
      typed[i] === answer[j] &&
      cost[i][j] === cost[i + 1][j + 1]
    ) {
      steps.push({ kind: "same", typed: i++ });
      j++;
    } else if (i < n && j < m && cost[i][j] === cost[i + 1][j + 1] + 1) {
      steps.push({ kind: "changed", typed: i++ });
      j++;
    } else if (i < n && cost[i][j] === cost[i + 1][j] + 1) {
      steps.push({ kind: "extra", typed: i++ });
    } else {
      steps.push({ kind: "missing", before: i });
      j++;
    }
  }
  return steps;
}

// Which parts of a wrong answer to point out, compared with the closest of the
// accepted answers: pieces that are wrong or shouldn't be there, and spots
// right after the piece where something is missing.
export function findMistakes(typed: string, answers: string[]): Mistake[] {
  const pieces = tokenize(typed);
  const texts = pieces.map((t) => t.text);
  let best: Step[] | undefined;
  let bestCost = Infinity;
  for (const answer of answers) {
    const steps = alignment(
      texts,
      tokenize(answer).map((t) => t.text),
    );
    const cost = steps.filter((s) => s.kind !== "same").length;
    if (cost < bestCost) {
      best = steps;
      bestCost = cost;
    }
  }

  const mistakes: Mistake[] = [];
  for (const step of best ?? []) {
    if (step.kind === "changed" || step.kind === "extra") {
      const piece = pieces[step.typed];
      mistakes.push({ start: piece.start, end: piece.end });
    } else if (step.kind === "missing") {
      const at =
        step.before > 0 ? pieces[step.before - 1].end : (pieces[0]?.start ?? 0);
      mistakes.push({ start: at, end: at });
    }
  }
  return tidy(mistakes, typed);
}

// Joins wrong parts that only have spaces between them ("Open Door" is one
// mistake), and keeps one "missing" mark per spot, in order.
function tidy(mistakes: Mistake[], typed: string): Mistake[] {
  const sorted = [...mistakes].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );
  const result: Mistake[] = [];
  for (const m of sorted) {
    const last = result[result.length - 1];
    const bothWrong = last && last.end > last.start && m.end > m.start;
    if (bothWrong && typed.slice(last.end, m.start).trim() === "") {
      last.end = m.end;
    } else if (!last || last.start !== m.start || last.end !== m.end) {
      result.push({ ...m });
    }
  }
  return result;
}
