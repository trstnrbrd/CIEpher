# Ciepher API contract

How the game (frontend) talks to the backend. **Tristan** owns this document. Don't rely on anything that isn't written here; ask Tristan first.

- **Last updated:** 2026-09-12
- **Status legend:** 🚧 being built · ✅ ready to use

Until an endpoint is ✅, build against the example responses below (mock data).

## Basics

|                        |                                             |
| ---------------------- | ------------------------------------------- |
| API base URL (local)   | `http://127.0.0.1:54321/functions/v1/api`   |
| API base URL (staging) | Coming once login/register are ready        |
| Body format            | JSON. Send `Content-Type: application/json` |
| Logged-in requests     | Send `Authorization: Bearer <accessToken>`  |

Keep URLs and keys in `frontend/.env.local`, never in code:

```
VITE_API_URL=http://127.0.0.1:54321/functions/v1/api
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=(Tristan will send this)
```

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

- **Calling logged-in endpoints:** get the current token with `(await supabase.auth.getSession()).data.session?.access_token`.
- **Logout:** `await supabase.auth.signOut()`, then `queryClient.clear()`. Lab computers are shared, so the next player must not see the last player's data.
- Don't save tokens yourself (e.g. in `localStorage`). supabase-js already does it safely.

## Endpoints

### 🚧 `POST /auth/register`

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

### 🚧 `POST /auth/login`

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

### 🚧 `GET /me` (logged in)

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

### 🚧 `PUT /me/character` (logged in)

Request: `{ "character": "boy" }` (either `"boy"` or `"girl"`)
Success, **200**: `{ "profile": { ... } }`, the updated profile.

## Not in the API (use supabase-js directly)

- Logout and keeping the session fresh: see "Sessions".
- Password reset: later, once the client confirms they want it.
