# CIEpher API contract

How the game (frontend) talks to the backend. **Tristan** owns this document. Don't rely on anything that isn't written here; ask Tristan first.

- **Last updated:** 2026-09-12
- **Status legend:** 🚧 being built · ✅ ready to use

Until an endpoint is ✅, build against the example responses below (mock data).

## Basics

|                        |                                                             |
| ---------------------- | ----------------------------------------------------------- |
| API base URL (local)   | `http://127.0.0.1:54321/functions/v1/api`                   |
| API base URL (staging) | `https://ljdxoyttpyrvbibazxyv.supabase.co/functions/v1/api` |
| Body format            | JSON. Send `Content-Type: application/json`                 |
| Logged-in requests     | Send `Authorization: Bearer <accessToken>`                  |

Keep URLs and keys in `frontend/.env.local`, never in code.

Local (needs Docker and the backend running):

```
VITE_API_URL=http://127.0.0.1:54321/functions/v1/api
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=(Tristan will send this)
```

Staging (online, no Docker needed; test accounts only, never real student data):

```
VITE_API_URL=https://ljdxoyttpyrvbibazxyv.supabase.co/functions/v1/api
VITE_SUPABASE_URL=https://ljdxoyttpyrvbibazxyv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=(Tristan will send this)
```

Tip: put the staging values in `frontend/.env.staging.local` instead, and run `npm run dev -- --mode staging` to use staging. Plain `npm run dev` keeps using `.env.local`.

### Errors

Every error has the same shape:

```json
{
  "error": {
    "code": "USERNAME_TAKEN",
    "message": "That username is already taken."
  }
}
```

- `code` is for your logic (which field to highlight, where to redirect). Codes never change.
- `message` is always safe to show the player as-is.
- Validation errors also say which field: `{ "error": { "code": "VALIDATION_ERROR", "field": "username", "message": "..." } }`

Any endpoint can return:

| Status | code               | What to do                                         |
| ------ | ------------------ | -------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | Show `message` next to the input named in `field`  |
| 401    | `UNAUTHORIZED`     | Token missing or expired: send the player to login |
| 404    | `NOT_FOUND`        | Wrong URL (a bug in the frontend call)             |
| 500    | `INTERNAL_ERROR`   | Show `message` and let them retry                  |

## Sessions (how "logged in" works)

Login returns a `session`:

```json
{ "accessToken": "eyJ...", "refreshToken": "abc..." }
```

Give it to supabase-js right away. It keeps the player logged in and refreshes the token automatically:

```ts
await supabase.auth.setSession({
  access_token: session.accessToken,
  refresh_token: session.refreshToken,
});
```

- **Calling logged-in endpoints:** use `getMe()`, `setCharacter()`, `getProgress()` and `submitAnswer()` from `src/api/client.ts`. They add the current token for you.
- **Logout:** call `logout()` from `src/api/client.ts`, then clear any player data kept in React state. Lab computers are shared, so the next player must not see the last player's data.
- Don't save tokens yourself (e.g. in `localStorage`). supabase-js already does it safely.

## Endpoints

### ✅ `POST /auth/register`

Creates the account and the player's profile. It does **not** log the player in: send them back to Login to sign in (the client's flow).

Request:

```json
{
  "username": "player_one",
  "email": "player@example.com",
  "password": "secret123",
  "privacyConsent": true
}
```

| Field            | Rule                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `username`       | 3–20 letters, numbers, or `_`. Unique ignoring capitals (`Vhan` and `vhan` are the same).            |
| `email`          | A valid email address.                                                                               |
| `password`       | 8–72 characters, with at least one letter and one number.                                            |
| `privacyConsent` | Must be `true`: the player ticked "I agree to the privacy notice". Required by the Data Privacy Act. |

`gender` and `yearLevel` are **not stored yet** (waiting on the client). Don't send them for now.

Success, **201**:

```json
{
  "session": null,
  "profile": {
    "id": "3f0c9d2e-...",
    "username": "player_one",
    "character": null
  }
}
```

`session` is always `null` for register.

Errors: `400 VALIDATION_ERROR`, `409 USERNAME_TAKEN`, `409 EMAIL_TAKEN`.

### ✅ `POST /auth/login`

Request (the username isn't case-sensitive):

```json
{ "username": "player_one", "password": "secret123" }
```

Success, **200**: `session` + `profile`, the same shape as register, but here `session` is always filled in.

| Status | code                  | Show the player                                                                                 |
| ------ | --------------------- | ----------------------------------------------------------------------------------------------- |
| 401    | `INVALID_CREDENTIALS` | "Wrong username or password." (the same message whether or not the username exists, on purpose) |
| 429    | `TOO_MANY_ATTEMPTS`   | Show `message`, e.g. "Too many failed attempts. Try again in 15 minutes."                       |

After 5 wrong passwords within 15 minutes, that username is locked for 15 minutes. While it's locked, even the right password gets 429. The message says how many minutes are left.

### ✅ `POST /auth/forgot-password`

"Forgot password?" on the login card. In the frontend: `await requestPasswordReset(username)` (the `ForgotPasswordCard` screen already does it).

Request (the same username the player logs in with):

```json
{ "username": "player_one" }
```

Success, **200**: `{ "ok": true }`. It's **always the same answer**, whether or not the username exists, so this can't be used to find out who has an account. If it does exist, Supabase emails a reset link to the account's address.

Errors: `400 VALIDATION_ERROR` (`field` is `username`).

- At most one email a minute per player, so nobody can flood an inbox.
- **The link** opens the game with a one-time session. `src/api/supabase.ts` reads it (`resetLink`), and `App.tsx` shows the **New Password** screen instead of logging in.
- **Saving:** `await setNewPassword(password)`. It saves the password (8-72 characters, a letter and a number), then logs the player out, so they sign in with the new one. A `401` means the link has expired or was already used: ask for a new one.
- A link works **once** and expires after 1 hour.
- If the username was locked by wrong passwords, the lock still runs out after its 15 minutes.

### ✅ `GET /me` (logged in)

The logged-in player's profile. In the frontend: `const profile = await getMe()`.

Success, **200**:

```json
{
  "profile": {
    "id": "3f0c9d2e-...",
    "username": "player_one",
    "character": "girl"
  }
}
```

`character` is `null` until the player picks one on Character Select.

- Right after login you don't need this: `login()` already returns the same profile.
- Use it when the page reloads while the player is still logged in (supabase-js restores the session, but not the profile).

Errors: `401 UNAUTHORIZED` (not logged in, logged out, or the session ended): send the player to Login.

### ✅ `PUT /me/character` (logged in)

Saves the character picked on Character Select. In the frontend: `const profile = await setCharacter('girl')`.

Request: `{ "character": "boy" }` (exactly `"boy"` or `"girl"`, lowercase)

Success, **200**: `{ "profile": { ... } }`, the updated profile.

| Status | code               | What to do                                                |
| ------ | ------------------ | --------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `field` is `character`: a bug in the call, not the player |
| 401    | `UNAUTHORIZED`     | Send the player to Login                                  |

The player can only change their **own** character. The server takes who they are from the token, never from the request.

### ✅ `GET /progress` (logged in)

Where the player is in the game. In the frontend: `const progress = await getProgress()`.

Success, **200** (this player has finished prologue mission 1):

```json
{
  "chapters": [
    {
      "id": 0,
      "unlocked": true,
      "completed": false,
      "missions": [
        { "number": 1, "unlocked": true, "completed": true },
        { "number": 2, "unlocked": true, "completed": false },
        { "number": 3, "unlocked": false, "completed": false }
      ]
    },
    { "id": 1, "unlocked": false, "completed": false, "missions": [] }
  ]
}
```

The real response lists chapters 0 to 8 (8 is the epilogue); chapters 2 to 8 look like chapter 1 here.

- Chapter `0` is the prologue. Missions are numbered from 1, in play order.
- Chapters 1 to 8 have `"missions": []` until the client sends their content.
- **The server decides what's unlocked.** Never work it out in the frontend:
  - The prologue is always unlocked.
  - Inside a chapter, missions unlock one at a time, in order.
  - A chapter unlocks when the whole chapter before it is `completed`.

How the game uses it:

| Screen             | Use                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| After login        | No mission `completed` yet: show the intro screens, then the prologue. Prologue not done: resume at its first `unlocked` mission that isn't `completed`. Prologue done: Chapter Select. |
| Progress checklist | Each chapter's `missions[].completed`                                                                                                                                                   |
| Chapter Select     | `unlocked` chapters can be played; the others show a lock                                                                                                                               |
| Inside a chapter   | Start at the first `unlocked` mission that isn't `completed` (or mission 1 to replay a finished chapter)                                                                                |
| Code Journal       | Lesson N is unlocked when chapter N is `completed`                                                                                                                                      |

Ask again after each correct answer and when opening Chapter Select, so the screen always matches the server.

Errors: `401 UNAUTHORIZED`: send the player to Login.

### ✅ `POST /missions/submit` (logged in)

Checks the answer typed into a mission's TYPE HERE box when the player presses Execute. In the frontend: `const { correct } = await submitAnswer(0, 1, typed)`.

Request:

```json
{ "chapter": 0, "mission": 1, "answer": "OpenDoor();" }
```

Success, **200**, either `{ "correct": true }` or `{ "correct": false }`. A wrong answer is **not** an error.

How answers are compared (the client's rules):

- **Capitals matter**, like real C#: `opendoor();` is wrong.
- **Extra spaces don't matter**: `OpenDoor ( ) ;` counts as `OpenDoor();`. But a space inside a name is a mistake: `Open Door();` is wrong.
- Curly quotes from phone keyboards count as plain quotes.
- The game never knows the right answer. It shows the two hint choices from its own mission data, and only the server decides.

What to do with the result:

- `correct: true`: **the progress is already saved** (autosave). Show the Program Flow popup, then "progress saved". Call `getProgress()` to see what's unlocked now. After a chapter's last mission, show "chapter complete".
- `correct: false`: turn the typed answer (or the hint it matches) red and let the player try again. There's no limit on tries.
- Replaying a finished mission works the same way, but doesn't change the saved progress.

**The TYPE HERE input must have** `autoCapitalize="off" autoCorrect="off" spellCheck={false}`. Otherwise phones turn `if` into `If`, and a right answer is marked wrong.

| Status | code                | What to do                                                                                          |
| ------ | ------------------- | --------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`  | `field` is `answer` ("Type your answer first."): show it. `chapter` or `mission`: a bug in the call |
| 401    | `UNAUTHORIZED`      | Send the player to Login                                                                            |
| 403    | `MISSION_LOCKED`    | The screen opened a mission that isn't unlocked yet: refresh with `getProgress()`                   |
| 404    | `MISSION_NOT_FOUND` | Wrong chapter or mission number: a bug in the mission data                                          |

## Not in the API (use supabase-js directly)

- Logout and keeping the session fresh: see "Sessions".
- Saving the new password after a reset link: `setNewPassword()` talks to Supabase Auth directly. Asking for the link goes through the API (`POST /auth/forgot-password`).
