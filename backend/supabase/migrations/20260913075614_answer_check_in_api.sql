-- Answers are now checked by the API, which reads C# the way the compiler
-- does (functions/api/csharp.ts): "> =" is not taken for ">=", and text in
-- quotes must match exactly. It also finds which part of a wrong answer is
-- wrong. The database keeps the answers and records every try.

-- The API reads a question's accepted answers to check them. Players still
-- can't: they have no grant, and RLS has no policy for them.
grant select on public.mission_answers to service_role;

-- Records one answer the API has checked. Every answer counts as a try until
-- the mission is completed, whichever question it's for. The right answer to
-- the mission's last question completes it; after that the row never
-- changes, so replays don't count.
create function public.record_mission_attempt(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer,
  p_question integer,
  p_correct boolean
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

revoke execute on function public.record_mission_attempt(uuid, integer, integer, integer, boolean)
  from public, anon, authenticated;

grant execute on function public.record_mission_attempt(uuid, integer, integer, integer, boolean)
  to service_role;

-- The old answer check (submit_mission_answer and normalize_answer) stays
-- until the new API is deployed, so the API that's running keeps working in
-- between. The next migration drops them.
