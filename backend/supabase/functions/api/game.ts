import { createClient } from "@supabase/supabase-js";
import {
  asPlayer,
  type Player,
  serverOptions,
  type SupabaseConfig,
} from "./accounts.ts";
import { ApiError } from "./errors.ts";
import { buildProgress, findMission, type Progress } from "./progress.ts";
import type { SubmitInput } from "./schemas.ts";

export type SubmitResult = { correct: boolean };

// Everything the routes need for the game itself. Like Accounts, routes
// depend on this type, not on Supabase directly, so tests can pass a fake.
export type Game = {
  getProgress(player: Player): Promise<Progress>;
  // Checks a typed answer. A correct one saves the player's progress.
  submitAnswer(player: Player, input: SubmitInput): Promise<SubmitResult>;
};

export function supabaseGame(config: SupabaseConfig): Game {
  // Full access that skips RLS, only for checking answers: players can never
  // read them. Never leaves the server.
  const admin = createClient(config.url, config.serviceRoleKey, serverOptions);

  return {
    getProgress: (player) => loadProgress(config, player),

    async submitAnswer(player, { chapter, mission, answer }) {
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

      // The database checks the answer and records the try in one step
      // (see the mission_submit migration).
      const { data: correct, error } = await admin.rpc(
        "submit_mission_answer",
        {
          p_player_id: player.id,
          p_chapter: chapter,
          p_mission: mission,
          p_answer: answer,
        },
      );
      if (error) throw error;
      return { correct: correct === true };
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
