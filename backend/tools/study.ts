// The study export: turns the game's database into CSV files the research
// group can open in Excel and quote in their manuscript.
//
//   npm run study:export                 -> the local database
//   $env:STUDY_DB_URL = "postgresql://..."; npm run study:export
//                                        -> staging or production
//
// It writes one folder per run under backend/study-export/ (git-ignored,
// because it holds student data). Nothing is ever written back: this only
// reads.
//
// What it does NOT export: email addresses and passwords. Usernames are
// included, because the group needs to match a row to a participant; if they
// want the data anonymous, delete that column before sharing it.

const DB_CONTAINER = "supabase_db_ciepher";
const OUT_ROOT = "study-export";

type Report = {
  file: string;
  title: string;
  sql: string;
};

// Every chapter's missions, and how each player did on them.
const REPORTS: Report[] = [
  {
    file: "summary.csv",
    title: "The headline numbers",
    sql: `
      select 'players registered' as measure,
             count(*)::text as value
        from public.profiles
      union all
      select 'players who played at least one mission',
             count(distinct player_id)::text
        from public.mission_progress
      union all
      select 'players who finished the prologue',
             count(*)::text
        from (
          select mp.player_id
            from public.mission_progress mp
            join public.missions m
              on m.chapter_id = mp.chapter_id and m.number = mp.mission_number
           where m.chapter_id = 0 and mp.completed_at is not null
           group by mp.player_id
          having count(*) = (select count(*) from public.missions where chapter_id = 0)
        ) done
      union all
      select 'missions completed by everyone',
             count(*)::text
        from public.mission_progress where completed_at is not null
      union all
      select 'answers sent by everyone',
             coalesce(sum(attempts), 0)::text
        from public.mission_progress
      union all
      select 'answers logged with what was typed',
             count(*)::text
        from public.mission_attempts
      union all
      select 'players who took the final exam',
             count(distinct player_id)::text
        from public.exam_attempts where finished_at is not null
      union all
      select 'final exam attempts',
             count(*)::text
        from public.exam_attempts where finished_at is not null
      union all
      select 'players who passed the final exam',
             count(distinct player_id)::text
        from public.exam_attempts where passed
      union all
      select 'exams started but never finished',
             count(*)::text
        from public.exam_attempts where finished_at is null
      union all
      select 'average final exam score',
             coalesce(round(avg(score), 2)::text, '-')
        from public.exam_attempts where finished_at is not null
    `,
  },
  {
    file: "players.csv",
    title: "One row per player",
    sql: `
      select
        p.username,
        coalesce(p.character, '') as character,
        to_char(p.created_at, 'YYYY-MM-DD HH24:MI') as registered_at,
        count(mp.*) filter (where mp.completed_at is not null) as missions_completed,
        coalesce(sum(mp.attempts), 0) as answers_sent,
        (
          select count(*)
            from (
              select m.chapter_id
                from public.missions m
                left join public.mission_progress x
                  on x.player_id = p.id
                 and x.chapter_id = m.chapter_id
                 and x.mission_number = m.number
                 and x.completed_at is not null
               group by m.chapter_id
              having count(*) = count(x.*)
            ) finished
        ) as chapters_completed,
        (
          select count(*) from public.exam_attempts e
           where e.player_id = p.id and e.finished_at is not null
        ) as exam_attempts,
        (
          select max(e.score) from public.exam_attempts e
           where e.player_id = p.id and e.finished_at is not null
        ) as best_exam_score,
        case when coalesce((
          select bool_or(e.passed) from public.exam_attempts e
           where e.player_id = p.id
        ), false) then 'yes' else 'no' end as exam_passed
      from public.profiles p
      left join public.mission_progress mp on mp.player_id = p.id
      group by p.id, p.username, p.character, p.created_at
      order by p.username
    `,
  },
  {
    file: "missions.csv",
    title: "How hard each mission was",
    sql: `
      select
        m.chapter_id as chapter,
        m.number as mission,
        count(mp.*) as players_tried,
        count(mp.*) filter (where mp.completed_at is not null) as players_finished,
        round(
          100.0 * count(mp.*) filter (where mp.completed_at is not null)
            / nullif(count(mp.*), 0), 1
        ) as finished_percent,
        round(avg(mp.attempts) filter (where mp.completed_at is not null), 2)
          as average_tries_to_finish,
        count(mp.*) filter (where mp.completed_at is not null and mp.attempts = 1)
          as finished_first_try
      from public.missions m
      left join public.mission_progress mp
        on mp.chapter_id = m.chapter_id and mp.mission_number = m.number
      group by m.chapter_id, m.number
      order by m.chapter_id, m.number
    `,
  },
  {
    file: "chapters.csv",
    title: "How far players got in each chapter",
    sql: `
      with chapter_missions as (
        select chapter_id, count(*) as missions
          from public.missions group by chapter_id
      ),
      player_chapter as (
        select mp.player_id, mp.chapter_id,
               count(*) filter (where mp.completed_at is not null) as done
          from public.mission_progress mp
         group by mp.player_id, mp.chapter_id
      )
      select
        c.chapter_id as chapter,
        c.missions,
        count(pc.*) as players_started,
        count(pc.*) filter (where pc.done = c.missions) as players_finished,
        round(
          100.0 * count(pc.*) filter (where pc.done = c.missions)
            / nullif(count(pc.*), 0), 1
        ) as finished_percent
      from chapter_missions c
      left join player_chapter pc on pc.chapter_id = c.chapter_id
      group by c.chapter_id, c.missions
      order by c.chapter_id
    `,
  },
  {
    file: "questions.csv",
    title: "How hard each question was",
    sql: `
      with first_try as (
        select distinct on (a.player_id, a.chapter_id, a.mission_number, a.question)
               a.player_id, a.chapter_id, a.mission_number, a.question, a.correct
          from public.mission_attempts a
         order by a.player_id, a.chapter_id, a.mission_number, a.question, a.id
      )
      select
        ft.chapter_id as chapter,
        ft.mission_number as mission,
        ft.question,
        count(*) as players_answered,
        count(*) filter (where ft.correct) as right_first_try,
        round(
          100.0 * count(*) filter (where ft.correct) / nullif(count(*), 0), 1
        ) as right_first_try_percent,
        (
          select round(count(*)::numeric / nullif(count(distinct x.player_id), 0), 2)
            from public.mission_attempts x
           where x.chapter_id = ft.chapter_id
             and x.mission_number = ft.mission_number
             and x.question = ft.question
        ) as average_tries
      from first_try ft
      group by ft.chapter_id, ft.mission_number, ft.question
      order by ft.chapter_id, ft.mission_number, ft.question
    `,
  },
  {
    file: "wrong-answers.csv",
    title: "What students typed when they were wrong",
    sql: `
      select
        a.chapter_id as chapter,
        a.mission_number as mission,
        a.question,
        -- Excel runs a cell that starts with = + - or @ as a formula, and
        -- this column is whatever a student typed. An apostrophe in front
        -- makes Excel treat it as text, so opening the file is safe.
        case
          when left(a.answer, 1) in ('=', '+', '-', '@')
            then chr(39) || replace(replace(a.answer, chr(13), ''), chr(10), ' / ')
          else replace(replace(a.answer, chr(13), ''), chr(10), ' / ')
        end as typed_answer,
        count(*) as times
      from public.mission_attempts a
      where not a.correct and a.answer is not null
      group by a.chapter_id, a.mission_number, a.question, a.answer
      order by count(*) desc, a.chapter_id, a.mission_number, a.question
      limit 300
    `,
  },
  {
    file: "exam-attempts.csv",
    title: "Every final exam attempt",
    sql: `
      select
        p.username,
        e.attempt_number,
        to_char(e.started_at, 'YYYY-MM-DD HH24:MI') as started_at,
        to_char(e.finished_at, 'YYYY-MM-DD HH24:MI') as finished_at,
        round(extract(epoch from (e.finished_at - e.started_at)) / 60.0, 1)
          as minutes_taken,
        e.score,
        e.total_items,
        e.pass_score,
        case when e.passed then 'yes' else 'no' end as passed
      from public.exam_attempts e
      join public.profiles p on p.id = e.player_id
      where e.finished_at is not null
      order by p.username, e.attempt_number
    `,
  },
  {
    file: "exam-items.csv",
    title: "Which exam items students got wrong",
    sql: `
      select
        x.question as item,
        count(*) as answered,
        count(*) filter (where x.correct) as answered_right,
        round(
          100.0 * count(*) filter (where x.correct) / nullif(count(*), 0), 1
        ) as right_percent
      from public.exam_answers x
      join public.exam_attempts e on e.id = x.attempt_id
      where e.finished_at is not null
      group by x.question
      order by x.question
    `,
  },
];

// Runs one query and gives back its CSV. Local uses the container the
// Supabase CLI already runs; a STUDY_DB_URL sends it to that database
// instead, through a throwaway psql container.
async function toCsv(sql: string, dbUrl: string | undefined): Promise<string> {
  const copy = `copy (${sql.trim()}) to stdout with (format csv, header)`;
  const args = dbUrl
    ? [
        "run",
        "--rm",
        "postgres:17",
        "psql",
        dbUrl,
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        copy,
      ]
    : [
        "exec",
        DB_CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        copy,
      ];

  const run = await new Deno.Command("docker", {
    args,
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!run.success) {
    throw new Error(new TextDecoder().decode(run.stderr).trim());
  }
  return new TextDecoder().decode(run.stdout);
}

function rowCount(csv: string): number {
  const lines = csv.trim().split("\n");
  return lines.length <= 1 ? 0 : lines.length - 1;
}

async function main(): Promise<void> {
  const dbUrl = Deno.env.get("STUDY_DB_URL");
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const dir = `${OUT_ROOT}/${stamp}`;
  await Deno.mkdir(dir, { recursive: true });

  console.log(
    dbUrl
      ? "Reading the database in STUDY_DB_URL."
      : "Reading the local database (npx supabase start).",
  );

  let summary = "";
  for (const report of REPORTS) {
    const csv = await toCsv(report.sql, dbUrl);
    await Deno.writeTextFile(`${dir}/${report.file}`, csv);
    console.log(
      `  ${report.file.padEnd(20)} ${rowCount(csv)} rows  ${report.title}`,
    );
    if (report.file === "summary.csv") summary = csv;
  }

  await Deno.writeTextFile(`${dir}/README.txt`, readme());

  console.log(`\nSaved in backend/${dir}\n`);
  // The headline numbers are the ones anyone asks for first, so print them.
  for (const line of summary.trim().split("\n").slice(1)) {
    const [measure, value] = line.split(",");
    console.log(
      `  ${(value ?? "").padStart(6)}  ${(measure ?? "").replaceAll('"', "")}`,
    );
  }
}

function readme(): string {
  return [
    "CIEpher study export",
    "",
    "These files come straight from the game's database. They hold student",
    "data, so keep them off shared drives and delete them when you're done.",
    "Emails and passwords are never exported.",
    "",
    "summary.csv        the headline numbers, one measure per row",
    "players.csv        one row per player: how far they got, how many",
    "                   answers they sent, their exam result",
    "missions.csv       one row per mission: how many tried it, how many",
    "                   finished, the average number of tries",
    "questions.csv      one row per question: how many got it right on their",
    "                   FIRST try, and the average number of tries. This is",
    "                   the item-difficulty table",
    "wrong-answers.csv  what students actually typed when they were wrong,",
    '                   most common first. Line breaks are shown as " / "',
    "chapters.csv       one row per chapter: how many started and finished",
    "exam-attempts.csv  one row per FINISHED exam attempt, with the score,",
    "                   the verdict and how long it took. An attempt someone",
    "                   walked away from is counted in summary.csv instead",
    "exam-items.csv     one row per exam item: how many got it right",
    "",
    "Column notes",
    "",
    "answers_sent / average_tries_to_finish count every answer up to the",
    "first correct one. Replaying a finished mission does not add to them.",
    "",
    "finished_percent is out of the players who STARTED that mission or",
    "chapter, not out of everyone registered.",
    "",
    "A player who never opened a mission has no row in mission_progress, so",
    "they appear in players.csv with zeros.",
    "",
    "exam-items.csv only counts finished attempts, so an exam someone",
    "abandoned halfway does not skew the item difficulty.",
  ].join("\n");
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(
      `\nThe export failed: ${error instanceof Error ? error.message : error}`,
    );
    console.error(
      "Is Docker running, and the local stack started (npx supabase start)?",
    );
    Deno.exit(1);
  }
}
