import { createClient } from "@supabase/supabase-js";
import {
  asPlayer,
  type Player,
  serverOptions,
  type SupabaseConfig,
} from "./accounts.ts";
import { findMistakes, type Mistake, sameCode } from "./csharp.ts";
import { isExam } from "./exam.ts";
import { answerLimitError, ApiError } from "./errors.ts";
import { buildProgress, findMission, type Progress } from "./progress.ts";
import type { SubmitInput } from "./schemas.ts";

// A wrong answer also says where it's wrong (see csharp.ts), so the game can
// mark that part red. The right answer itself is never sent.
export type SubmitResult =
  { correct: true } | { correct: false; mistakes: Mistake[] };

// Everything the routes need for the game itself. Like Accounts, routes
// depend on this type, not on Supabase directly, so tests can pass a fake.
export type Game = {
  getProgress(player: Player): Promise<Progress>;
  // Checks a typed answer. A correct one saves the player's progress.
  submitAnswer(player: Player, input: SubmitInput): Promise<SubmitResult>;
};

export function supabaseGame(config: SupabaseConfig): Game {
  // Full access that skips RLS, only for reading answers and recording tries:
  // players can never read the answers. Never leaves the server.
  const admin = createClient(config.url, config.serviceRoleKey, serverOptions);

  return {
    getProgress: (player) => loadProgress(config, player),

    async submitAnswer(player, { chapter, mission, question, answer }) {
      // The same unlock rules as GET /progress decide what can be answered.
      const progress = await loadProgress(config, player);
      const status = findMission(progress, chapter, mission);
      if (!status) {
        throw new ApiError(
          404,
          "MISSION_NOT_FOUND",
          "That mission doesn't exist.",
        );
      }
      if (!status.unlocked) {
        throw new ApiError(
          403,
          "MISSION_LOCKED",
          "That mission is still locked.",
        );
      }

      // The final exam tells the player nothing until it is finished, so it
      // has its own routes (exam.ts). Answering it here would give away
      // every item as the player goes.
      if (isExam(chapter, mission)) {
        throw new ApiError(
          400,
          "USE_EXAM_ROUTES",
          "The final exam is answered through the exam routes.",
        );
      }

      // The question's accepted answers. None means there's no such question.
      const { data: rows, error: readError } = await admin
        .from("mission_answers")
        .select("answer")
        .eq("chapter_id", chapter)
        .eq("mission_number", mission)
        .eq("question", question);
      if (readError) throw readError;
      const answers = rows.map((row) => row.answer as string);
      if (answers.length === 0) {
        throw new ApiError(
          404,
          "QUESTION_NOT_FOUND",
          "That question doesn't exist.",
        );
      }

      // Compared as C#: capitals matter, extra spaces don't (see csharp.ts).
      const correct = answers.some((accepted) => sameCode(answer, accepted));

      // The database records the try, and completes the mission when this
      // is the right answer to its last question (autosave). The typed answer
      // goes with it, so the study can see which question students get wrong
      // and what they type instead (mission_attempts).
      const { error: recordError } = await admin.rpc("record_mission_attempt", {
        p_player_id: player.id,
        p_chapter: chapter,
        p_mission: mission,
        p_question: question,
        p_correct: correct,
        p_answer: answer,
      });
      if (recordError) throw answerLimitError(recordError) ?? recordError;

      return correct
        ? { correct: true }
        : { correct: false, mistakes: findMistakes(answer, answers) };
    },
  };
}

// Runs as the player: RLS lets them read every chapter and mission, but only
// their own progress.
async function loadProgress(
  config: SupabaseConfig,
  player: Player,
): Promise<Progress> {
  const db = asPlayer(config, player);
  const [chapters, missions, completed] = await Promise.all([
    db.from("chapters").select("id"),
    db.from("missions").select("chapter_id, number"),
    db
      .from("mission_progress")
      .select("chapter_id, mission_number")
      .eq("player_id", player.id)
      .not("completed_at", "is", null),
  ]);
  if (chapters.error) throw chapters.error;
  if (missions.error) throw missions.error;
  if (completed.error) throw completed.error;

  return buildProgress(
    chapters.data.map((c) => c.id),
    missions.data.map((m) => ({ chapter: m.chapter_id, mission: m.number })),
    completed.data.map((p) => ({
      chapter: p.chapter_id,
      mission: p.mission_number,
    })),
  );
}
