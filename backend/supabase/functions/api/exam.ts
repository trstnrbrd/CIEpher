// The epilogue's final practical exam (chapter 8, mission 1).
//
// It is deliberately not like a mission. The player answers all ten items
// with NO feedback: no "correct", no red marks, no retry. The answer is
// checked and stored the moment it arrives, but the player is told nothing
// until they finish, and only then do they get a score and a verdict. A fail
// can be retaken, and every attempt is kept for the client's study.
//
// The rules live in the database (the exam_attempts migration); this file
// only checks the answer and passes it on, so the browser never learns
// anything it shouldn't.
import { createClient } from "@supabase/supabase-js";
import { type Player, serverOptions, type SupabaseConfig } from "./accounts.ts";
import { sameCode } from "./csharp.ts";
import { answerLimitError, ApiError } from "./errors.ts";
import { findMission, type Progress } from "./progress.ts";
import type { ExamAnswerInput } from "./schemas.ts";

// Which mission is the exam. One place, so nothing else has to guess.
export const EXAM = { chapter: 8, mission: 1 } as const;

export function isExam(chapter: number, mission: number): boolean {
  return chapter === EXAM.chapter && mission === EXAM.mission;
}

// What the game is told when an attempt starts (or is resumed after a
// refresh). Nothing here says whether any answer was right.
export type ExamStart = {
  attemptNumber: number;
  totalItems: number;
  passScore: number;
  answered: number;
};

// The only reply to an answer: how far along the player is.
export type ExamSaved = {
  saved: true;
  answered: number;
  totalItems: number;
};

// The one moment the exam reveals anything.
export type ExamResult = {
  attemptNumber: number;
  score: number;
  totalItems: number;
  passScore: number;
  passed: boolean;
};

// What GET /progress adds, so the game can draw the exam screen: how many
// tries so far, the last and best score, whether it was passed, and whether
// an attempt is still running.
export type ExamState = {
  chapter: number;
  mission: number;
  attempts: number;
  lastScore: number | null;
  bestScore: number | null;
  passed: boolean;
  running: boolean;
};

export type Exam = {
  // Starts a new attempt, or hands back the one already running.
  start(player: Player): Promise<ExamStart>;
  // Saves one item's answer. The reply never says whether it was right.
  answer(player: Player, input: ExamAnswerInput): Promise<ExamSaved>;
  // Ends the attempt and gives the score. Passing completes the chapter.
  finish(player: Player): Promise<ExamResult>;
  // For GET /progress.
  state(player: Player): Promise<ExamState>;
};

// The exam needs the same unlock rules as everything else, so it borrows the
// progress loader instead of repeating them.
export function supabaseExam(
  config: SupabaseConfig,
  loadProgress: (player: Player) => Promise<Progress>,
): Exam {
  // Full access that skips RLS: only the server may score an exam or read
  // which items were right. Never leaves the server.
  const admin = createClient(config.url, config.serviceRoleKey, serverOptions);

  // The exam opens only once every chapter before it is finished.
  async function requireUnlocked(player: Player): Promise<void> {
    const progress = await loadProgress(player);
    const status = findMission(progress, EXAM.chapter, EXAM.mission);
    if (!status) {
      throw new ApiError(404, "MISSION_NOT_FOUND", "The exam doesn't exist.");
    }
    if (!status.unlocked) {
      throw new ApiError(
        403,
        "MISSION_LOCKED",
        "Finish the other chapters before the final exam.",
      );
    }
  }

  // The attempt this player is in the middle of, if any.
  async function runningAttempt(
    player: Player,
  ): Promise<{ id: string; total_items: number }> {
    const { data, error } = await admin
      .from("exam_attempts")
      .select("id, total_items")
      .eq("player_id", player.id)
      .eq("chapter_id", EXAM.chapter)
      .eq("mission_number", EXAM.mission)
      .is("finished_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ApiError(
        409,
        "NO_EXAM_RUNNING",
        "Start the exam before answering.",
      );
    }
    return data as { id: string; total_items: number };
  }

  return {
    async start(player) {
      await requireUnlocked(player);
      const { data, error } = await admin.rpc("start_exam_attempt", {
        p_player_id: player.id,
        p_chapter: EXAM.chapter,
        p_mission: EXAM.mission,
      });
      if (error) throw error;
      const row = firstRow(data);
      return {
        attemptNumber: row.attempt_number as number,
        totalItems: row.total_items as number,
        passScore: row.pass_score as number,
        answered: row.answered as number,
      };
    },

    async answer(player, { question, answer }) {
      const attempt = await runningAttempt(player);
      if (question > attempt.total_items) {
        throw new ApiError(
          404,
          "QUESTION_NOT_FOUND",
          "That exam item doesn't exist.",
        );
      }

      // The accepted answers for this item. Read here, never sent anywhere.
      const { data: rows, error: readError } = await admin
        .from("mission_answers")
        .select("answer")
        .eq("chapter_id", EXAM.chapter)
        .eq("mission_number", EXAM.mission)
        .eq("question", question);
      if (readError) throw readError;
      const accepted = rows.map((row) => row.answer as string);
      if (accepted.length === 0) {
        throw new ApiError(
          404,
          "QUESTION_NOT_FOUND",
          "That exam item doesn't exist.",
        );
      }

      // Compared as C#, the same as a normal mission (csharp.ts).
      const correct = accepted.some((key) => sameCode(answer, key));

      const { data, error } = await admin.rpc("record_exam_answer", {
        p_player_id: player.id,
        p_attempt: attempt.id,
        p_question: question,
        p_answer: answer,
        p_correct: correct,
      });
      if (error) throw answerLimitError(error) ?? error;

      // Deliberately silent about `correct`.
      return {
        saved: true,
        answered: data as number,
        totalItems: attempt.total_items,
      };
    },

    async finish(player) {
      const attempt = await runningAttempt(player);
      const { data, error } = await admin.rpc("finish_exam_attempt", {
        p_player_id: player.id,
        p_attempt: attempt.id,
      });
      if (error) throw error;
      const row = firstRow(data);
      return {
        attemptNumber: row.attempt_number as number,
        score: row.score as number,
        totalItems: row.total_items as number,
        passScore: row.pass_score as number,
        passed: row.passed as boolean,
      };
    },

    async state(player) {
      const { data, error } = await admin.rpc("exam_state", {
        p_player_id: player.id,
        p_chapter: EXAM.chapter,
        p_mission: EXAM.mission,
      });
      if (error) throw error;
      const row = firstRow(data);
      return {
        chapter: EXAM.chapter,
        mission: EXAM.mission,
        attempts: (row.attempts as number) ?? 0,
        lastScore: (row.last_score as number | null) ?? null,
        bestScore: (row.best_score as number | null) ?? null,
        passed: (row.passed as boolean) ?? false,
        running: (row.running as boolean) ?? false,
      };
    },
  };
}

// A function that "returns table" comes back as a list of rows; one that
// returns a single value comes back on its own.
function firstRow(data: unknown): Record<string, unknown> {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    throw new Error("The database returned no exam row.");
  }
  return row as Record<string, unknown>;
}
