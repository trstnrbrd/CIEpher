import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  getProgress,
  submitAnswer,
  type Character,
  type Progress,
  type Mistake,
} from '../api/client'
import {
  clearQuestionHint,
  postCorrectSteps,
  readQuestionHint,
  saveQuestionHint,
  type CorrectStep,
  type SceneId,
} from '../progression'
import GameTopBar from './GameTopBar'
import PostSelectWelcome from './PostSelectWelcome'
import PrologueStory from './PrologueStory'
import {
  CH2_COMPLETE_PAGE,
  CH2_PORTAL_LINE_PAGE,
  CH2_PORTAL_OPENED_PAGE,
  CH2_PURCHASE_DONE_PAGE,
  CH2_PURCHASE_PAGES,
  CH2_REVIEW_PAGES,
  CH2_SCENE1_PAGE,
  CH2_SUBMITTED_PAGE,
  CH2_UPLOAD_LINE_PAGE,
  CH2_WIFI_ON_PAGE,
  CH2_WIFI_SETUP_PAGE,
  CH3_HISTORY_PAGE,
  CH3_INTRO_PAGES,
  CH3_PART_ONE_SCENE_PAGE,
  CH3_SCORE_PAGE,
  CH3_SCHOLARSHIP_GREETING_PAGE,
  CH3_SCHOLARSHIP_STAFF_PAGE,
  CH3_SITUATION_PAGE,
  CH3_M2_CORRECT_CARD,
  CH3_M2_QUALIFIED_PAGE,
  CH3_M2_THANKS_PAGE,
  CH3_M3_WIFI_PAGE,
  CH3_M3_PROF_PAGE,
  CH3_M3_SUBMITTED_PAGE,
  CH3_M3_SITUATION_PAGE,
  CH3_M3_CORRECT_CARD,
  CH3_M3_MEDAL_PAGE,
  CH3_M4_PROF_PAGE,
  CH3_M4_PC_PAGE,
  CH3_M4_SITUATION_PAGE,
  CH3_COMPLETE_PAGE,
  CH4_INTRO_PAGES,
  CH4_SCENE_1_1_PAGE,
  CH4_SCENE_1_2_PAGE,
  CH4_SCENE_ENTER_LAB_PAGE,
  CH4_M2_SITUATION_PAGE,
  CH4_SCENE_2_1_PAGE,
  CH4_SCENE_2_2_PAGE,
  CH4_M3_SITUATION_PAGE,
  CH4_SCENE_3_1_PAGE,
  CH4_SCENE_3_2_PAGE,
  CH4_M4_SITUATION_PAGE,
  CH4_SCENE_4_1_PAGE,
  CH4_SCENE_4_2_PAGE,
  CH4_M5_SITUATION_PAGE,
  CH4_COMPLETE_PAGE,
  CH4_CLOSING_PAGE,
  CLASSROOM_ARRIVAL_PAGE,
  CLASSROOM_ATTENDANCE_RECORDED_PAGE,
  CLASSROOM_CORRECT_PAGE,
  CLASSROOM_KIOSK_PAGE,
  CLASSROOM_PAGE,
  CLASSROOM_SITUATION_PAGE,
  HOMEWORK_PAGE,
  HOMEWORK_CORRECT_PAGE,
  HOMEWORK_SITUATION_PAGE,
  JEEP_START_PAGE,
  OPEN_DOOR_PAGE,
  OUTSIDE_PAGES,
  PROGRAMMING_LAB_ENTRY_PAGE,
  PROGRAMMING_LAB_CORRECT_PAGE,
  PROGRAMMING_LAB_PAGE,
  PROGRAMMING_LAB_NOTIFICATION_PAGE,
  PROGRAMMING_LAB_SITUATION_PAGE,
  CHAPTER_COMPLETE_PAGE,
  QUIZ_ANNOUNCEMENT_PAGE,
  QUIZ_SITUATION_PAGE,
  REYES_CLOSING_PAGE,
  SCHOOL_GATE_PAGE,
  SCHOOL_GATE_CHOICE_CORRECT_PAGE,
  SCHOOL_GATE_SYNTAX_CORRECT_PAGE,
  SCHOOL_GATE_SITUATION_PAGE,
  SUBMISSION_PAGE,
  WELCOME_GATE_PAGE,
} from '../storyPages'
import guardImg from '../chapter1/guard.webp'
import loginPcImg from '../chapter 2/LOGIN_PC.webp'
import loggedInImg from '../chapter 2/LOGGED_IN.webp'
import chapterThreeComputerImg from '../chapter 3/computer.webp'
import chapterThreeStaffImg from '../chapter 3/girl.webp'
import ch4KioskBeginImg from '../assets/chapter 4/kioskTaptobegin.webp'
import boyHallwayVideo from '../chapter1/boy_hallway.mp4'
import girlHallwayVideo from '../chapter1/girl_hallway.mp4'
import boyImg from '../assets/boy.webp'
import girlImg from '../assets/girl.webp'
import CodeWorkflow from './CodeWorkflow'
import CoreBreakdown from './CoreBreakdown'
import ProgramFlow from './ProgramFlow'
import ChapterTwoFeedback from './ChapterTwoFeedback'
import ChapterThreeFeedback from './ChapterThreeFeedback'
import ChapterFourFeedback from './ChapterFourFeedback'
import MistakeHighlight from './MistakeHighlight'
import SakayAnimation from './SakayAnimation'
import LevelUnlock from './LevelUnlock'
import TaskBar from './TaskBar'
import { getLesson } from '../lessons'
import './MissionScreen.css'

interface MissionScreenProps {
  chapter: number
  mission: number
  character: Character
  onChapter: () => void
  // The session ended (401): straight back to Login, nothing to ask.
  onUnauthorized: () => void
  onOpenMission: (chapter: number, mission: number) => void
  onJournal: (chapter?: number) => void
  onSettings: () => void
}

function chapterLabel(id: number): string {
  return id === 0 ? 'PROLOGUE' : `CHAPTER ${id}`
}

// Choice samples are formatted code. Keep a space between language keywords
// while ignoring indentation, otherwise `else if` would be treated as the
// invalid `elseif` sample when we mark the submitted sample red.
function normalizeChoiceSyntax(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .trim()
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
}

// Normalizes code syntax for token comparison while preserving keyword differences
// like `else if` vs `elseif`.
function normalizeCodeTokens(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\belse\s+if\b/gi, 'else if')
    .replace(/\s*([(){};><!=+\-*/])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function computeDiceSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const aBigrams = new Map<string, number>()
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2)
    aBigrams.set(bigram, (aBigrams.get(bigram) ?? 0) + 1)
  }

  let intersection = 0
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2)
    const count = aBigrams.get(bigram) ?? 0
    if (count > 0) {
      aBigrams.set(bigram, count - 1)
      intersection++
    }
  }

  const total = a.length - 1 + (b.length - 1)
  return total > 0 ? (2 * intersection) / total : 0
}

function findMatchingChoiceIndex(choices: string[], answer: string): number {
  const trimmed = answer.trim()
  if (!trimmed) return -1

  // 1. Exact trimmed match
  const exact = choices.findIndex((c) => c.trim().toLowerCase() === trimmed.toLowerCase())
  if (exact !== -1) return exact

  // 2. Normalized choice syntax match (linebreaks/indentation normalized)
  const normAnswer = normalizeChoiceSyntax(answer).toLowerCase()
  const normIndex = choices.findIndex(
    (c) => normalizeChoiceSyntax(c).toLowerCase() === normAnswer,
  )
  if (normIndex !== -1) return normIndex

  // 3. Token-normalized match (spaces around braces/operators collapsed)
  const codeAnswer = normalizeCodeTokens(answer)
  const codeIndex = choices.findIndex(
    (c) => normalizeCodeTokens(c) === codeAnswer,
  )
  if (codeIndex !== -1) return codeIndex

  // 4. Feature-based distinctive syntax matching
  const lowerAnswer = answer.toLowerCase()
  const lowerChoices = choices.map((c) => c.toLowerCase())

  if (lowerAnswer.includes('elseif')) {
    const idx = lowerChoices.findIndex((c) => c.includes('elseif'))
    if (idx !== -1) return idx
  }

  if (lowerAnswer.includes('else(') || lowerAnswer.includes('else (')) {
    const idx = lowerChoices.findIndex(
      (c) => c.includes('else(') || c.includes('else ('),
    )
    if (idx !== -1) return idx
  }

  // 5. Similarity scoring based on character bigrams
  let bestIndex = -1
  let bestScore = 0
  for (let i = 0; i < choices.length; i++) {
    const cTokens = normalizeCodeTokens(choices[i])
    const score = computeDiceSimilarity(codeAnswer, cTokens)
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  if (bestScore >= 0.5) {
    return bestIndex
  }

  if (choices.length === 2 && bestScore >= 0.3) {
    return bestIndex
  }

  return -1
}


function MissionScreen({
  chapter,
  mission,
  character,
  onChapter,
  onUnauthorized,
  onOpenMission,
  onJournal,
  onSettings,
}: MissionScreenProps) {
  // The prologue opens with the character's intro: play it before mission 1.
  // Re-entering the prologue (a fresh mount) shows it again.
  const [showingIntro, setShowingIntro] = useState<boolean>(
    chapter === 0 && mission === 1,
  )
  // After the welcome screens' YES, a short story plays before mission 1.
  const [showingStory, setShowingStory] = useState<boolean>(false)
  // Mission 1 opens with its own story. Mission 3 opens at the jeep with a
  // short boarding beat before the RideJeep(); exercise, so the scene moves
  // from the terminal to the jeep itself. Mission 2 needs no opening beat:
  // the previous mission's outside pages already promise the jeep terminal.
  const [showingJeep, setShowingJeep] = useState<boolean>(
    chapter === 0 && mission === 3,
  )
  // Chapter 1 opens with the school gate story beat.
  const [showingSchoolGate, setShowingSchoolGate] = useState<boolean>(
    chapter === 1 && mission === 1,
  )
  // Chapter 1, mission 1: the Correct card after question 1 ("if"), before
  // the syntax challenge.
  const [showingGateCorrect, setShowingGateCorrect] = useState<boolean>(false)
  const [showingGateSyntaxCorrect, setShowingGateSyntaxCorrect] =
    useState<boolean>(false)
  // Chapter 1, scene 1.2: after mission 1's explanation, the guard welcomes
  // the player and the hallway video plays into the university.
  const [showingWelcomeGate, setShowingWelcomeGate] = useState<boolean>(false)
  // Chapter 1, scene 2.1: mission 2 opens outside the classroom as the
  // attendance kiosk asks the player to scan their ID.
  const [showingClassroom, setShowingClassroom] = useState<boolean>(
    chapter === 1 && mission === 2,
  )
  const [showingClassroomCorrect, setShowingClassroomCorrect] =
    useState<boolean>(false)
  const [showingClassroomAttendance, setShowingClassroomAttendance] =
    useState<boolean>(false)
  const [showingProgrammingLabCorrect, setShowingProgrammingLabCorrect] =
    useState<boolean>(false)
  // Chapter 1, scene 3.1: mission 3 opens in the Programming Laboratory as
  // the player finds the assigned computer turned off before the challenge.
  const [showingComputer, setShowingComputer] = useState<boolean>(
    chapter === 1 && mission === 3,
  )
  // Chapter 1, scene 3.2: mission 4 opens in the professor's classroom as a
  // short programming exercise is given before the challenge.
  const [showingHomework, setShowingHomework] = useState<boolean>(
    chapter === 1 && mission === 4,
  )
  const [showingHomeworkCorrect, setShowingHomeworkCorrect] =
    useState<boolean>(false)
  // Chapter 1, scene 4.1: after mission 4's explanation, the screen confirms
  // the activity was submitted before moving on.
  const [showingSubmission, setShowingSubmission] = useState<boolean>(false)
  // Chapter 1, scene 4.2: mission 5 opens as the professor announces the
  // readiness quiz before the challenge.
  const [showingQuiz, setShowingQuiz] = useState<boolean>(
    chapter === 1 && mission === 5,
  )
  // Chapter 1, mission 5: the chapter-complete card after the program flow.
  const [showingChapterComplete, setShowingChapterComplete] =
    useState<boolean>(false)
  // Chapter 1, scene 5.1: after the chapter unlocks, Professor Reyes closes
  // the chapter before the player returns to the chapter list.
  const [showingScene51, setShowingScene51] = useState<boolean>(false)
  // Chapter 2, Scene 1: mission 1 opens as Professor Reyes begins the first
  // laboratory activity before the challenge.
  const [showingCh2Scene1, setShowingCh2Scene1] = useState<boolean>(
    chapter === 2 && mission === 1,
  )
  // Chapter 2, Scene 1.1: the purchase dialogue plays between mission 1's
  // structure question and its syntax challenge.
  const [showingCh2Scene11, setShowingCh2Scene11] = useState<boolean>(false)
  // Chapter 2, Scene 1.2: the worksheet is bought before mission 2.
  const [showingCh2Scene12, setShowingCh2Scene12] = useState<boolean>(false)
  // Chapter 2, Scene 2: Wi-Fi connects, then the player heads to the portal.
  const [showingCh2Scene21, setShowingCh2Scene21] = useState<boolean>(false)
  // Chapter 2, Scene 2 opening: mission 2 opens with the situation that the
  // lab computer has no connection before the Wi-Fi challenge.
  const [showingCh2Scene2, setShowingCh2Scene2] = useState<boolean>(
    chapter === 2 && mission === 2,
  )
  // Chapter 2, Scene 2.2 opening: mission 3 opens as the player heads to the
  // learning portal before the login syntax challenge appears.
  const [showingCh2Scene22, setShowingCh2Scene22] = useState<boolean>(
    chapter === 2 && mission === 3,
  )
  // Chapter 2, Scene 3: the portal opens, then the player needs to upload.
  const [showingCh2Scene31, setShowingCh2Scene31] = useState<boolean>(false)
  // Chapter 2, Scene 4 opens Part 4: the player sees the learning portal
  // before its Situation card and coding question.
  const [showingCh2Scene4, setShowingCh2Scene4] = useState<boolean>(
    chapter === 2 && mission === 4,
  )
  // Chapter 2, Scene 4: the submission is accepted, then the professor
  // challenges the player before mission 5.
  const [showingCh2Scene41, setShowingCh2Scene41] = useState<boolean>(false)
  // Chapter 2, Scene 5.1: after the chapter unlocks, Professor Reyes closes
  // the chapter before the player returns to the chapter list.
  const [showingCh2Complete, setShowingCh2Complete] = useState(false)
  const [showingCh2Scene51, setShowingCh2Scene51] = useState<boolean>(false)
  // After mission 1's explanation closes, the door swings open and the player
  // steps outside, then moves on to the GoToTerminal(); challenge.
  const [doorOpen, setDoorOpen] = useState<boolean>(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [answer, setAnswer] = useState('')
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<{
    ok: boolean
    text: string
  } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  // The coding challenge (from the lesson data): where the typed code is wrong
  // and whether the wrong answer was cut short.
  const lesson = getLesson(chapter, mission)
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [wrongChoiceIndex, setWrongChoiceIndex] = useState<number | null>(null)
  const [acceptedAnswer, setAcceptedAnswer] = useState('')
  const answerOverlay = useRef<HTMLSpanElement>(null)
  // The "UNDERSTAND THE CORE" screen shows after a correct answer, before
  // the green CORRECT! message.
  const [showCore, setShowCore] = useState<boolean>(false)
  // Multi-question missions: track which question we're on (1-indexed). A
  // session hint resumes the same question after a refresh; otherwise the
  // mission starts from question 1.
  const [questionNumber, setQuestionNumber] = useState<number>(() =>
    readQuestionHint(chapter, mission, lesson?.questions?.length ?? 1),
  )
  const [showingCh2Situation, setShowingCh2Situation] = useState(
    chapter === 2 && questionNumber === 1,
  )
  const [showingCh3Scene3, setShowingCh3Scene3] = useState(
    chapter === 3 && mission === 1 && questionNumber === 1,
  )
  const [showingCh3Situation, setShowingCh3Situation] = useState(
    chapter === 3 && mission === 1 && questionNumber === 1,
  )
  const [showingCh3History, setShowingCh3History] = useState(false)
  const [showingCh3Score, setShowingCh3Score] = useState(false)
  const [showingCh3M2Opening, setShowingCh3M2Opening] = useState(
    chapter === 3 && mission === 2,
  )
  const [showingCh3M2Situation, setShowingCh3M2Situation] = useState(
    chapter === 3 && mission === 2,
  )
  const [showingCh3M2Correct, setShowingCh3M2Correct] = useState(false)
  const [showingCh3M2Qualified, setShowingCh3M2Qualified] = useState(false)
  const [showingCh3M2Thanks, setShowingCh3M2Thanks] = useState(false)
  const [showingCh3M3Opening, setShowingCh3M3Opening] = useState(
    chapter === 3 && mission === 3,
  )
  const [showingCh3M4Opening, setShowingCh3M4Opening] = useState(
    chapter === 3 && mission === 4,
  )
  const [showingCh3M4Situation, setShowingCh3M4Situation] = useState(
    chapter === 3 && mission === 4,
  )
  const [showingCh3M3Correct, setShowingCh3M3Correct] = useState(false)
  const [showingCh3M3Medal, setShowingCh3M3Medal] = useState(false)
  const [showingCh3M5Opening, setShowingCh3M5Opening] = useState(
    chapter === 3 && mission === 5,
  )
  const [showingCh3M5Situation, setShowingCh3M5Situation] = useState(
    chapter === 3 && mission === 5,
  )
  const [showingCh3Complete, setShowingCh3Complete] = useState(false)
  const [showingCh4Intro, setShowingCh4Intro] = useState<boolean>(
    chapter === 4 && mission === 1 && questionNumber === 1,
  )
  const [showingCh4Situation, setShowingCh4Situation] = useState<boolean>(
    chapter === 4 && mission === 1 && questionNumber === 1,
  )
  const [showingCh4Scene11, setShowingCh4Scene11] = useState<boolean>(false)
  const [showingCh4Scene12, setShowingCh4Scene12] = useState<boolean>(false)
  const [showingCh4SceneEnterLab, setShowingCh4SceneEnterLab] =
    useState<boolean>(false)
  const [showingCh4M2Situation, setShowingCh4M2Situation] = useState<boolean>(
    chapter === 4 && mission === 2,
  )
  const [showingCh4Scene21, setShowingCh4Scene21] = useState<boolean>(false)
  const [showingCh4Scene22, setShowingCh4Scene22] = useState<boolean>(false)
  const [showingCh4M3Situation, setShowingCh4M3Situation] = useState<boolean>(
    chapter === 4 && mission === 3,
  )
  const [showingCh4Scene31, setShowingCh4Scene31] = useState<boolean>(false)
  const [showingCh4Scene32, setShowingCh4Scene32] = useState<boolean>(false)
  const [showingCh4M4Situation, setShowingCh4M4Situation] = useState<boolean>(
    chapter === 4 && mission === 4,
  )
  const [showingCh4Scene41, setShowingCh4Scene41] = useState<boolean>(false)
  const [showingCh4Scene42, setShowingCh4Scene42] = useState<boolean>(false)
  const [showingCh4M5Situation, setShowingCh4M5Situation] = useState<boolean>(
    chapter === 4 && mission === 5,
  )
  const [showingCh4Complete, setShowingCh4Complete] = useState<boolean>(false)
  const [showingCh4Closing, setShowingCh4Closing] = useState<boolean>(false)
  // The "sakay" animation plays after the last prologue puzzle (mission 3).
  const [showingAnimation, setShowingAnimation] = useState<boolean>(false)
  // When the last mission of a chapter is cleared, a celebration shows the
  // next level unlocking before the player returns to the chapter list.
  // Holds the chapter id being unlocked (the one after the current one).
  const [unlockChapter, setUnlockChapter] = useState<number | null>(null)
  // After a correct answer, the steps of this mission's post-correct flow
  // (explanation, next scene, on to the next question) still to come after
  // the one on screen. Each plays as soon as the one before it closes.
  const [steps, setSteps] = useState<CorrectStep[]>([])
  // True once a correct answer starts the post-correct flow this session, so
  // the terminal buttons and the background swap don't depend on the popup.
  const [solved, setSolved] = useState<boolean>(false)
  // A synchronous latch stops the EXECUTE button from firing twice before the
  // first click's re-render happens: checking alone only updates on render.
  const submittingRef = useRef(false)

  const refreshProgress = async (): Promise<void> => {
    try {
      const p = await getProgress()
      setProgress(p)
      clearCompletedHint(p, false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
      }
    }
  }

  // A finished mission never resumes mid-way: drop its stored question hint.
  // `restart` (only when the screen opens) also starts a replay from question
  // 1; right after the last answer the question stays put, so the screen
  // behind its explanation and scenes doesn't jump back to question 1. Runs
  // when progress arrives, never synchronously during a render.
  const clearCompletedHint = useCallback(
    (p: Progress, restart: boolean): void => {
      const chapterState = p.chapters.find((c) => c.id === chapter)
      const missionState = chapterState?.missions.find(
        (m) => m.number === mission,
      )
      if (missionState?.completed) {
        clearQuestionHint(chapter, mission)
        if (restart) setQuestionNumber(1)
      }
    },
    [chapter, mission],
  )

  // Resolve the current question's prompt/choices/code for multi-question
  // missions. Falls back to the lesson-level single question fields.
  const currentQuestion = (() => {
    if (lesson?.questions) {
      return lesson.questions[questionNumber - 1] ?? null
    }
    if (lesson?.prompt) {
      return {
        prompt: lesson.prompt,
        choices: lesson.choices,
      }
    }
    return null
  })()

  // The background behind the challenge: a question can move the scene (e.g.
  // mission 1's syntax challenge happens at the bookstore), otherwise the
  // lesson's own scene is kept.
  const sceneBg = currentQuestion?.sceneBg ?? lesson?.sceneBg

  useEffect(() => {
    let active = true
    getProgress()
      .then((p) => {
        if (!active) return
        setProgress(p)
        clearCompletedHint(p, true)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized()
          return
        }
        setServerError(
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
        )
      })
    return () => {
      active = false
    }
  }, [onUnauthorized, clearCompletedHint])

  // The handlers below are declared before the early returns on purpose:
  // the story scenes further down return early and call them when they
  // finish, and a const declared after an early return doesn't exist yet in
  // that render (calling it throws).

  const showScene = (id: SceneId): void => {
    switch (id) {
      case 'door':
        setDoorOpen(true)
        break
      case 'animation':
        setShowingAnimation(true)
        break
      case 'gateCorrect':
        setShowingGateCorrect(true)
        break
      case 'gateSyntaxCorrect':
        setShowingGateSyntaxCorrect(true)
        break
      case 'welcomeGate':
        setShowingWelcomeGate(true)
        break
      case 'classroomCorrect':
        setShowingClassroomCorrect(true)
        break
      case 'classroomAttendance':
        setShowingClassroomAttendance(true)
        break
      case 'programmingLabCorrect':
        setShowingProgrammingLabCorrect(true)
        break
      case 'chapterComplete':
        setShowingChapterComplete(true)
        break
      case 'homeworkCorrect':
        setShowingHomeworkCorrect(true)
        break
      case 'submission':
        setShowingSubmission(true)
        break
      case 'scene11':
        setShowingCh2Scene11(true)
        break
      case 'scene12':
        setShowingCh2Scene12(true)
        break
      case 'scene21':
        setShowingCh2Scene21(true)
        break
      case 'scene31':
        setShowingCh2Scene31(true)
        break
      case 'scene41':
        setShowingCh2Scene41(true)
        break
      case 'ch3History':
        setShowingCh3History(true)
        break
      case 'ch3Score':
        setShowingCh3Score(true)
        break
      case 'ch3M2Correct':
        setShowingCh3M2Correct(true)
        break
      case 'ch3M2Qualified':
        setShowingCh3M2Qualified(true)
        break
      case 'ch3M2Thanks':
        setShowingCh3M2Thanks(true)
        break
      case 'ch3M3Correct':
        setShowingCh3M3Correct(true)
        break
      case 'ch3M3Medal':
        setShowingCh3M3Medal(true)
        break
      case 'ch3Complete':
        setShowingCh3Complete(true)
        break
      case 'ch4Scene11':
        setShowingCh4Scene11(true)
        break
      case 'ch4Scene12':
        setShowingCh4Scene12(true)
        break
      case 'ch4SceneEnterLab':
        setShowingCh4SceneEnterLab(true)
        break
      case 'ch4Scene21':
        setShowingCh4Scene21(true)
        break
      case 'ch4Scene22':
        setShowingCh4Scene22(true)
        break
      case 'ch4Scene31':
        setShowingCh4Scene31(true)
        break
      case 'ch4Scene32':
        setShowingCh4Scene32(true)
        break
      case 'ch4Scene41':
        setShowingCh4Scene41(true)
        break
      case 'ch4Scene42':
        setShowingCh4Scene42(true)
        break
      case 'ch4Complete':
        setShowingCh4Complete(true)
        break
    }
  }

  // Plays the first step of `queue` right away and keeps the rest in `steps`:
  // the explanation, a scene, or the next question. An empty queue moves
  // straight on to the next mission (or the end of the chapter).
  const playNextStep = (queue: CorrectStep[]): void => {
    const [head, ...rest] = queue
    if (!head) {
      setSteps([])
      advanceAfterSuccess()
    } else if (head.kind === 'advance-question') {
      applyAdvanceQuestion()
    } else {
      setSteps(rest)
      if (head.kind === 'core') setShowCore(true)
      else showScene(head.id)
    }
  }

  // A post-correct scene finished: play whatever comes after it.
  const continueFromScene = (): void => playNextStep(steps)

  // The next step is the mission's second (or later) question: move on and
  // remember which one, so a refresh in the same session resumes there.
  const applyAdvanceQuestion = (): void => {
    const total = lesson?.questions?.length ?? 1
    const next = Math.min(questionNumber + 1, total)
    saveQuestionHint(chapter, mission, next)
    setQuestionNumber(next)
    setAcceptedAnswer('')
    setWrongChoiceIndex(null)
    setSolved(false)
    setSteps([])
    if (chapter === 4 && mission === 1) {
      setShowingCh4Situation(true)
    }
  }

  // A correct answer starts the post-correct flow defined for this level by
  // progression.ts: the explanation opens at once, and closing it (or a
  // scene ending) plays the next step. Only a level with nothing to show
  // confirms the answer on the challenge and waits for the continue button.
  const beginPostCorrect = (): void => {
    const total = lesson?.questions?.length ?? 1
    const nextSteps = postCorrectSteps(
      chapter,
      mission,
      questionNumber,
      total,
      !!(lesson?.core || lesson?.programFlow),
    )
    setSolved(true)
    if (nextSteps.length === 0) {
      setFeedback({ ok: true, text: 'CORRECT! PROGRESS SAVED.' })
      return
    }
    playNextStep(nextSteps)
  }

  // The sakay animation finished (or was skipped): continue to the next scene.
  const closeAnimation = (): void => {
    setShowingAnimation(false)
    advanceAfterSuccess()
  }

  const nextMission = (() => {
    if (!progress) return null
    const missions = progress.chapters.find((c) => c.id === chapter)?.missions
    if (!missions) return null
    const index = missions.findIndex((m) => m.number === mission)
    const next = missions[index + 1]
    return next && next.unlocked ? next.number : null
  })()

  // This run finished the whole chapter: if the server just unlocked the next
  // one (progress was refreshed before reaching here), play the celebration;
  // otherwise head straight to the chapter list.
  const finishChapter = (): void => {
    // Chapter 1 already showed its chapter-complete card, so it goes
    // straight to Professor Reyes' closing scene.
    if (chapter === 1) {
      setShowingScene51(true)
      return
    }
    if (chapter === 2) {
      if (progress?.chapters.find((c) => c.id === 2)?.completed) {
        setShowingCh2Complete(true)
      } else {
        setServerError(
          'Could not confirm chapter completion. Reopen the chapter to refresh your progress.',
        )
      }
      return
    }
    if (chapter === 3) {
      setShowingCh3Complete(true)
      return
    }
    if (chapter === 4) {
      setShowingCh4Complete(true)
      return
    }
    const nextChapter = progress?.chapters.find((c) => c.id === chapter + 1)
    if (nextChapter?.unlocked) {
      setUnlockChapter(nextChapter.id)
    } else {
      onChapter()
    }
  }

  const advanceAfterSuccess = (): void => {
    if (nextMission !== null) {
      onOpenMission(chapter, nextMission)
    } else {
      finishChapter()
    }
  }

  // Wait for the player's progress before showing any story or challenge, so
  // nothing flashes (like the "coming soon" empty state) while it loads. A
  // failed load falls through to the server error screen instead.
  if (progress === null && !serverError) {
    return (
      <div className="mission-screen">
        <GameTopBar onJournal={onJournal} onSettings={onSettings} />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
        <div className="mission-content">
          <p className="mission-loading">LOADING…</p>
        </div>
      </div>
    )
  }

  // The prologue opens with the welcome screens, then a short story, before
  // mission 1. Only mission 1 mounts them, so missions 2+ skip straight to
  // their beat. Mission 2's question follows right after mission 1's outside
  // pages, while mission 3 opens with the boarding beat at the jeep.
  if (showingStory) {
    return (
      <>
        <PrologueStory
          character={character}
          onFinish={() => {
            setShowingStory(false)
            setShowingIntro(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // After mission 1's explanation closes: the door opens, the player steps
  // outside. The last outside page ("make your way to the jeep terminal")
  // leads straight into the GoToTerminal(); challenge.
  if (doorOpen) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[OPEN_DOOR_PAGE, ...OUTSIDE_PAGES]}
          onFinish={() => {
            setDoorOpen(false)
            if (chapter === 0 && mission === 1) {
              onOpenMission(chapter, 2)
            } else {
              setFeedback({ ok: true, text: 'CORRECT! PROGRESS SAVED.' })
            }
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  if (showingJeep) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[JEEP_START_PAGE]}
          onFinish={() => setShowingJeep(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  if (showingSchoolGate) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[SCHOOL_GATE_PAGE, SCHOOL_GATE_SITUATION_PAGE]}
          onFinish={() => setShowingSchoolGate(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 1, mission 1: question 1 was right, so the Correct card plays
  // over the gate scene, then the syntax challenge.
  if (showingGateCorrect) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[SCHOOL_GATE_CHOICE_CORRECT_PAGE]}
          onFinish={() => {
            setShowingGateCorrect(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 2.1: mission 2 opens outside the classroom as the attendance kiosk
  // asks for the ID, then the syntax challenge appears.
  if (showingClassroom) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[
            CLASSROOM_ARRIVAL_PAGE,
            CLASSROOM_KIOSK_PAGE,
            CLASSROOM_PAGE,
            CLASSROOM_SITUATION_PAGE,
          ]}
          onFinish={() => setShowingClassroom(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Mission 2's Correct card appears after Understand the Core and before
  // the player continues to the next mission.
  if (showingClassroomCorrect) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CLASSROOM_CORRECT_PAGE]}
          onFinish={() => {
            setShowingClassroomCorrect(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Mission 2's kiosk confirms the attendance after the Correct card.
  if (showingClassroomAttendance) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CLASSROOM_ATTENDANCE_RECORDED_PAGE]}
          onFinish={() => {
            setShowingClassroomAttendance(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 3.1: mission 3 opens in the Programming Laboratory as the player
  // finds the assigned computer turned off, then the challenge appears.
  if (showingComputer) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[
            PROGRAMMING_LAB_ENTRY_PAGE,
            PROGRAMMING_LAB_PAGE,
            PROGRAMMING_LAB_SITUATION_PAGE,
          ]}
          onFinish={() => setShowingComputer(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Mission 3's Correct card appears after Understand the Core.
  if (showingProgrammingLabCorrect) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[PROGRAMMING_LAB_CORRECT_PAGE]}
          onFinish={() => {
            setShowingProgrammingLabCorrect(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 3.2: mission 4 opens with the computer notification, then the
  // programming exercise appears before the challenge.
  if (showingHomework) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[
            PROGRAMMING_LAB_NOTIFICATION_PAGE,
            HOMEWORK_PAGE,
            HOMEWORK_SITUATION_PAGE,
          ]}
          onFinish={() => setShowingHomework(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 4.2: mission 5 opens as the professor announces the readiness quiz,
  // then the syntax challenge appears.
  if (showingQuiz) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[QUIZ_ANNOUNCEMENT_PAGE, QUIZ_SITUATION_PAGE]}
          onFinish={() => setShowingQuiz(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 1's end: the journal entry, after mission 5's program flow.
  if (showingChapterComplete) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CHAPTER_COMPLETE_PAGE]}
          onFinish={() => {
            setShowingChapterComplete(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 1, mission 1: the syntax answer was right, so show the separate
  // explanation card before the guard welcomes the player.
  if (showingGateSyntaxCorrect) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[SCHOOL_GATE_SYNTAX_CORRECT_PAGE]}
          onFinish={() => {
            setShowingGateSyntaxCorrect(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 1.2: after mission 1's explanation, the guard welcomes the player.
  // The hallway video plays once the player taps through the story.
  if (showingWelcomeGate) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[WELCOME_GATE_PAGE]}
          onFinish={() => {
            setShowingWelcomeGate(false)
            setShowingAnimation(true)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Mission 4's Correct card appears after Understand the Core and before
  // the activity submission scene.
  if (showingHomeworkCorrect) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[HOMEWORK_CORRECT_PAGE]}
          onFinish={() => {
            setShowingHomeworkCorrect(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 4.1: after mission 4's explanation, the screen confirms the
  // activity was submitted before the next mission.
  if (showingSubmission) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[SUBMISSION_PAGE]}
          onFinish={() => {
            setShowingSubmission(false)
            advanceAfterSuccess()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Scene 5.1: after Chapter 2 unlocks, Professor Reyes closes the chapter
  // before the player returns to the chapter list.
  if (showingScene51) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[REYES_CLOSING_PAGE]}
          onFinish={() => {
            setShowingScene51(false)
            onChapter()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 1: mission 1 opens with Professor Reyes introducing the
  // laboratory activity on if...else before the challenge.
  if (showingCh2Scene1) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_SCENE1_PAGE]}
          onFinish={() => setShowingCh2Scene1(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 1.1: the purchase dialogue plays between mission 1's
  // structure question and its syntax challenge.
  if (showingCh2Scene11) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={CH2_PURCHASE_PAGES}
          onFinish={() => {
            setShowingCh2Scene11(false)
            setFeedback(null)
            applyAdvanceQuestion()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 1.2: after mission 1's explanation, the purchase finishes
  // before the next mission.
  if (showingCh2Scene12) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_PURCHASE_DONE_PAGE]}
          onFinish={() => {
            setShowingCh2Scene12(false)
            advanceAfterSuccess()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 2 opening: mission 2 opens with the connection situation
  // before the Wi-Fi coding challenge appears.
  if (showingCh2Scene2) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_WIFI_SETUP_PAGE]}
          onFinish={() => setShowingCh2Scene2(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 2: after mission 2's explanation, the Wi-Fi connects.
  if (showingCh2Scene21) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_WIFI_ON_PAGE]}
          onFinish={() => {
            setShowingCh2Scene21(false)
            advanceAfterSuccess()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 2.2: mission 3 opens as the player heads to the learning
  // portal before the login syntax challenge appears.
  if (showingCh2Scene22) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_PORTAL_LINE_PAGE]}
          onFinish={() => setShowingCh2Scene22(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 3.1: after mission 3's explanation, the portal opens.
  if (showingCh2Scene31) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_PORTAL_OPENED_PAGE]}
          onFinish={() => {
            setShowingCh2Scene31(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 4: the portal scene precedes Part 4's Situation card and
  // coding question. Because it belongs to the mission itself, it also plays
  // when the player opens Part 4 directly from the progress menu.
  if (showingCh2Scene4) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_UPLOAD_LINE_PAGE]}
          onFinish={() => {
            setShowingCh2Scene4(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 2, Scene 4: after mission 4's explanation, the submission is
  // accepted, then the professor challenges the player before mission 5.
  if (showingCh2Scene41) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_SUBMITTED_PAGE, ...CH2_REVIEW_PAGES]}
          onFinish={() => {
            setShowingCh2Scene41(false)
            advanceAfterSuccess()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  if (showingCh2Complete) {
    return (
      <PrologueStory
        character={character}
        pages={[CH2_COMPLETE_PAGE]}
        onFinish={() => {
          setShowingCh2Complete(false)
          setShowingCh2Scene51(true)
        }}
        onJournal={onJournal}
        onSettings={onSettings}
      />
    )
  }

  // Chapter 2, Scene 5.1: after the completion card, Professor Reyes closes the
  // chapter before the player returns to the chapter list.
  if (showingCh2Scene51) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={CH3_INTRO_PAGES}
          onFinish={() => {
            setShowingCh2Scene51(false)
            onChapter()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Part 1, Scene 3: opening the chapter shows Professor Reyes'
  // grading announcement before the situation card and first challenge.
  if (showingCh3Scene3) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH3_PART_ONE_SCENE_PAGE]}
          onFinish={() => setShowingCh3Scene3(false)}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Part 1, Scene 4: the player selects History in the learning
  // portal before the score-evaluation syntax challenge.
  if (showingCh3History) {
    return (
      <>
        <PrologueStory
          key="ch3-history"
          character={character}
          pages={[CH3_HISTORY_PAGE]}
          onFinish={() => {
            setShowingCh3History(false)
            setShowingCh3Situation(true)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Scene 1.2: Computer screen showing score "90"
  if (showingCh3Score) {
    return (
      <>
        <PrologueStory
          key="ch3-score"
          character={character}
          pages={[CH3_SCORE_PAGE]}
          onFinish={() => {
            setShowingCh3Score(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 2 Opening: Player greets scholarship staff, then staff responds
  if (showingCh3M2Opening) {
    return (
      <>
        <PrologueStory
          key="ch3-m2-opening"
          character={character}
          pages={[CH3_SCHOLARSHIP_GREETING_PAGE, CH3_SCHOLARSHIP_STAFF_PAGE]}
          onFinish={() => {
            setShowingCh3M2Opening(false)
            setShowingCh3M2Situation(true)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 2 Situation Card modal
  if (showingCh3M2Situation) {
    return (
      <>
        <PrologueStory
          key="ch3-m2-situation"
          character={character}
          pages={[CH3_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh3M2Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 2 Correct Card modal (image.png)
  if (showingCh3M2Correct) {
    return (
      <>
        <PrologueStory
          key="ch3-m2-correct"
          character={character}
          pages={[CH3_M2_CORRECT_CARD]}
          onFinish={() => {
            setShowingCh3M2Correct(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Scene 2.1: Staff says qualified (image copy.png)
  if (showingCh3M2Qualified) {
    return (
      <>
        <PrologueStory
          key="ch3-m2-qualified"
          character={character}
          pages={[CH3_M2_QUALIFIED_PAGE]}
          onFinish={() => {
            setShowingCh3M2Qualified(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Scene 2.2: Player thanks staff (image copy 2.png)
  if (showingCh3M2Thanks) {
    return (
      <>
        <PrologueStory
          key="ch3-m2-thanks"
          character={character}
          pages={[CH3_M2_THANKS_PAGE]}
          onFinish={() => {
            setShowingCh3M2Thanks(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 3 Opening: Wi-Fi check on retro monitor
  if (showingCh3M3Opening) {
    return (
      <>
        <PrologueStory
          key="ch3-m3-opening"
          character={character}
          pages={[CH3_M3_WIFI_PAGE]}
          onFinish={() => {
            setShowingCh3M3Opening(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 4 Opening: Professor announcement -> Activity submitted
  if (showingCh3M4Opening) {
    return (
      <>
        <PrologueStory
          key="ch3-m4-opening"
          character={character}
          pages={[CH3_M3_PROF_PAGE, CH3_M3_SUBMITTED_PAGE]}
          onFinish={() => {
            setShowingCh3M4Opening(false)
            setShowingCh3M4Situation(true)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 4 Situation Card modal
  if (showingCh3M4Situation) {
    return (
      <>
        <PrologueStory
          key="ch3-m4-situation"
          character={character}
          pages={[CH3_M3_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh3M4Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 3 Post-Flow Cutscene 1: Correct Card modal (image copy 3.png)
  if (showingCh3M3Correct) {
    return (
      <>
        <PrologueStory
          key="ch3-m3-correct"
          character={character}
          pages={[CH3_M3_CORRECT_CARD]}
          onFinish={() => {
            setShowingCh3M3Correct(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Mission 3 Post-Flow Cutscene 2: Gold Medal Screen (image copy 4.png)
  if (showingCh3M3Medal) {
    return (
      <>
        <PrologueStory
          key="ch3-m3-medal"
          character={character}
          pages={[CH3_M3_MEDAL_PAGE]}
          onFinish={() => {
            setShowingCh3M3Medal(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Part 4 Opening: Professor Reyes announcement -> Portal check
  if (showingCh3M5Opening) {
    return (
      <>
        <PrologueStory
          key="ch3-m5-opening"
          character={character}
          pages={[CH3_M4_PROF_PAGE, CH3_M4_PC_PAGE]}
          onFinish={() => {
            setShowingCh3M5Opening(false)
            setShowingCh3M5Situation(true)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3, Part 4 Situation Card modal
  if (showingCh3M5Situation) {
    return (
      <>
        <PrologueStory
          key="ch3-m5-situation"
          character={character}
          pages={[CH3_M4_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh3M5Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 3 Complete screen (media_1790090007943.png)
  if (showingCh3Complete) {
    return (
      <PrologueStory
        character={character}
        pages={[CH3_COMPLETE_PAGE]}
        onFinish={() => {
          setShowingCh3Complete(false)
          onJournal(3)
        }}
        onJournal={() => {
          setShowingCh3Complete(false)
          onJournal(3)
        }}
        onSettings={onSettings}
      />
    )
  }

  // Chapter 4 Intro: Professor Reyes at Campus Kiosk
  if (showingCh4Intro) {
    return (
      <>
        <PrologueStory
          key="ch4-intro"
          character={character}
          pages={CH4_INTRO_PAGES}
          onFinish={() => {
            setShowingCh4Intro(false)
            setShowingCh4Situation(true)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 1.1: Player at kiosk selecting schedule
  if (showingCh4Scene11) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-1-1"
          character={character}
          pages={[CH4_SCENE_1_1_PAGE]}
          onFinish={() => {
            setShowingCh4Scene11(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 1.2: Kiosk displays schedule
  if (showingCh4Scene12) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-1-2"
          character={character}
          pages={[CH4_SCENE_1_2_PAGE]}
          onFinish={() => {
            setShowingCh4Scene12(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 1.3: Enter Programming Lab
  if (showingCh4SceneEnterLab) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-enter-lab"
          character={character}
          pages={[CH4_SCENE_ENTER_LAB_PAGE]}
          onFinish={() => {
            setShowingCh4SceneEnterLab(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Mission 2 Situation Card
  if (showingCh4M2Situation) {
    return (
      <>
        <PrologueStory
          key="ch4-m2-situation"
          character={character}
          pages={[CH4_M2_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh4M2Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 2.1: Workstation PC-2 Assigned
  if (showingCh4Scene21) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-2-1"
          character={character}
          pages={[CH4_SCENE_2_1_PAGE]}
          onFinish={() => {
            setShowingCh4Scene21(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 2.2: Computer displays lab activities list
  if (showingCh4Scene22) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-2-2"
          character={character}
          pages={[CH4_SCENE_2_2_PAGE]}
          onFinish={() => {
            setShowingCh4Scene22(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Mission 3 Situation Card
  if (showingCh4M3Situation) {
    return (
      <>
        <PrologueStory
          key="ch4-m3-situation"
          character={character}
          pages={[CH4_M3_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh4M3Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 3.1: Workstation displays Control Structures Exercise
  if (showingCh4Scene31) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-3-1"
          character={character}
          pages={[CH4_SCENE_3_1_PAGE]}
          onFinish={() => {
            setShowingCh4Scene31(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 3.2: Select Destination
  if (showingCh4Scene32) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-3-2"
          character={character}
          pages={[CH4_SCENE_3_2_PAGE]}
          onFinish={() => {
            setShowingCh4Scene32(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Mission 4 Situation Card
  if (showingCh4M4Situation) {
    return (
      <>
        <PrologueStory
          key="ch4-m4-situation"
          character={character}
          pages={[CH4_M4_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh4M4Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 4.1: Night Library Room
  if (showingCh4Scene41) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-4-1"
          character={character}
          pages={[CH4_SCENE_4_1_PAGE]}
          onFinish={() => {
            setShowingCh4Scene41(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Scene 4.2: Professor Reyes gives final challenge
  if (showingCh4Scene42) {
    return (
      <>
        <PrologueStory
          key="ch4-scene-4-2"
          character={character}
          pages={[CH4_SCENE_4_2_PAGE]}
          onFinish={() => {
            setShowingCh4Scene42(false)
            continueFromScene()
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Mission 5 Situation Card
  if (showingCh4M5Situation) {
    return (
      <>
        <PrologueStory
          key="ch4-m5-situation"
          character={character}
          pages={[CH4_M5_SITUATION_PAGE]}
          onFinish={() => {
            setShowingCh4M5Situation(false)
          }}
          onJournal={onJournal}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  // Chapter 4 Complete card
  if (showingCh4Complete) {
    return (
      <PrologueStory
        character={character}
        pages={[CH4_COMPLETE_PAGE]}
        onFinish={() => {
          setShowingCh4Complete(false)
          setShowingCh4Closing(true)
        }}
        onJournal={() => {
          setShowingCh4Complete(false)
          onJournal(4)
        }}
        onSettings={onSettings}
      />
    )
  }

  // Chapter 4 Closing dialogue
  if (showingCh4Closing) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH4_CLOSING_PAGE]}
          onFinish={() => {
            setShowingCh4Closing(false)
            const nextChapter = progress?.chapters.find((c) => c.id === 5)
            if (nextChapter?.unlocked) {
              setUnlockChapter(5)
            } else {
              onJournal(4)
            }
          }}
          onJournal={() => {
            setShowingCh4Closing(false)
            onJournal(4)
          }}
          onSettings={onSettings}
        />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
      </>
    )
  }

  if (showingIntro) {
    return (
      <PostSelectWelcome
        character={character}
        onContinue={() => setShowingStory(true)}
      />
    )
  }

  const chapterStatus = progress?.chapters.find((c) => c.id === chapter)
  const missionStatus = chapterStatus?.missions.find(
    (m) => m.number === mission,
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (
      submittingRef.current ||
      answer.trim().length === 0 ||
      !missionStatus?.unlocked
    ) {
      return
    }
    submittingRef.current = true
    setChecking(true)
    setFeedback(null)
    setServerError(null)
    try {
      const result = await submitAnswer(
        chapter,
        mission,
        answer,
        questionNumber,
      )
      if (result.correct) {
        setMistakes([])
        setWrongChoiceIndex(null)
        setAcceptedAnswer(answer)
        setAnswer('')
        await refreshProgress()
        // A replay of a cleared mission plays the same explanation, scenes
        // and questions as the first time.
        beginPostCorrect()
      } else {
        setMistakes(result.mistakes)
        const matchedIndex = currentQuestion?.choices
          ? findMatchingChoiceIndex(currentQuestion.choices, answer)
          : -1
        setWrongChoiceIndex(matchedIndex >= 0 ? matchedIndex : null)
        setFeedback({
          ok: false,
          text: 'SYNTAX ERROR: CHECK THE HIGHLIGHTED PART OF YOUR CODE AND TRY AGAIN. THE PROGRAM WILL NOT EXECUTE UNTIL THE CORRECT SYNTAX IS ENTERED.',
        })
      }
    } catch (err) {
      // The session ended: back to Login, like the progress checks above.
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
        return
      }
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      submittingRef.current = false
      setChecking(false)
    }
  }

  // Typing by hand resets the old highlight state.
  const changeAnswer = (value: string): void => {
    setAnswer(value)
    setMistakes([])
    setWrongChoiceIndex(null)
    setFeedback(null)
  }

  // The player closes the explanation after a correct answer: whatever comes
  // next plays right away (a scene, the next question, or the next mission).
  const closeCore = (): void => {
    setShowCore(false)
    playNextStep(steps)
  }

  if (serverError) {
    return (
      <div className="mission-screen">
        <GameTopBar onJournal={onJournal} onSettings={onSettings} />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
        <div className="mission-content">
          <h2 className="mission-header">MISSION {mission}</h2>
          <p className="mission-feedback wrong">{serverError}</p>
        </div>
      </div>
    )
  }

  if (!missionStatus) {
    return (
      <div className="mission-screen">
        <GameTopBar onJournal={onJournal} onSettings={onSettings} />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
        <div className="mission-content">
          <h2 className="mission-header">
            {chapterLabel(chapter)} – MISSION {mission}
          </h2>
          <p className="mission-empty">
            NO MISSIONS HERE YET. THIS CHAPTER'S CONTENT IS COMING SOON.
          </p>
        </div>
      </div>
    )
  }

  if (!missionStatus.unlocked) {
    return (
      <div className="mission-screen">
        <GameTopBar onJournal={onJournal} onSettings={onSettings} />
        <TaskBar
          chapter={chapter}
          progress={progress}
          currentMission={mission}
          onOpenMission={onOpenMission}
        />
        <div className="mission-content">
          <h2 className="mission-header">
            {chapterLabel(chapter)} – MISSION {mission}
          </h2>
          <p className="mission-empty">THIS MISSION IS STILL LOCKED.</p>
        </div>
      </div>
    )
  }

  const cleared = missionStatus.completed || solved
  // The continue buttons only show on a replay before it's answered, or
  // after a correct answer on a level with no explanation to show. Otherwise
  // the explanation's OK button moves the player on by itself.
  const showContinue =
    cleared && steps.length === 0 && !showCore && unlockChapter === null

  // Mission 3 (scene 2.2): the login PC is shown while the challenge is open,
  // and switches to the logged-in screen once the correct answer is done.
  const effectiveSceneBg =
    chapter === 2 && mission === 3
      ? cleared
        ? loggedInImg
        : loginPcImg
      : sceneBg

  return (
    <div
      className={[
        'mission-screen',
        effectiveSceneBg ? 'mission-scene-bg' : '',
        chapter === 2 ? 'chapter-two-mission' : '',
        chapter === 3 ? 'chapter-three-mission' : '',
        chapter === 4 ? 'chapter-four-mission' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {effectiveSceneBg && (
        <img className="mission-scene" src={effectiveSceneBg} alt="" />
      )}
      {chapter === 1 && sceneBg && mission === 1 && (
        <>
          <img className="mission-guard" src={guardImg} alt="" />
          <img
            className="mission-avatar"
            src={character === 'girl' ? girlImg : boyImg}
            alt=""
          />
        </>
      )}
      {chapter === 3 && sceneBg && mission === 1 && (
        <>
          <img
            className="chapter-three-computer"
            src={chapterThreeComputerImg}
            alt=""
          />
          <img
            className="chapter-three-avatar"
            src={character === 'girl' ? girlImg : boyImg}
            alt=""
          />
        </>
      )}
      {chapter === 3 && sceneBg && mission === 2 && (
        <>
          <img
            className="chapter-three-staff"
            src={chapterThreeStaffImg}
            alt="Scholarship Staff"
          />
          <img
            className="chapter-three-avatar chapter-three-avatar-m2"
            src={character === 'girl' ? girlImg : boyImg}
            alt=""
          />
        </>
      )}
      {chapter === 4 && sceneBg && mission === 1 && (
        <>
          <img
            className="chapter-four-kiosk"
            src={ch4KioskBeginImg}
            alt="Campus Kiosk"
          />
          <img
            className="chapter-four-avatar"
            src={character === 'girl' ? girlImg : boyImg}
            alt=""
          />
        </>
      )}
      {chapter === 4 && sceneBg && mission > 1 && (
        <img
          className="chapter-four-avatar chapter-four-avatar-lab"
          src={character === 'girl' ? girlImg : boyImg}
          alt=""
        />
      )}
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />
      <TaskBar
        chapter={chapter}
        progress={progress}
        currentMission={mission}
        currentQuestion={questionNumber}
        totalQuestions={lesson?.questions?.length}
        onOpenMission={onOpenMission}
      />
      <div className="mission-content">
        {currentQuestion ? (
          showingCh2Situation && lesson ? (
            <section
              className="chapter-two-situation"
              aria-labelledby="chapter-two-situation-title"
            >
              <h2 id="chapter-two-situation-title">SITUATION</h2>
              <p>{lesson.story}</p>
              <button
                type="button"
                className="pixel-button chapter-two-situation-next"
                onClick={() => setShowingCh2Situation(false)}
              >
                NEXT
              </button>
            </section>
          ) : showingCh3Situation && lesson ? (
            <section
              className="chapter-three-situation"
              aria-labelledby="chapter-three-situation-title"
            >
              <h2 id="chapter-three-situation-title">SITUATION</h2>
              <p>{currentQuestion?.situation ?? lesson.story}</p>
              <button
                type="button"
                className="pixel-button chapter-three-situation-next"
                onClick={() => setShowingCh3Situation(false)}
              >
                NEXT
              </button>
            </section>
          ) : showingCh4Situation && lesson ? (
            <section
              className="chapter-four-situation"
              aria-labelledby="chapter-four-situation-title"
            >
              <h2 id="chapter-four-situation-title">SITUATION</h2>
              <p>{currentQuestion?.situation ?? lesson.story}</p>
              <button
                type="button"
                className="pixel-button chapter-four-situation-next"
                onClick={() => setShowingCh4Situation(false)}
              >
                NEXT
              </button>
            </section>
          ) : (
            <div
              className={`mission-challenge ${
                mistakes.length > 0 ? 'mission-challenge-error' : ''
              }`}
            >
              {lesson?.questions && lesson.questions.length > 1 && (
                <div className="mission-challenge-badge-row">
                  <span className="mission-challenge-badge">
                    PART {mission} · QUESTION {questionNumber} OF{' '}
                    {lesson.questions.length}
                  </span>
                </div>
              )}
              <p className="mission-challenge-prompt">
                {currentQuestion.prompt}
              </p>
              {currentQuestion.choices && (
                <div
                  className="mission-choices"
                  aria-label="Possible answers - type one below"
                >
                  {currentQuestion.choices.map((choice, i) => (
                    <span
                      key={i}
                      className={`mission-choice mission-choice-hint ${
                        wrongChoiceIndex === i ? 'mission-choice-wrong' : ''
                      }`}
                    >
                      {choice}
                    </span>
                  ))}
                </div>
              )}
              <form className="mission-form" onSubmit={handleSubmit}>
                <div className="mission-code-zone">
                  <textarea
                    className={[
                      'mission-input',
                      mistakes.length > 0 ? 'highlighted' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={answer}
                    onChange={(e) => changeAnswer(e.target.value)}
                    onFocus={() => {
                      if (mistakes.length > 0) {
                        setMistakes([])
                        setWrongChoiceIndex(null)
                      }
                    }}
                    onClick={() => {
                      if (mistakes.length > 0) {
                        setMistakes([])
                        setWrongChoiceIndex(null)
                      }
                    }}
                    aria-label="Type your answer"
                    onScroll={(event) => {
                      if (answerOverlay.current) {
                        answerOverlay.current.scrollTop =
                            event.currentTarget.scrollTop
                        answerOverlay.current.scrollLeft =
                            event.currentTarget.scrollLeft
                      }
                    }}
                    placeholder="TYPE HERE"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={checking}
                    rows={
                      chapter === 4
                        ? mission === 1 && questionNumber === 1
                          ? 2
                          : mission === 5
                          ? 16
                          : 10
                        : chapter === 3 && mission === 5
                        ? 14
                        : (chapter === 2 &&
                            !(mission === 1 && questionNumber === 1)) ||
                          (chapter === 3 && mission === 1 && questionNumber === 2) ||
                          (chapter === 3 && mission === 2) ||
                          (chapter === 3 && mission === 3) ||
                          (chapter === 3 && mission === 4)
                        ? 9
                        : 2
                    }
                  />
                  {mistakes.length > 0 && (
                    <span
                      ref={answerOverlay}
                      className="mission-code-overlay"
                      aria-hidden="true"
                    >
                      <MistakeHighlight answer={answer} mistakes={mistakes} />
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="pixel-button mission-execute"
                  disabled={checking || !missionStatus.unlocked}
                >
                  {checking ? 'CHECKING…' : 'EXECUTE'}
                </button>
              </form>
            </div>
          )
        ) : (
          <div className="mission-hint">
            <p className="mission-hint-label">MISSION CONTENT</p>
            <p className="mission-hint-body">Coming soon…</p>
          </div>
        )}

        {feedback && (
          <p
            className={`mission-feedback ${feedback.ok ? 'correct' : 'wrong'}`}
          >
            {feedback.text}
          </p>
        )}

        {showContinue && nextMission !== null && (
          <button
            type="button"
            className="pixel-button mission-next"
            onClick={() => onOpenMission(chapter, nextMission)}
          >
            NEXT MISSION →
          </button>
        )}

        {showContinue && nextMission === null && (
          <button
            type="button"
            className="pixel-button mission-next"
            onClick={finishChapter}
          >
            CHAPTER CLEARED ✓ GO TO CHAPTERS
          </button>
        )}
      </div>

      {showCore && chapter === 2 && lesson && (
        <ChapterTwoFeedback
          key={questionNumber}
          lesson={lesson}
          answer={acceptedAnswer}
          onContinue={closeCore}
        />
      )}

      {showCore && chapter === 3 && lesson && (
        <ChapterThreeFeedback
          key={questionNumber}
          lesson={lesson}
          question={questionNumber}
          onContinue={closeCore}
        />
      )}

      {showCore && chapter === 4 && lesson && (
        <ChapterFourFeedback
          key={questionNumber}
          lesson={lesson}
          question={questionNumber}
          onContinue={closeCore}
        />
      )}

      {showCore &&
        chapter !== 2 &&
        chapter !== 3 &&
        chapter !== 4 &&
        lesson?.workflow && (
          <CodeWorkflow
            code={acceptedAnswer}
            workflow={lesson.workflow}
            onClose={closeCore}
          />
        )}

      {showCore &&
        chapter !== 2 &&
        chapter !== 3 &&
        chapter !== 4 &&
        !lesson?.workflow &&
        lesson?.programFlow && (
          <ProgramFlow
            code={acceptedAnswer}
            flow={lesson.programFlow}
            onClose={closeCore}
          />
        )}

      {showCore &&
        chapter !== 2 &&
        chapter !== 3 &&
        chapter !== 4 &&
        !lesson?.workflow &&
        lesson?.programFlow === undefined &&
        lesson?.core && (
          <CoreBreakdown
            code={acceptedAnswer}
            core={lesson.core}
            onClose={closeCore}
          />
        )}

      {showingAnimation && (
        <SakayAnimation
          girl={character === 'girl'}
          onFinish={closeAnimation}
          videoSrc={chapter === 1 ? boyHallwayVideo : undefined}
          videoSrcGirl={chapter === 1 ? girlHallwayVideo : undefined}
        />
      )}

      {unlockChapter !== null && (
        <LevelUnlock
          chapter={chapter}
          onContinue={() => {
            setUnlockChapter(null)
            onChapter()
          }}
        />
      )}
    </div>
  )
}

export default MissionScreen
