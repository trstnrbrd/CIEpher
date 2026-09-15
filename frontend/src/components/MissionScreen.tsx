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
  CLASSROOM_PAGE,
  HOMEWORK_PAGE,
  JEEP_START_PAGE,
  OPEN_DOOR_PAGE,
  OUTSIDE_PAGES,
  PROGRAMMING_LAB_PAGE,
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
        // Multi-question missions: advance to the next question first.
        const totalQuestions = lesson?.questions?.length ?? 1
        if (questionNumber < totalQuestions) {
          setQuestionNumber((n) => n + 1)
          setChecking(false)
          return
        }
        if (lesson?.core) {
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
      className={['mission-screen', lesson?.sceneBg ? 'mission-scene-bg' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {lesson?.sceneBg && (
        <img className="mission-scene" src={lesson.sceneBg} alt="" />
      )}
      {chapter === 1 && lesson?.sceneBg && mission === 1 && (
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

      {showCore && lesson?.core && (
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
