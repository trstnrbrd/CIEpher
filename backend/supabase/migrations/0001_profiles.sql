-- Public profile data for every auth user.
-- The edge function creates a row here when a player signs up, and uses it to
-- resolve a username to the underlying auth email on sign-in.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text,
  gender text,
  year_level text,
  privacy_consent boolean not null check (privacy_consent),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Players can read their own profile.
create policy "select own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Players can update their own profile.
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id);