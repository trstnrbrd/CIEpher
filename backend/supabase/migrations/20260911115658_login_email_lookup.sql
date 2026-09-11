-- Username login: finds the email that belongs to a username (ignoring capitals).
-- Only the API (service_role) may call this. If visitors or players could call
-- it, anyone could look up other players' emails.
create function public.login_email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
$$;

revoke execute on function public.login_email_for_username(text)
  from public, anon, authenticated;
grant execute on function public.login_email_for_username(text)
  to service_role;
