begin;
-- Act as postgres, as locally. On staging the CLI connects as a helper login
-- role that only gets postgres's rights after switching to it.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

-- A test player. Everything here is rolled back at the end.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'player_a@test.local');
insert into public.profiles (id, username, privacy_consent_at) values
  ('11111111-1111-1111-1111-111111111111', 'player_a', now());

-- How answers are compared (the client's rules).

-- 1. Extra spaces don't count.
select is(
  normalize_answer('  OpenDoor ( ) ;  '),
  'OpenDoor();',
  'extra spaces around symbols are ignored'
);

-- 2. Capitals do count, like in real C#.
select isnt(
  normalize_answer('opendoor();'),
  normalize_answer('OpenDoor();'),
  'capitals matter'
);

-- 3. A space inside a name is a real mistake, so it's kept.
select is(
  normalize_answer('Open Door();'),
  'Open Door();',
  'a space between two words is kept'
);

-- 4. Several spaces, tabs or new lines between words become one space.
select is(
  normalize_answer(E'else \t  if'),
  'else if',
  'runs of spaces between words become one space'
);

-- 5. Code typed on several lines still matches.
select is(
  normalize_answer(E'if (x)\n{\n  y();\n}'),
  normalize_answer('if(x){y();}'),
  'line breaks and indentation are ignored'
);

-- 6. Phone keyboards' curly quotes count as plain quotes.
select is(
  normalize_answer('Console.WriteLine(' || chr(8220) || 'hi' || chr(8221) || ');'),
  'Console.WriteLine("hi");',
  'curly quotes become plain quotes'
);

-- Submitting answers to prologue mission 1 (answer: OpenDoor();).

-- 7. A wrong answer returns false.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 0, 1, 'OpenDoor:'),
  false,
  'a wrong answer is not accepted'
);

-- 8. ...and counts as a try, without completing the mission.
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111' and mission_number = 1$$,
  $$values (1, false)$$,
  'a wrong answer counts as a try'
);

-- 9. The right answer, with extra spaces, returns true.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 0, 1, ' OpenDoor ( ); '),
  true,
  'the right answer is accepted, even with extra spaces'
);

-- 10. ...and completes the mission on the second try.
select results_eq(
  $$select attempts, completed_at is not null from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111' and mission_number = 1$$,
  $$values (2, true)$$,
  'the right answer completes the mission'
);

-- 11. Capitals matter when submitting too.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 0, 1, 'opendoor();'),
  false,
  'the right answer with wrong capitals is not accepted'
);

-- 12. A finished mission can be replayed: the answer is still checked...
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 0, 1, 'OpenDoor();'),
  true,
  'a finished mission can be replayed'
);

-- 13. ...but its record doesn't change.
select results_eq(
  $$select attempts from public.mission_progress
    where player_id = '11111111-1111-1111-1111-111111111111' and mission_number = 1$$,
  $$values (2)$$,
  'replays do not change a finished mission'
);

-- 14. Another mission's answer doesn't work here.
select is(
  submit_mission_answer('11111111-1111-1111-1111-111111111111', 0, 2, 'OpenDoor();'),
  false,
  'each mission checks its own answer'
);

-- 15. Players can't call the answer check directly (only the API can).
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$select public.submit_mission_answer('11111111-1111-1111-1111-111111111111', 0, 2, 'GoToTerminal();')$$,
  '42501',
  null,
  'players cannot call the answer check directly'
);
set local role postgres;

select * from finish();
rollback;
