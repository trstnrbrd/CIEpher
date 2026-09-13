-- Old failed-login rows are now deleted, so the table can't grow forever.
-- Usernames that don't exist are counted too (so the lock never reveals which
-- usernames are real), which means anyone can add rows here.
--
-- A row whose first failure is more than a day old does nothing anymore: its
-- 15-minute window and any lock ended long ago, so deleting it changes nothing
-- for the player. Each new failure deletes those first. A day is kept so a
-- burst of failed logins can still be looked into.

-- Keeps that delete fast, however many rows there are.
create index login_failures_first_failed_at_idx
  on public.login_failures (first_failed_at);

-- The same as before, plus the delete at the start. "create or replace" keeps
-- the function's permissions (only service_role can run it).
create or replace function public.record_login_failure(p_username text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_locked_until timestamptz;
begin
  -- Rows that do nothing anymore. The lock check is there in case the lock
  -- rules ever change to lock for longer than a day.
  delete from public.login_failures
  where first_failed_at < now() - interval '1 day'
    and (locked_until is null or locked_until < now());

  insert into public.login_failures as f
    (username_key, failed_count, first_failed_at)
  values (lower(p_username), 1, now())
  on conflict (username_key) do update set
    -- The last 15-minute window is over: start counting again.
    failed_count = case
      when f.first_failed_at < now() - interval '15 minutes' then 1
      else f.failed_count + 1
    end,
    first_failed_at = case
      when f.first_failed_at < now() - interval '15 minutes' then now()
      else f.first_failed_at
    end,
    -- The 5th wrong password inside the window locks it for 15 minutes.
    locked_until = case
      when f.first_failed_at >= now() - interval '15 minutes'
        and f.failed_count + 1 >= 5
      then now() + interval '15 minutes'
      else f.locked_until
    end
  returning f.locked_until into v_locked_until;

  return coalesce(
    greatest(0, ceil(extract(epoch from (v_locked_until - now())))),
    0
  )::integer;
end;
$$;
