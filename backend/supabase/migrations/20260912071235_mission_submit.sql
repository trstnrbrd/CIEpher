-- Checking a typed answer and saving progress (autosave). The answers never
-- leave the database: the API sends what the player typed and gets back only
-- true (correct) or false (wrong).
-- Only the API (service_role) can use these functions.

-- Makes two answers comparable the way the client wants: capitals matter (like
-- real C#), extra spaces don't. So "OpenDoor ( ) ;" matches "OpenDoor();", but
-- "opendoor();" and "Open Door();" don't.
create function public.normalize_answer(p_answer text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    btrim(
      regexp_replace(
        -- Phone keyboards type curly quotes and non-breaking spaces: turn them
        -- into the plain characters C# uses.
        translate(
          p_answer,
          chr(8216) || chr(8217) || chr(8220) || chr(8221) || chr(160),
          '''''""' || ' '
        ),
        '\s+', ' ', 'g' -- any run of spaces, tabs or newlines becomes one space
      )
    ),
    ' ?([^[:alnum:]_ ]) ?', '\1', 'g' -- no spaces around symbols like ( ) ; =
  )
$$;

-- Checks one typed answer and records the try. Returns true if it's correct.
-- The first correct answer marks the mission completed; after that the row
-- never changes, so replays don't count.
create function public.submit_mission_answer(
  p_player_id uuid,
  p_chapter integer,
  p_mission integer,
  p_answer text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_correct boolean;
begin
  v_correct := exists (
    select 1
    from public.mission_answers a
    where a.chapter_id = p_chapter
      and a.mission_number = p_mission
      and public.normalize_answer(a.answer) = public.normalize_answer(p_answer)
  );

  insert into public.mission_progress as p
    (player_id, chapter_id, mission_number, attempts, completed_at)
  values
    (p_player_id, p_chapter, p_mission, 1, case when v_correct then now() end)
  on conflict (player_id, chapter_id, mission_number) do update set
    attempts = p.attempts + 1,
    completed_at = case when v_correct then now() end
  where p.completed_at is null;

  return v_correct;
end;
$$;

revoke execute on function public.normalize_answer(text)
  from public, anon, authenticated;
revoke execute on function public.submit_mission_answer(uuid, integer, integer, text)
  from public, anon, authenticated;

grant execute on function public.submit_mission_answer(uuid, integer, integer, text)
  to service_role;
