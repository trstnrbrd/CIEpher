-- The old answer check is no longer used: the API checks answers as C#
-- (functions/api/csharp.ts) and records tries with record_mission_attempt
-- (see the answer_check_in_api migration). It was kept only so the API that
-- was running kept working until the new one was deployed.
drop function public.submit_mission_answer(uuid, integer, integer, text, integer);
drop function public.normalize_answer(text);
