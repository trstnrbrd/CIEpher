# CIEpher: rules for AI coding agents

These rules are for **frontend work** (Vhan and his AI agent, e.g. OpenCode). The backend developer (Tristan) has his own instructions. `opencode.json` enforces the most important ones: OpenCode can't edit the protected folders or push to `develop`/`main`.

CIEpher is a pixel-art web game (React + TypeScript + Vite) that teaches C# control structures. The backend (Hono API on Supabase) checks answers and saves progress.

## What you may change

- **Only files in `frontend/`**: screens, styles, assets, and game data such as `src/lessons.ts` and `src/storyPages.ts`.
- **Never change** `backend/`, `frontend/src/api/` (the API client: it's the contract with the backend), `.github/`, `backups/`, `Documents/`, `AGENTS.md` or `opencode.json`.
- If the game needs something from the backend (a new endpoint, a different response), stop and ask Tristan. Don't work around it in the frontend.

## Git: the only safe way

1. **Start every task from a fresh `develop`:**
   ```sh
   git switch develop
   git pull
   git switch -c feat/fe-<short-name>
   ```
2. **Commit only to that branch, and push it by name:** `git push -u origin feat/fe-<short-name>`. A plain `git push`, pushes to `develop` or `main`, force pushes, deletes, and branch names that don't start with `feat/fe-` or `fix/fe-` are blocked.
3. **Never commit to `develop` or `main`, and never merge or rebase.** Tristan opens the pull request, reviews it and merges it.
4. **Once Tristan merges your branch, it's finished. Never commit to it again.** Start the next task at step 1. Merges are squashed, so an old branch no longer matches `develop`: new work on it conflicts and can undo other people's changes.
5. Work in the `CIEpher` folder (the one with this file), not the folder around it.

## Before you push

From `frontend/`, all three must pass (the CI runs them on every pull request):

```sh
npx tsc --noEmit
npm run lint
npm run build
```

## How the game talks to the server

- **Only through the functions in `frontend/src/api/client.ts`** (`getProgress`, `submitAnswer`, `getMe`, ...). Never read or write the database directly.
- **The server decides** whether an answer is right and what's unlocked. **Never put correct answers in the frontend:** no `code` answer fields, no marking which choice is correct, and show the choices in the order of the client's doc (the correct one isn't always first).
- **Send the answer exactly as typed** (don't trim it). The TYPE HERE box is a `<textarea>` with `autoCapitalize="off" autoCorrect="off" spellCheck={false}`, because answers take several lines.
- **Missions with two questions:** pass the question number, `submitAnswer(chapter, mission, answer, question)`.
- **Wrong answers come back with `mistakes`**, positions in the typed text. `start < end`: color those characters red. `start === end`: something is missing right there, so show a red marker. Don't compare answers in the frontend.
- The full API is in `Documents/api-contract.md` (read it; don't edit it).

## Secrets

- Never commit `.env` files, keys or passwords. `frontend/.env.local` holds only the public staging values.
- Never use, or ask for, the secret (service role) key.

## Style

- Follow `frontend/.prettierrc` (single quotes, no semicolons) and match the code around your change.
- Keep changes small and focused on the task.
