-- Player profiles: one row per player, linked to their Supabase Auth account.
-- Email and password live in Supabase Auth (auth.users), never in this table.
-- gender and year_level are not here yet: waiting on the client (open question 6).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  character text check (character in ('boy', 'girl')),
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- Usernames are unique regardless of capitalization: "Vhan" and "vhan" can't both exist.
create unique index profiles_username_unique on public.profiles (lower(username));

-- Row-level security: with RLS on, a player only gets the rows a policy allows.
alter table public.profiles enable row level security;

create policy "Players can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Players can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Who can touch this table at all. Start from nothing, then grant only what's needed.
revoke all on public.profiles from anon, authenticated;
-- Players: read their row, and change only their character.
grant select on public.profiles to authenticated;
grant update (character) on public.profiles to authenticated;
-- The API's server-side key creates profiles at registration.
grant select, insert, update, delete on public.profiles to service_role;
