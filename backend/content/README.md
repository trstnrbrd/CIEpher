# Answer keys

One file per chapter (`chapter-0.json` is the prologue) holds that chapter's answer keys, the wrong choices from the client's doc, and the C# names the answers use. The migrations, the database test `answer_keys.test.sql` and the API tests all follow these files.

## Adding a chapter (example: chapter 2)

Work on a branch from a fresh `develop`, and run the commands from `backend/`. Keep Docker Desktop running.

1. **Read the client's doc** in `Documents/`. For each mission, write down the correct answer exactly as the client wrote it, and the wrong choice shown next to it.
2. **Create `content/chapter-2.json`**, with the same shape as `chapter-1.json`:
   - `answer`: the correct answer, exactly as written. Line breaks are written `\n`.
   - `wrong`: the other choice(s) shown to the player.
   - `question`: 1, unless the mission asks more than one question.
   - `"code": false` on a question whose answer isn't code (like choosing `if` or `while`).
   - `program`: the variables and methods the answers use, with their real types (`int score;`, `bool hasPower;`, `void Pass() {}`), so the compiler can check the answers as part of a real program.
3. **List it in `content/index.ts`** (add the import, and add it to `CHAPTERS`).
4. **`npm run answers:check`** proves every answer with the real C# compiler. Fix every `FAIL`. A `WARN` saying a wrong choice "is valid C#" means the client's wrong choice actually works in C#: ask the client before going on.
5. **`npm run answers:sql -- 2`** writes the chapter's migration and updates `answer_keys.test.sql`. Don't edit either one by hand.
6. **Check everything:**
   ```powershell
   npx supabase migration up --local
   npm run db:test
   npm test
   npm run answers:check
   ```
7. **Commit** the content file, `content/index.ts`, the migration and `answer_keys.test.sql`. Open the PR, and merge it when the checks are green.
8. **Put it on staging** after the merge:
   ```powershell
   npx supabase db push
   npx supabase test db --linked
   ```
9. **Tell Vhan** the chapter is on staging. The screens, scenes and Program Flow come from the same doc.

## Fixing an answer that's already in a migration

Never change a migration that has already run. Instead:

1. Fix the answer in the content file.
2. `npx supabase migration new fix_chapter_2_answer`, with an update such as `update public.mission_answers set answer = E'...' where chapter_id = 2 and mission_number = 3 and question = 1;`
3. `npm run answers:tests`, then the checks in step 6 above.

## Commands

| Command                    | What it does                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run answers:check`    | Proves every answer with the real C# compiler (answers compile, wrong choices don't, every spacing the game accepts compiles), and compares with the local database |
| `npm run answers:sql -- 2` | Writes chapter 2's migration from `content/chapter-2.json`, and updates `answer_keys.test.sql`                                                                      |
| `npm run answers:tests`    | Only updates `answer_keys.test.sql` from the content files                                                                                                          |

The first `answers:check` downloads the official .NET SDK image for Docker (about 1 GB, once).
