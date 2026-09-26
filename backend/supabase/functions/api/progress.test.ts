import { assertEquals } from "@std/assert";
import { buildProgress, findMission, type MissionKey } from "./progress.ts";

// The game as it is today: the prologue (0) has 3 missions, and chapters 1-7
// and the epilogue (8) have none yet.
const CHAPTERS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const PROLOGUE: MissionKey[] = [1, 2, 3].map((mission) => ({
  chapter: 0,
  mission,
}));
const CHAPTER_1: MissionKey[] = [1, 2, 3, 4, 5].map((mission) => ({
  chapter: 1,
  mission,
}));

function chaptersAfter(
  completed: MissionKey[],
  missions = PROLOGUE,
  chapters = CHAPTERS,
) {
  return buildProgress(chapters, missions, completed).chapters;
}

Deno.test("new player: only the prologue's first mission is open", () => {
  const chapters = chaptersAfter([]);
  assertEquals(chapters[0], {
    id: 0,
    unlocked: true,
    completed: false,
    missions: [
      { number: 1, unlocked: true, completed: false },
      { number: 2, unlocked: false, completed: false },
      { number: 3, unlocked: false, completed: false },
    ],
  });
  assertEquals(chapters[1].unlocked, false);
});

Deno.test("finishing a mission opens the next one", () => {
  const [prologue] = chaptersAfter([{ chapter: 0, mission: 1 }]);
  assertEquals(prologue.missions, [
    { number: 1, unlocked: true, completed: true },
    { number: 2, unlocked: true, completed: false },
    { number: 3, unlocked: false, completed: false },
  ]);
});

Deno.test("finishing the prologue opens chapter 1, and only chapter 1", () => {
  const chapters = chaptersAfter(PROLOGUE);
  assertEquals(chapters[0].completed, true);
  assertEquals(chapters[1].unlocked, true);
  // Chapter 1 has no missions yet, so it can't be completed yet, and the
  // chapters after it stay locked.
  assertEquals(chapters[1].completed, false);
  assertEquals(
    chapters.slice(2).map((c) => c.unlocked),
    [false, false, false, false, false, false, false],
  );
});

Deno.test("a chapter opens only after the whole previous chapter", () => {
  const missions = [...PROLOGUE, ...CHAPTER_1];

  const fourOfFive = chaptersAfter(
    [...PROLOGUE, ...CHAPTER_1.slice(0, 4)],
    missions,
  );
  assertEquals(fourOfFive[1].completed, false);
  assertEquals(fourOfFive[2].unlocked, false);

  const allFive = chaptersAfter([...PROLOGUE, ...CHAPTER_1], missions);
  assertEquals(allFive[1].completed, true);
  assertEquals(allFive[2].unlocked, true);
});

Deno.test("the order of the database rows doesn't matter", () => {
  const shuffledMissions = [PROLOGUE[2], PROLOGUE[0], PROLOGUE[1]];
  const shuffledChapters = [3, 0, 7, 1, 8, 2, 6, 4, 5];
  assertEquals(
    chaptersAfter([], shuffledMissions, shuffledChapters),
    chaptersAfter([]),
  );
});

Deno.test("findMission finds a mission's status, if it exists", () => {
  const progress = buildProgress(CHAPTERS, PROLOGUE, []);
  assertEquals(findMission(progress, 0, 1), {
    number: 1,
    unlocked: true,
    completed: false,
  });
  assertEquals(findMission(progress, 0, 2)?.unlocked, false);
  assertEquals(findMission(progress, 0, 9), undefined);
  // Chapter 1 exists but has no missions yet.
  assertEquals(findMission(progress, 1, 1), undefined);
  assertEquals(findMission(progress, 42, 1), undefined);
});
