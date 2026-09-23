-- The epilogue's final practical exam (chapter 8).
--
-- It doesn't work like a normal mission. The player answers all the items in
-- one sitting and is told NOTHING until the end: no "correct", no red marks,
-- no retry per item. Only when the attempt is finished do they get a score,
-- and a pass or a fail. A fail can be retaken, and every attempt is kept,
-- because the client's study wants them.
--
-- So the answer itself is still checked by the API (functions/api/csharp.ts)
-- and the accepted answers still live in mission_answers, but what the player
-- is told is decided here: record_exam_answer saves the result silently, and
-- only finish_exam_attempt reveals the score.

-- One row per attempt at the exam.
create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id smallint not null,
  mission_number smallint not null,
  -- 1 for the first try, 2 for the first retake, and so on.
  attempt_number integer not null check (attempt_number >= 1),
  started_at timestamptz not null default now(),
  -- null while the attempt is still running.
  finished_at timestamptz,
  -- Copied when the attempt starts, so an old attempt keeps the rule it was
  -- scored by even if the exam changes later.
  total_items smallint not null check (total_items > 0),
  pass_score smallint not null check (pass_score >= 0),
  score smallint check (score >= 0),
  passed boolean,
  unique (player_id, chapter_id, mission_number, attempt_number),
  foreign key (chapter_id, mission_number)
    references public.missions (chapter_id, number),
  -- A finished attempt has a score and a verdict; a running one has neither.
  constraint exam_attempts_finished_has_score
    check ((finished_at is null) = (score is null)),
  constraint exam_attempts_finished_has_verdict
    check ((finished_at is null) = (passed is null)),
  constraint exam_attempts_score_fits
    check (score is null or score <= total_items)
);

-- A player can only have one attempt running at a time.
create unique index exam_attempts_one_running
  on public.exam_attempts (player_id, chapter_id, mission_number)
  where finished_at is null;

create index exam_attempts_by_player
  on public.exam_attempts (player_id, chapter_id, mission_number);

-- What the player answered for each item of an attempt. "correct" is stored
-- the moment it's checked, but the player is not told until the end, so this
-- table is never readable by players.
create table public.exam_answers (
  attempt_id uuid not null references public.exam_attempts (id) on delete cascade,
  question smallint not null check (question >= 1),
  -- Exactly as typed, spaces included (same rule as a normal answer).
  answer text not null,
  correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question)
);

alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;

-- A player may see their own attempts. While an attempt is running its score
-- and verdict are null, so this tells them nothing they shouldn't know yet.
create policy "Players can read their own exam attempts"
  on public.exam_attempts for select
  to authenticated
  using ((select auth.uid()) = player_id);

-- exam_answers has no policy on purpose: it says which items were right, so
-- no player can ever read it. Only the API, through the functions below.

revoke all on public.exam_attempts, public.exam_answers from anon, authenticated;
grant select on public.exam_attempts to authenticated;
grant select on public.exam_attempts, public.exam_answers to service_role;

-- Starts the exam, or hands back the attempt already running (so a refresh
-- in the middle doesn't lose the answers). The pass mark is 70% of the items,
-- rounded up: 7 out of 10 in the client's epilogue.
create function public.start_exam_attempt(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer
)
returns table (
  attempt_id uuid,
  attempt_number integer,
  total_items integer,
  pass_score integer,
  answered integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_total integer;
  v_pass integer;
  v_id uuid;
  v_number integer;
begin
  select count(distinct a.question) into v_total
  from public.mission_answers a
  where a.chapter_id = p_chapter
    and a.mission_number = p_mission;

  if v_total = 0 then
    raise exception 'Mission %-% has no questions', p_chapter, p_mission
      using errcode = 'no_data_found';
  end if;

  v_pass := ceil(v_total * 0.7);

  select e.id, e.attempt_number into v_id, v_number
  from public.exam_attempts e
  where e.player_id = p_player_id
    and e.chapter_id = p_chapter
    and e.mission_number = p_mission
    and e.finished_at is null;

  if v_id is null then
    select coalesce(max(e.attempt_number), 0) + 1 into v_number
    from public.exam_attempts e
    where e.player_id = p_player_id
      and e.chapter_id = p_chapter
      and e.mission_number = p_mission;

    insert into public.exam_attempts
      (player_id, chapter_id, mission_number, attempt_number, total_items, pass_score)
    values
      (p_player_id, p_chapter, p_mission, v_number, v_total, v_pass)
    returning id into v_id;
  end if;

  return query
  select
    v_id,
    v_number,
    v_total,
    v_pass,
    (select count(*)::integer from public.exam_answers x where x.attempt_id = v_id);
end;
$$;

-- Saves one answer of a running attempt. It returns only how many items have
-- been answered: whether this one was right is kept back until the end.
create function public.record_exam_answer(
  p_player_id uuid,
  p_attempt uuid,
  p_question integer,
  p_answer text,
  p_correct boolean
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  select e.total_items into v_total
  from public.exam_attempts e
  where e.id = p_attempt
    and e.player_id = p_player_id
    and e.finished_at is null;

  if v_total is null then
    raise exception 'No exam attempt % is running for this player', p_attempt
      using errcode = 'no_data_found';
  end if;

  if p_question < 1 or p_question > v_total then
    raise exception 'This exam has no item %', p_question
      using errcode = 'no_data_found';
  end if;

  insert into public.exam_answers (attempt_id, question, answer, correct)
  values (p_attempt, p_question, p_answer, p_correct)
  on conflict (attempt_id, question) do update set
    answer = excluded.answer,
    correct = excluded.correct,
    answered_at = now();

  return (select count(*)::integer
          from public.exam_answers x
          where x.attempt_id = p_attempt);
end;
$$;

-- Ends the attempt and scores it. Passing completes the chapter's mission,
-- which is what unlocks the graduation ending. Failing leaves the mission
-- unfinished, so the player can retake it.
create function public.finish_exam_attempt(
  p_player_id uuid,
  p_attempt uuid
)
returns table (
  attempt_number integer,
  score integer,
  total_items integer,
  pass_score integer,
  passed boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_attempt public.exam_attempts;
  v_score integer;
  v_passed boolean;
begin
  select * into v_attempt
  from public.exam_attempts e
  where e.id = p_attempt
    and e.player_id = p_player_id
    and e.finished_at is null;

  if v_attempt.id is null then
    raise exception 'No exam attempt % is running for this player', p_attempt
      using errcode = 'no_data_found';
  end if;

  select count(*)::integer into v_score
  from public.exam_answers x
  where x.attempt_id = p_attempt
    and x.correct;

  v_passed := v_score >= v_attempt.pass_score;

  update public.exam_attempts e
  set finished_at = now(),
      score = v_score,
      passed = v_passed
  where e.id = p_attempt;

  -- One finished exam counts as one try of the mission; passing completes it.
  insert into public.mission_progress as p
    (player_id, chapter_id, mission_number, attempts, completed_at)
  values
    (p_player_id, v_attempt.chapter_id, v_attempt.mission_number, 1,
     case when v_passed then now() end)
  on conflict (player_id, chapter_id, mission_number) do update set
    attempts = p.attempts + 1,
    completed_at = case when v_passed then now() end
  where p.completed_at is null;

  return query
  select v_attempt.attempt_number, v_score, v_attempt.total_items::integer,
         v_attempt.pass_score::integer, v_passed;
end;
$$;

-- What the game needs to show on the exam screen: how many tries so far, the
-- last and best score, whether it was passed, and whether one is running.
create function public.exam_state(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer
)
returns table (
  attempts integer,
  last_score integer,
  best_score integer,
  passed boolean,
  running boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where e.finished_at is not null)::integer,
    (select f.score::integer
     from public.exam_attempts f
     where f.player_id = p_player_id
       and f.chapter_id = p_chapter
       and f.mission_number = p_mission
       and f.finished_at is not null
     order by f.attempt_number desc
     limit 1),
    max(e.score)::integer,
    coalesce(bool_or(e.passed), false),
    bool_or(e.finished_at is null)
  from public.exam_attempts e
  where e.player_id = p_player_id
    and e.chapter_id = p_chapter
    and e.mission_number = p_mission;
$$;

-- Only the API may run these: they decide scores and completion.
revoke execute on function public.start_exam_attempt(uuid, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.record_exam_answer(uuid, uuid, integer, text, boolean)
  from public, anon, authenticated;
revoke execute on function public.finish_exam_attempt(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.exam_state(uuid, integer, integer)
  from public, anon, authenticated;

grant execute on function public.start_exam_attempt(uuid, integer, integer)
  to service_role;
grant execute on function public.record_exam_answer(uuid, uuid, integer, text, boolean)
  to service_role;
grant execute on function public.finish_exam_attempt(uuid, uuid)
  to service_role;
grant execute on function public.exam_state(uuid, integer, integer)
  to service_role;
