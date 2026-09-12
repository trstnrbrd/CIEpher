// The game's unlock rules, in one place. No database code here, so the rules
// are easy to test (progress.test.ts).
//
// - The prologue (chapter 0) is always unlocked.
// - A chapter unlocks when the chapter before it is completed.
// - Inside a chapter, missions unlock one at a time, in order.
// - A chapter is completed when it has missions and all of them are done.
//   A chapter with no missions yet is never completed.

export type MissionKey = { chapter: number; mission: number };

export type MissionStatus = {
  number: number;
  unlocked: boolean;
  completed: boolean;
};

export type ChapterStatus = {
  id: number;
  unlocked: boolean;
  completed: boolean;
  missions: MissionStatus[];
};

export type Progress = { chapters: ChapterStatus[] };

export function buildProgress(
  chapterIds: number[],
  missions: MissionKey[],
  completedMissions: MissionKey[],
): Progress {
  const done = new Set(completedMissions.map(keyOf));
  // The first chapter has nothing before it, so it's always unlocked.
  let previousChapterCompleted = true;

  const chapters = [...chapterIds].sort(byNumber).map((id) => {
    const unlocked = previousChapterCompleted;
    // The first mission has nothing before it in its chapter.
    let previousMissionCompleted = true;

    const statuses = missions
      .filter((m) => m.chapter === id)
      .map((m) => m.mission)
      .sort(byNumber)
      .map((number) => {
        const completed = done.has(keyOf({ chapter: id, mission: number }));
        const status = {
          number,
          unlocked: unlocked && previousMissionCompleted,
          completed,
        };
        previousMissionCompleted = completed;
        return status;
      });

    const completed = statuses.length > 0 && statuses.every((m) => m.completed);
    previousChapterCompleted = completed;
    return { id, unlocked, completed, missions: statuses };
  });

  return { chapters };
}

function keyOf({ chapter, mission }: MissionKey): string {
  return `${chapter}-${mission}`;
}

function byNumber(a: number, b: number): number {
  return a - b;
}
