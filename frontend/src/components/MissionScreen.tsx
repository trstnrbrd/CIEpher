import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  getProgress,
  submitAnswer,
  type Character,
  type Progress,
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
  CH2_CLOSING_PAGE,
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
import boyHallwayVideo from '../chapter1/boy_hallway.mp4'
import girlHallwayVideo from '../chapter1/girl_hallway.mp4'
import boyImg from '../assets/boy.webp'
import girlImg from '../assets/girl.webp'
import CodeWorkflow from './CodeWorkflow'
import CoreBreakdown from './CoreBreakdown'
import ProgramFlow from './ProgramFlow'
import CodeExplained from './CodeExplained'
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
  onJournal: () => void
  onSettings: () => void
}

function chapterLabel(id: number): string {
  return id === 0 ? 'PROLOGUE' : `CHAPTER ${id}`
}

// Character diff against the lesson's code: every position that reads
// differently glows red, as does any extra text past the end. A too-short
// answer also flags that the tail is missing.
function highlightDiff(
  typed: string,
  code: string,
): {
  wrong: number[]
  missing: boolean
} {
  const wrong: number[] = []
  const common = Math.min(typed.length, code.length)
  for (let i = 0; i < common; i++) {
    if (typed[i] !== code[i]) wrong.push(i)
  }
  for (let i = code.length; i < typed.length; i++) wrong.push(i)
  return { wrong, missing: typed.length < code.length }
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
  // Chapter 2, Scene 3.2: after the portal opens, the player needs to upload
  // today's activity before mission 4.
  const [showingCh2Scene32, setShowingCh2Scene32] = useState<boolean>(false)
  // Chapter 2, Scene 4: the submission is accepted, then the professor
  // challenges the player before mission 5.
  const [showingCh2Scene41, setShowingCh2Scene41] = useState<boolean>(false)
  // Chapter 2, Scene 5.1: after the chapter unlocks, Professor Reyes closes
  // the chapter before the player returns to the chapter list.
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
  const [wrongChars, setWrongChars] = useState<number[]>([])
  const [missingTail, setMissingTail] = useState<boolean>(false)
  const [wrongChoiceIndex, setWrongChoiceIndex] = useState<number | null>(null)
  // The "UNDERSTAND THE CORE" screen shows after a correct answer, before
  // the green CORRECT! message.
  const [showCore, setShowCore] = useState<boolean>(false)
  // Multi-question missions: track which question we're on (1-indexed). A
  // session hint resumes the same question after a refresh; otherwise the
  // mission starts from question 1.
  const [questionNumber, setQuestionNumber] = useState<number>(() =>
    readQuestionHint(chapter, mission, lesson?.questions?.length ?? 1),
  )
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
        code: lesson.code,
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
      case 'scene32':
        setShowingCh2Scene32(true)
        break
      case 'scene41':
        setShowingCh2Scene41(true)
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
    setSolved(false)
    setSteps([])
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

  // Chapter 2, Scene 3.2: the player heads to the portal's upload page before
  // mission 4.
  if (showingCh2Scene32) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_UPLOAD_LINE_PAGE]}
          onFinish={() => {
            setShowingCh2Scene32(false)
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

  // Chapter 2, Scene 5.1: after Chapter 3 unlocks, Professor Reyes closes the
  // chapter before the player returns to the chapter list.
  if (showingCh2Scene51) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_CLOSING_PAGE]}
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
      const { correct } = await submitAnswer(
        chapter,
        mission,
        answer,
        questionNumber,
      )
      if (correct) {
        setWrongChars([])
        setMissingTail(false)
        setWrongChoiceIndex(null)
        setAnswer('')
        await refreshProgress()
        // A replay of a cleared mission plays the same explanation, scenes
        // and questions as the first time.
        beginPostCorrect()
      } else if (currentQuestion?.choices) {
        // A wrong syntax: mark the offending characters red and tell the
        // player none of it ran. The player typed it, so the red overlay
        // shows exactly which characters are wrong.
        const targetCode = currentQuestion.code
        const { wrong, missing } = highlightDiff(answer, targetCode)
        setWrongChars(wrong)
        setMissingTail(missing)
        // Spacing and line breaks don't matter to the checker, so the
        // choice turns red whatever way the player typed it out.
        const same = (text: string): string => text.replace(/\s+/g, '')
        const typedChoice = currentQuestion.choices.findIndex(
          (choice) => same(choice) === same(answer),
        )
        setWrongChoiceIndex(typedChoice === -1 ? null : typedChoice)
        setFeedback({
          ok: false,
          text: 'SYNTAX ERROR: CHECK THE HIGHLIGHTED PART OF YOUR CODE AND TRY AGAIN. THE PROGRAM WILL NOT EXECUTE UNTIL THE CORRECT SYNTAX IS ENTERED.',
        })
      } else {
        setFeedback({
          ok: false,
          text: 'WRONG ANSWER. TRY AGAIN.',
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
    setWrongChars([])
    setMissingTail(false)
    setWrongChoiceIndex(null)
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
      className={['mission-screen', effectiveSceneBg ? 'mission-scene-bg' : '']
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
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />
      <TaskBar
        chapter={chapter}
        progress={progress}
        currentMission={mission}
        onOpenMission={onOpenMission}
      />
      <div className="mission-content">
        {currentQuestion ? (
          <div className="mission-challenge">
            <p className="mission-challenge-prompt">{currentQuestion.prompt}</p>
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
                    wrongChars.length > 0 || missingTail ? 'highlighted' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  value={answer}
                  onChange={(e) => changeAnswer(e.target.value)}
                  placeholder="TYPE HERE"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={checking}
                  rows={2}
                />
                {(wrongChars.length > 0 || missingTail) && (
                  <span className="mission-code-overlay" aria-hidden="true">
                    {Array.from(answer).map((ch, i) => (
                      <span
                        key={i}
                        className={wrongChars.includes(i) ? 'hl-red' : ''}
                      >
                        {ch}
                      </span>
                    ))}
                    {missingTail && <span className="hl-red hl-caret">_</span>}
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

      {showCore && lesson?.workflow && (
        <CodeWorkflow
          code={lesson.code}
          workflow={lesson.workflow}
          onClose={closeCore}
        />
      )}

      {showCore && !lesson?.workflow && lesson?.programFlow && (
        <ProgramFlow
          code={lesson.code}
          flow={lesson.programFlow}
          onClose={closeCore}
        />
      )}

      {showCore &&
        !lesson?.workflow &&
        lesson?.programFlow === undefined &&
        lesson?.core && (
        <CoreBreakdown
          code={lesson.code}
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

      {unlockChapter !== null &&
        (chapter === 2 ? (
          // Finishing Chapter 2 opens Chapter 3 with the "THE CODE EXPLAINED"
          // recap of the if/else statement, in place of the celebration.
          // (Chapter 1 shows its own chapter-complete card instead.)
          <CodeExplained
            chapter={chapter}
            onJournal={onJournal}
            onContinue={() => {
              setUnlockChapter(null)
              setShowingCh2Scene51(true)
            }}
          />
        ) : (
          <LevelUnlock
            chapter={chapter}
            onContinue={() => {
              setUnlockChapter(null)
              onChapter()
            }}
          />
        ))}
    </div>
  )
}

export default MissionScreen
