-- Missions can ask more than one question. Chapter 1's first mission asks
-- which control structure fits the situation, then for the code. Questions
-- are numbered from 1 in each mission, and the last one completes it.

-- Every answer belongs to a question. The existing ones are all question 1.
alter table public.mission_answers
  add column question smallint not null default 1 check (question >= 1);

alter table public.mission_answers drop constraint mission_answers_pkey;
alter table public.mission_answers
  add primary key (chapter_id, mission_number, question, answer);

-- The answer check now takes the question number. It comes last, with a
-- default of 1, so one-question missions (and the API until it's redeployed)
-- work as before.
drop function public.submit_mission_answer(uuid, integer, integer, text);

-- Checks one answer and records the try. Returns true if it's correct, and
-- null if the mission has no such question.
-- Every answer counts as a try until the mission is completed, whichever
-- question it's for. Only the right answer to the last question completes
-- the mission; after that the row never changes, so replays don't count.
create function public.submit_mission_answer(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer,
  p_answer text,
  p_question integer default 1
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_last_question integer;
  v_correct boolean;
  v_completes boolean;
begin
  if not exists (
    select 1
    from public.mission_answers a
    where a.chapter_id = p_chapter
      and a.mission_number = p_mission
      and a.question = p_question
  ) then
    return null;
  end if;

  select max(a.question) into v_last_question
  from public.mission_answers a
  where a.chapter_id = p_chapter
    and a.mission_number = p_mission;

  v_correct := exists (
    select 1
    from public.mission_answers a
    where a.chapter_id = p_chapter
      and a.mission_number = p_mission
      and a.question = p_question
      and public.normalize_answer(a.answer) = public.normalize_answer(p_answer)
  );
  v_completes := v_correct and p_question = v_last_question;

  insert into public.mission_progress as p
    (player_id, chapter_id, mission_number, attempts, completed_at)
  values
    (p_player_id, p_chapter, p_mission, 1, case when v_completes then now() end)
  on conflict (player_id, chapter_id, mission_number) do update set
    attempts = p.attempts + 1,
    completed_at = case when v_completes then now() end
  where p.completed_at is null;

  return v_correct;
end;
$$;

revoke execute on function public.submit_mission_answer(uuid, integer, integer, text, integer)
  from public, anon, authenticated;

grant execute on function public.submit_mission_answer(uuid, integer, integer, text, integer)
  to service_role;
