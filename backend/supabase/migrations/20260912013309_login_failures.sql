-- Brute-force protection for login: after 5 wrong passwords within 15 minutes,
-- a username is locked for 15 minutes. Usernames that don't exist are counted
-- too, so the lock never reveals which usernames are real.
-- Only the API (service_role) can use the functions below.

create table public.login_failures (
  username_key text primary key, -- lower(username)
  failed_count integer not null,
  first_failed_at timestamptz not null,
  locked_until timestamptz
);

-- Nobody reads this table directly: only the functions below touch it.
alter table public.login_failures enable row level security;
revoke all on public.login_failures from anon, authenticated;

-- Seconds until the username unlocks (0 = not locked).
create function public.login_lock_seconds(p_username text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select greatest(0, ceil(extract(epoch from (f.locked_until - now()))))
      from public.login_failures f
      where f.username_key = lower(p_username)
    ),
    0
  )::integer
$$;

-- Records one wrong password. Returns the seconds the username is now locked
-- for (0 = not locked yet).
create function public.record_login_failure(p_username text)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_locked_until timestamptz;
begin
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

-- Forgets a username's wrong passwords after a correct one.
create function public.clear_login_failures(p_username text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.login_failures where username_key = lower(p_username)
$$;

revoke execute on function public.login_lock_seconds(text)
  from public, anon, authenticated;
revoke execute on function public.record_login_failure(text)
  from public, anon, authenticated;
revoke execute on function public.clear_login_failures(text)
  from public, anon, authenticated;

grant execute on function public.login_lock_seconds(text) to service_role;
grant execute on function public.record_login_failure(text) to service_role;
grant execute on function public.clear_login_failures(text) to service_role;
