-- The game's structure and each player's progress.
-- The prologue is chapter 0, then chapters 1-7. Missions are played in order.
-- The story, dialogue and art live in the frontend; this is only what the
-- server needs to check answers and decide what's unlocked.

create table public.chapters (
  id smallint primary key check (id >= 0) -- 0 = prologue
);

create table public.missions (
  chapter_id smallint not null references public.chapters (id),
  number smallint not null check (number >= 1), -- its order in the chapter
  primary key (chapter_id, number)
);

-- The accepted answers, exactly as the client wrote them. Players never see
-- this table: the API only ever tells them "correct" or "wrong".
create table public.mission_answers (
  chapter_id smallint not null,
  mission_number smallint not null,
  answer text not null check (length(trim(answer)) > 0),
  primary key (chapter_id, mission_number, answer),
  foreign key (chapter_id, mission_number)
    references public.missions (chapter_id, number) on delete cascade
);

-- One row per player per mission they've tried.
create table public.mission_progress (
  player_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id smallint not null,
  mission_number smallint not null,
  -- Tries up to the first correct answer. Replays don't change it.
  attempts integer not null default 0 check (attempts >= 0),
  -- When the mission was first completed (null = not yet).
  completed_at timestamptz,
  primary key (player_id, chapter_id, mission_number),
  -- No "on delete cascade": a mission that players have progress in can't be
  -- deleted by accident.
  foreign key (chapter_id, mission_number)
    references public.missions (chapter_id, number)
);

-- Row-level security on all four tables.
alter table public.chapters enable row level security;
alter table public.missions enable row level security;
alter table public.mission_answers enable row level security;
alter table public.mission_progress enable row level security;

create policy "Players can read the chapters"
  on public.chapters for select
  to authenticated
  using (true);

create policy "Players can read the missions"
  on public.missions for select
  to authenticated
  using (true);

create policy "Players can read their own progress"
  on public.mission_progress for select
  to authenticated
  using ((select auth.uid()) = player_id);

-- mission_answers has no policy on purpose: no player can ever read it.

-- Who can touch these tables at all. Start from nothing, then grant only
-- what's needed. Progress is written only by the API, through its checks.
revoke all on public.chapters, public.missions, public.mission_answers,
  public.mission_progress from anon, authenticated;
grant select on public.chapters, public.missions, public.mission_progress
  to authenticated;

-- The prologue (0) and chapters 1-7. Chapters 1-7 get their missions when
-- the client sends the content.
insert into public.chapters (id) values (0), (1), (2), (3), (4), (5), (6), (7);

-- The prologue's 3 missions and their answers.
insert into public.missions (chapter_id, number) values (0, 1), (0, 2), (0, 3);

insert into public.mission_answers (chapter_id, mission_number, answer) values
  (0, 1, 'OpenDoor();'),     -- "The door is locked!"
  (0, 2, 'GoToTerminal();'), -- "Make your way to the jeep terminal."
  (0, 3, 'RideJeep();');     -- "The jeepney is ready."
