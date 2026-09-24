-- A speed limit on answers: at most 30 a minute per player, missions and the
-- exam together.
--
-- Nobody types code that fast. A script can, and without a limit it could
-- send thousands of answers: that fills mission_attempts with junk (which
-- ruins the study's data) and spends the free plan's monthly call budget.
-- The limit is per player, never per internet address: a whole school lab
-- shares one address, so that would lock out a class.
--
-- The check runs inside the functions that record an answer, before anything
-- is written, so a refused answer leaves no trace. It raises SQLSTATE PT429,
-- which the API turns into "429 TOO_MANY_ANSWERS".

-- One row per player: when their current minute started, and how many
-- answers they have sent in it.
create table public.answer_rate_limits (
  player_id uuid primary key references public.profiles (id) on delete cascade,
  window_start timestamptz not null,
  answers integer not null check (answers >= 0)
);

alter table public.answer_rate_limits enable row level security;

-- No policy and no grant: only the functions below touch it.
revoke all on public.answer_rate_limits from anon, authenticated;

-- Counts one answer for the player, and refuses it once they are over the
-- limit. Each player's row is locked while it is updated, so two answers at
-- the same moment can't both slip under the limit.
create function public.count_answer(p_player_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_answers integer;
begin
  insert into public.answer_rate_limits as r (player_id, window_start, answers)
  values (p_player_id, now(), 1)
  on conflict (player_id) do update set
    window_start = case
      when r.window_start <= now() - interval '1 minute' then now()
      else r.window_start
    end,
    answers = case
      when r.window_start <= now() - interval '1 minute' then 1
      else r.answers + 1
    end
  returning r.answers into v_answers;

  if v_answers > 30 then
    raise exception 'Too many answers: at most 30 a minute'
      using errcode = 'PT429';
  end if;
end;
$$;

revoke execute on function public.count_answer(uuid)
  from public, anon, authenticated;

-- Recording a mission answer: the same as before, with the speed limit first.
create or replace function public.record_mission_attempt(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer,
  p_question integer,
  p_correct boolean,
  p_answer text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_last_question integer;
  v_completes boolean;
begin
  perform public.count_answer(p_player_id);

  -- The API has already checked that the question exists.
  if not exists (
    select 1
    from public.mission_answers a
    where a.chapter_id = p_chapter
      and a.mission_number = p_mission
      and a.question = p_question
  ) then
    raise exception 'Mission %-% has no question %',
      p_chapter, p_mission, p_question
      using errcode = 'no_data_found';
  end if;

  -- Every answer is logged, including the ones sent while replaying a
  -- finished mission: the counter below ignores those, the study doesn't.
  insert into public.mission_attempts
    (player_id, chapter_id, mission_number, question, answer, correct)
  values
    (p_player_id, p_chapter, p_mission, p_question, p_answer, p_correct);

  select max(a.question) into v_last_question
  from public.mission_answers a
  where a.chapter_id = p_chapter
    and a.mission_number = p_mission;

  v_completes := p_correct and p_question = v_last_question;

  insert into public.mission_progress as p
    (player_id, chapter_id, mission_number, attempts, completed_at)
  values
    (p_player_id, p_chapter, p_mission, 1, case when v_completes then now() end)
  on conflict (player_id, chapter_id, mission_number) do update set
    attempts = p.attempts + 1,
    completed_at = case when v_completes then now() end
  where p.completed_at is null;
end;
$$;

-- Recording an exam answer: the same as before, with the speed limit first.
create or replace function public.record_exam_answer(
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
  perform public.count_answer(p_player_id);

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
