-- The avatar a player picks after their first sign-in. Null until they choose.
alter table public.profiles
  add column character text check (character in ('boy', 'girl'));