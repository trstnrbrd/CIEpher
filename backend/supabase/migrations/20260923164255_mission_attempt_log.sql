-- Every answer a player sends to a mission, one row each.
--
-- Until now a mission only kept a counter ("3 tries") and the moment it was
-- completed. That can't answer the questions the client's study asks: which
-- question do students get wrong, what do they type instead, and how long
-- does a mission take. None of it can be worked out later, because the
-- answers were never kept. The exam already records this (exam_answers);
-- this does the same for the missions.
--
-- Players can never read it: it says which answers were right.

create table public.mission_attempts (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id smallint not null,
  mission_number smallint not null,
  question smallint not null check (question >= 1),
  -- Exactly as typed, spaces included. Null for rows written before this
  -- table existed, and by anything that doesn't pass the answer on.
  answer text,
  correct boolean not null,
  answered_at timestamptz not null default now(),
  foreign key (chapter_id, mission_number)
    references public.missions (chapter_id, number)
);

-- The study reads this by mission and by player.
create index mission_attempts_by_mission
  on public.mission_attempts (chapter_id, mission_number, question);
create index mission_attempts_by_player
  on public.mission_attempts (player_id, answered_at);

alter table public.mission_attempts enable row level security;

-- No policy on purpose: like mission_answers and exam_answers, this says
-- which answers were right, so no player may read it.

revoke all on public.mission_attempts from anon, authenticated;
grant select on public.mission_attempts to service_role;

-- Recording a try now also writes the log. The old five-argument version
-- stays as a thin wrapper, so the API that is still running during a deploy
-- keeps working; it simply logs no answer text.
create function public.record_mission_attempt(
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

-- The old signature, kept only so a deploy can't fail halfway. Once the new
-- API is live everywhere, nothing calls it.
create or replace function public.record_mission_attempt(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer,
  p_question integer,
  p_correct boolean
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select public.record_mission_attempt(
    p_player_id, p_chapter, p_mission, p_question, p_correct, null
  );
$$;

revoke execute on function public.record_mission_attempt(uuid, integer, integer, integer, boolean, text)
  from public, anon, authenticated;

grant execute on function public.record_mission_attempt(uuid, integer, integer, integer, boolean, text)
  to service_role;
