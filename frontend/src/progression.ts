// The one place that decides what happens right after a correct answer on any
// mission. Every level's post-correct flow is a short queue of steps that
// MissionScreen plays one after another: the learning screen ("UNDERSTAND
// THE CORE" / Program Flow), then a location scene, then either the next
// question of the same mission or the advance to the next mission. Missions
// that leave the queue empty just show the continue buttons.
//
// Data (matches frontend/src/lessons.ts):
//   ch0 m1  core -> door scene
//   ch0 m2  core only
//   ch0 m3  core -> sakay animation
//   ch1 m1  q1 Correct card -> next question, q2 core -> syntax Correct card -> welcome-gate scene
//   ch1 m2  core -> Correct card -> attendance-recorded scene
//   ch1 m3  core -> Correct card
//   ch1 m4  core -> submission scene
//   ch1 m5  core (Program Flow) -> chapter-complete card
//   ch2 m1  q1 core -> purchase scene -> next question; q2 core -> scene 1.2
//   ch2 m2  core -> Wi-Fi-on scene
//   ch2 m3  core -> portal-opens scene -> Part 4
//   ch2 m4  portal scene -> situation -> coding question -> core -> submission scene
//   ch2 m4  core -> submission scene
//   ch2 m5  core only
//   ch3 m1  q1 feedback -> portal History scene -> score syntax question;
//            q2 feedback -> Part 2
//
// New levels just add a row here (or use the fallback below). Unknown missions
// follow the default: an earlier question goes straight to the next one; the
// last shows the explanation if the lesson has one, then the continue buttons.

export type SceneId =
  | 'door'
  | 'animation'
  | 'gateCorrect'
  | 'gateSyntaxCorrect'
  | 'welcomeGate'
  | 'classroomCorrect'
  | 'classroomAttendance'
  | 'programmingLabCorrect'
  | 'homeworkCorrect'
  | 'chapterComplete'
  | 'submission'
  | 'scene11'
  | 'scene12'
  | 'scene21'
  | 'scene31'
  | 'scene41'
  | 'ch3History'
  | 'ch3Score'
  | 'ch3M2Correct'
  | 'ch3M2Qualified'
  | 'ch3M2Thanks'
  | 'ch3M3Correct'
  | 'ch3M3Medal'
  | 'ch3Complete'
  | 'ch4Scene11'
  | 'ch4Scene12'
  | 'ch4SceneEnterLab'
  | 'ch4Scene21'
  | 'ch4Scene22'
  | 'ch4Scene31'
  | 'ch4Scene32'
  | 'ch4Scene41'
  | 'ch4Scene42'
  | 'ch4Complete'

export type CorrectStep =
  | { kind: 'core' }
  | { kind: 'scene'; id: SceneId }
  | { kind: 'advance-question' }

const POST_CORRECT_STEPS: Record<string, (question: number) => CorrectStep[]> =
  {
    '0:1': () => [{ kind: 'core' }, { kind: 'scene', id: 'door' }],
    '0:2': () => [{ kind: 'core' }],
    '0:3': () => [{ kind: 'core' }, { kind: 'scene', id: 'animation' }],
    '1:1': (question) =>
      question === 1
        ? [
            { kind: 'core' },
            { kind: 'scene', id: 'gateCorrect' },
            { kind: 'advance-question' },
          ]
        : [
            { kind: 'core' },
            { kind: 'scene', id: 'gateSyntaxCorrect' },
            { kind: 'scene', id: 'welcomeGate' },
          ],
    '1:2': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'classroomCorrect' },
      { kind: 'scene', id: 'classroomAttendance' },
    ],
    '1:3': () => [{ kind: 'core' }, { kind: 'scene', id: 'programmingLabCorrect' }],
    '1:4': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'homeworkCorrect' },
      { kind: 'scene', id: 'submission' },
    ],
    '1:5': () => [{ kind: 'core' }, { kind: 'scene', id: 'chapterComplete' }],
    '2:1': (question) =>
      question === 1
        ? [
            { kind: 'core' },
            { kind: 'scene', id: 'scene11' },
            { kind: 'advance-question' },
          ]
        : [{ kind: 'core' }, { kind: 'scene', id: 'scene12' }],
    '2:2': () => [{ kind: 'core' }, { kind: 'scene', id: 'scene21' }],
    '2:3': () => [{ kind: 'core' }, { kind: 'scene', id: 'scene31' }],
    '2:4': () => [{ kind: 'core' }, { kind: 'scene', id: 'scene41' }],
    '2:5': () => [{ kind: 'core' }],
    '3:1': (question) =>
      question === 1
        ? [
            { kind: 'core' },
            { kind: 'scene', id: 'ch3History' },
            { kind: 'advance-question' },
          ]
        : [{ kind: 'core' }, { kind: 'scene', id: 'ch3Score' }],
    '3:2': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch3M2Correct' },
      { kind: 'scene', id: 'ch3M2Qualified' },
      { kind: 'scene', id: 'ch3M2Thanks' },
    ],
    '3:3': () => [
      { kind: 'core' },
    ],
    '3:4': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch3M3Correct' },
      { kind: 'scene', id: 'ch3M3Medal' },
    ],
    '3:5': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch3Complete' },
    ],
    '4:1': (question) =>
      question === 1
        ? [
            { kind: 'core' },
            { kind: 'advance-question' },
          ]
        : [
            { kind: 'core' },
            { kind: 'scene', id: 'ch4SceneEnterLab' },
          ],
    '4:2': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch4Scene21' },
      { kind: 'scene', id: 'ch4Scene22' },
    ],
    '4:3': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch4Scene31' },
      { kind: 'scene', id: 'ch4Scene32' },
    ],
    '4:4': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch4Scene41' },
      { kind: 'scene', id: 'ch4Scene42' },
    ],
    '4:5': () => [
      { kind: 'core' },
      { kind: 'scene', id: 'ch4Complete' },
    ],
  }

export function postCorrectSteps(
  chapter: number,
  mission: number,
  question: number,
  totalQuestions: number,
  hasLearningScreen: boolean,
): CorrectStep[] {
  const row = POST_CORRECT_STEPS[`${chapter}:${mission}`]
  if (row) {
    return row(question)
  }
  // Future levels: an earlier question moves on to the next one; the last
  // question shows the lesson's explanation if it has one, then the continue
  // buttons. Add a row when a level needs scenes.
  if (question < totalQuestions) {
    return [{ kind: 'advance-question' }]
  }
  return hasLearningScreen ? [{ kind: 'core' }] : []
}

// The session hint remembers which question a multi-question mission had
// reached, so a refresh in the same session resumes there instead of showing
// question 1 again. It lives in sessionStorage (same lifetime as the player's
// saved view) and is cleared as soon as the mission is completed.
const QUESTION_HINT_KEY = 'ciepher.question-hint'

interface QuestionHintStore {
  [key: string]: number
}

function readHintStore(): QuestionHintStore {
  try {
    const raw = sessionStorage.getItem(QUESTION_HINT_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : {}
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as QuestionHintStore)
      : {}
  } catch {
    return {}
  }
}

export function readQuestionHint(
  chapter: number,
  mission: number,
  totalQuestions: number,
): number {
  const stored = readHintStore()[`${chapter}:${mission}`]
  if (typeof stored !== 'number' || !Number.isInteger(stored)) {
    return 1
  }
  return Math.min(Math.max(stored, 1), totalQuestions)
}

export function saveQuestionHint(
  chapter: number,
  mission: number,
  question: number,
): void {
  try {
    const store = readHintStore()
    store[`${chapter}:${mission}`] = question
    sessionStorage.setItem(QUESTION_HINT_KEY, JSON.stringify(store))
  } catch {
    // Storage unavailable: resuming starts from question 1.
  }
}

export function clearQuestionHint(chapter: number, mission: number): void {
  try {
    const store = readHintStore()
    if (!(`${chapter}:${mission}` in store)) return
    delete store[`${chapter}:${mission}`]
    sessionStorage.setItem(QUESTION_HINT_KEY, JSON.stringify(store))
  } catch {
    // Ignore unavailable browser storage.
  }
}

// Lab computers are shared: logging out must not leave the next player's
// resumed-question hints behind, just like the saved view is cleared.
export function clearAllQuestionHints(): void {
  try {
    sessionStorage.removeItem(QUESTION_HINT_KEY)
  } catch {
    // Ignore unavailable browser storage.
  }
}
