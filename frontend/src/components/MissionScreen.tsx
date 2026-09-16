import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  getProgress,
  submitAnswer,
  type Character,
  type Progress,
} from '../api/client'
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
  CLASSROOM_PAGE,
  HOMEWORK_PAGE,
  JEEP_START_PAGE,
  OPEN_DOOR_PAGE,
  OUTSIDE_PAGES,
  PROGRAMMING_LAB_PAGE,
  QUIZ_ANNOUNCEMENT_PAGE,
  REYES_CLOSING_PAGE,
  SCHOOL_GATE_PAGE,
  SUBMISSION_PAGE,
  WELCOME_GATE_PAGE,
} from '../storyPages'
import guardImg from '../chapter1/guard.png'
import boyHallwayVideo from '../chapter1/boy_hallway.mp4'
import girlHallwayVideo from '../chapter1/girl_hallway.mp4'
import boyImg from '../assets/boy.png'
import girlImg from '../assets/girl.png'
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
  // Chapter 1, scene 1.2: after mission 1's explanation, the guard welcomes
  // the player and the hallway video plays into the university.
  const [showingWelcomeGate, setShowingWelcomeGate] = useState<boolean>(false)
  // Chapter 1, scene 2.1: mission 2 opens outside the classroom as the
  // attendance kiosk asks the player to scan their ID.
  const [showingClassroom, setShowingClassroom] = useState<boolean>(
    chapter === 1 && mission === 2,
  )
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
  // Chapter 1, scene 4.1: after mission 4's explanation, the screen confirms
  // the activity was submitted before moving on.
  const [showingSubmission, setShowingSubmission] = useState<boolean>(false)
  // Chapter 1, scene 4.2: mission 5 opens as the professor announces the
  // readiness quiz before the challenge.
  const [showingQuiz, setShowingQuiz] = useState<boolean>(
    chapter === 1 && mission === 5,
  )
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
  // Chapter 2, Scene 3: the portal opens, then the player needs to upload.
  const [showingCh2Scene31, setShowingCh2Scene31] = useState<boolean>(false)
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
  // Multi-question missions: track which question we're on (1-indexed).
  const [questionNumber, setQuestionNumber] = useState<number>(1)
  // The "sakay" animation plays after the last prologue puzzle (mission 3).
  const [showingAnimation, setShowingAnimation] = useState<boolean>(false)
  // When the last mission of a chapter is cleared, a celebration shows the
  // next level unlocking before the player returns to the chapter list.
  // Holds the chapter id being unlocked (the one after the current one).
  const [unlockChapter, setUnlockChapter] = useState<number | null>(null)

  const refreshProgress = async (): Promise<void> => {
    try {
      const p = await getProgress()
      setProgress(p)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
      }
    }
  }

  // Resolve the current question's prompt/choices/code for multi-question
  // missions. Falls back to the lesson-level single question fields.
  const currentQuestion = (() => {
    if (lesson?.questions) {
      return lesson.questions[questionNumber - 1] ?? null
    }
    if (lesson?.prompt) {
      return { prompt: lesson.prompt, choices: lesson.choices, code: lesson.code }
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
        if (active) setProgress(p)
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
  }, [onUnauthorized])

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
          pages={[SCHOOL_GATE_PAGE]}
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

  // Scene 2.1: mission 2 opens outside the classroom as the attendance kiosk
  // asks for the ID, then the syntax challenge appears.
  if (showingClassroom) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CLASSROOM_PAGE]}
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

  // Scene 3.1: mission 3 opens in the Programming Laboratory as the player
  // finds the assigned computer turned off, then the challenge appears.
  if (showingComputer) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[PROGRAMMING_LAB_PAGE]}
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

  // Scene 3.2: mission 4 opens in the professor's classroom as the exercise
  // and notification appear, then the challenge appears.
  if (showingHomework) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[HOMEWORK_PAGE]}
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
          pages={[QUIZ_ANNOUNCEMENT_PAGE]}
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
            setQuestionNumber(2)
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

  // Chapter 2, Scene 2: after mission 2's explanation, the Wi-Fi connects,
  // then the player heads to the learning portal for mission 3.
  if (showingCh2Scene21) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_WIFI_ON_PAGE, CH2_PORTAL_LINE_PAGE]}
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

  // Chapter 2, Scene 3: after mission 3's explanation, the portal opens, then
  // the player needs to upload today's activity for mission 4.
  if (showingCh2Scene31) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[CH2_PORTAL_OPENED_PAGE, CH2_UPLOAD_LINE_PAGE]}
          onFinish={() => {
            setShowingCh2Scene31(false)
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
    if (checking || answer.trim().length === 0 || !missionStatus?.unlocked) {
      return
    }
    setChecking(true)
    setFeedback(null)
    setServerError(null)
    try {
      const { correct } = await submitAnswer(chapter, mission, answer, questionNumber)
      if (correct) {
        setWrongChars([])
        setMissingTail(false)
        setWrongChoiceIndex(null)
        setAnswer('')
        await refreshProgress()
        // Chapter 2, mission 1: both questions show the "UNDERSTAND THE CORE"
        // explanation right after a correct answer. The purchase dialogue
        // (Scene 1.1) plays after the first explanation, and Scene 1.2 after
        // the second, so the question index is not advanced here.
        if (
          chapter === 2 &&
          mission === 1 &&
          (lesson?.core || lesson?.programFlow)
        ) {
          setShowCore(true)
          setChecking(false)
          return
        }
        // Multi-question missions: advance to the next question first.
        const totalQuestions = lesson?.questions?.length ?? 1
        if (questionNumber < totalQuestions) {
          setQuestionNumber((n) => n + 1)
          setChecking(false)
          return
        }
        if (lesson?.core || lesson?.programFlow) {
          // The learning screen (program flow / explanation) always plays
          // right after a correct answer. Any location change waits until
          // the player closes it.
          setShowCore(true)
        } else {
          setFeedback({
            ok: true,
            text: 'CORRECT! PROGRESS SAVED.',
          })
        }
      } else if (currentQuestion?.choices) {
        // A wrong syntax: mark the offending characters red and tell the
        // player none of it ran. The player typed it, so the red overlay
        // shows exactly which characters are wrong.
        const targetCode = currentQuestion.code
        const { wrong, missing } = highlightDiff(answer, targetCode)
        setWrongChars(wrong)
        setMissingTail(missing)
        const typedChoice = currentQuestion.choices.findIndex(
          (choice) => choice.trim() === answer.trim(),
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

  // The player finished the learning screen. The location only changes after
  // the explanation: mission 1's door swings open and the player goes outside
  // before the CORRECT! message; mission 3 plays the sakay animation; the
  // other missions just celebrate.
  const closeCore = (): void => {
    setShowCore(false)
    if (chapter === 0 && mission === 1) {
      setDoorOpen(true)
    } else if (chapter === 0 && mission === 3) {
      setShowingAnimation(true)
    } else if (chapter === 1 && mission === 1) {
      // Scene 1.2: the guard welcomes the player into the university, then the
      // hallway video plays before the next mission.
      setShowingWelcomeGate(true)
    } else if (chapter === 1 && mission === 4) {
      // Scene 4.1: the submission confirmation plays before the next mission.
      setShowingSubmission(true)
    } else if (chapter === 1 && mission === 5) {
      // Mission 5 is the readiness quiz: after its program flow, the result
      // shows and the CHAPTER CLEARED button leads to the chapter unlock.
      setFeedback({ ok: true, text: 'CORRECT! PROGRESS SAVED.' })
    } else if (chapter === 2 && mission === 1) {
      // The OK closes straight into the flow: mission 1's first question
      // moves directly to its syntax challenge, and the second question's
      // OK advances straight to the next mission. The purchase dialogue
      // (Scenes 1.1/1.2) no longer plays between them.
      if (questionNumber === 1) {
        setQuestionNumber(2)
      } else {
        advanceAfterSuccess()
      }
    } else if (chapter === 2 && mission === 2) {
      // Scene 2.1: Wi-Fi connects, then the player heads to the portal.
      setShowingCh2Scene21(true)
    } else if (chapter === 2 && mission === 3) {
      // Scene 3.1: the portal opens, then the player needs to upload.
      setShowingCh2Scene31(true)
    } else if (chapter === 2 && mission === 4) {
      // Scene 4.1: the submission is accepted, then the professor challenges
      // the player before mission 5.
      setShowingCh2Scene41(true)
    } else if (chapter === 2 && mission === 5) {
      // Mission 5 ends the chapter: after its explanation, the result shows
      // and the CHAPTER CLEARED button leads to the chapter unlock.
      setFeedback({ ok: true, text: 'CORRECT! PROGRESS SAVED.' })
    } else {
      advanceAfterSuccess()
    }
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
    const nextChapter = progress?.chapters.find(
      (c) => c.id === chapter + 1,
    )
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

  const done = missionStatus.completed || feedback?.ok === true

  return (
    <div
      className={['mission-screen', sceneBg ? 'mission-scene-bg' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {sceneBg && <img className="mission-scene" src={sceneBg} alt="" />}
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

        {done && nextMission !== null && (
          <button
            type="button"
            className="pixel-button mission-next"
            onClick={() => onOpenMission(chapter, nextMission)}
          >
            NEXT MISSION →
          </button>
        )}

        {done && nextMission === null && (
          <button
            type="button"
            className="pixel-button mission-next"
            onClick={finishChapter}
          >
            CHAPTER CLEARED ✓ GO TO CHAPTERS
          </button>
        )}
      </div>

      {showCore && lesson?.programFlow && (
        <ProgramFlow
          code={lesson.code}
          flow={lesson.programFlow}
          onClose={closeCore}
        />
      )}

      {showCore && lesson?.programFlow === undefined && lesson?.core && (
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

      {unlockChapter !== null && (
        chapter === 1 || chapter === 2 ? (
          // Finishing Chapter 1 opens Chapter 2 with the "THE CODE EXPLAINED"
          // recap of the if statement; finishing Chapter 2 opens Chapter 3 with
          // the if/else recap. Both replace the generic celebration.
          <CodeExplained
            chapter={chapter}
            onJournal={onJournal}
            onContinue={() => {
              setUnlockChapter(null)
              if (chapter === 1) {
                setShowingScene51(true)
              } else {
                setShowingCh2Scene51(true)
              }
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
