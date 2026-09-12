import { asPlayer, type Player, type SupabaseConfig } from "./accounts.ts";
import { buildProgress, type Progress } from "./progress.ts";

// Everything the routes need for the game itself. Like Accounts, routes
// depend on this type, not on Supabase directly, so tests can pass a fake.
export type Game = {
  getProgress(player: Player): Promise<Progress>;
};

export function supabaseGame(config: SupabaseConfig): Game {
  return {
    async getProgress(player) {
      // Runs as the player: RLS lets them read every chapter and mission, but
      // only their own progress.
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
        missions.data.map((m) => ({
          chapter: m.chapter_id,
          mission: m.number,
        })),
        completed.data.map((p) => ({
          chapter: p.chapter_id,
          mission: p.mission_number,
        })),
      );
    },
  };
}
