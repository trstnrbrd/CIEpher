import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  getProgress,
  submitAnswer,
  type Character,
  type Progress,
} from '../api/client'
import GameNav from './GameNav'
import GameTopBar from './GameTopBar'
import PostSelectWelcome from './PostSelectWelcome'
import PrologueStory from './PrologueStory'
import {
  OPEN_DOOR_PAGE,
  OUTSIDE_PAGES,
  TERMINAL_START_PAGE,
} from '../storyPages'
import CoreBreakdown from './CoreBreakdown'
import TaskBar from './TaskBar'
import { getLesson } from '../lessons'
import './MissionScreen.css'

interface MissionScreenProps {
  chapter: number
  mission: number
  character: Character
  onBack: () => void
  onChapter: () => void
  // The EXIT button (asks "Log out?" first).
  onExit: () => void
  // The session ended (401): straight back to Login, nothing to ask.
  onUnauthorized: () => void
  onOpenMission: (chapter: number, mission: number) => void
  onJournal: () => void
  onSettings: () => void
}

function chapterLabel(id: number): string {
  return id === 0 ? 'PROLOGUE' : `CHAPTER ${id}`
}

// Matches the server's answer rules for coloring: spacing never matters,
// curly quotes from phone keyboards count as plain ones, capitals do.
function normalizeSyntax(s: string): string {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, '')
}

// Which hint choice the typed answer looks like, or null if it matches none.
function matchingChoice(
  answer: string,
  choices: string[],
): number | null {
  const normalized = normalizeSyntax(answer)
  for (let i = 0; i < choices.length; i++) {
    if (normalizeSyntax(choices[i]) === normalized) return i
  }
  return null
}

// Character diff against the lesson's code: every position that reads
// differently glows red, as does any extra text past the end. A too-short
// answer also flags that the tail is missing.
function highlightDiff(typed: string, code: string): {
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
  onBack,
  onChapter,
  onExit,
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
  // Mission 2 opens at the jeepney terminal: a short arrival beat before the
  // GoToTerminal(); exercise. Mission 1 opens with its own story instead.
  const [showingTerminal, setShowingTerminal] = useState<boolean>(
    chapter === 0 && mission === 2,
  )
  // After mission 1's answer is accepted, the door swings open (bedroom,
  // then outside) before the "UNDERSTAND THE CORE" recap.
  const [doorOpen, setDoorOpen] = useState<boolean>(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [answer, setAnswer] = useState('')
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  )
  const [serverError, setServerError] = useState<string | null>(null)
  // The coding challenge (from the lesson data): which hint is selected,
  // which one turned green/red, where the typed code is wrong, and whether
  // the wrong answer was cut short.
  const lesson = getLesson(chapter, mission)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [choiceOk, setChoiceOk] = useState<number | null>(null)
  const [choiceBad, setChoiceBad] = useState<number | null>(null)
  const [wrongChars, setWrongChars] = useState<number[]>([])
  const [missingTail, setMissingTail] = useState<boolean>(false)
  // The "UNDERSTAND THE CORE" screen shows after a correct answer, before
  // the green CORRECT! message.
  const [showCore, setShowCore] = useState<boolean>(false)

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

  // The prologue opens with the welcome screens, then a short story, before
  // mission 1. Only mission 1 mounts them, so missions 2+ skip straight to
  // their opening beat. Mission 2's opening plays the jeepney terminal
  // arrival before its exercise.
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

  // After mission 1's answer is accepted: the door opens, the player steps
  // outside, then the lesson recap plays.
  if (doorOpen) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[OPEN_DOOR_PAGE, ...OUTSIDE_PAGES]}
          onFinish={() => {
            setDoorOpen(false)
            setShowCore(true)
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

  if (showingTerminal) {
    return (
      <>
        <PrologueStory
          character={character}
          pages={[TERMINAL_START_PAGE]}
          onFinish={() => setShowingTerminal(false)}
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
    setChoiceOk(null)
    setChoiceBad(null)
    try {
      const { correct } = await submitAnswer(chapter, mission, answer)
      if (correct) {
        setWrongChars([])
        setMissingTail(false)
        const chosen = lesson?.choices
          ? matchingChoice(answer, lesson.choices)
          : null
        if (chosen !== null) setChoiceOk(chosen)
        setAnswer('')
        await refreshProgress()
        if (chapter === 0 && mission === 1) {
          // Solving the door puzzle plays the opening-door story beat
          // (bedroom, then outside) before the lesson recap.
          setDoorOpen(true)
        } else if (lesson?.core) {
          // The learning screen plays before the CORRECT! message.
          setShowCore(true)
        } else {
          setFeedback({
            ok: true,
            text: 'CORRECT! PROGRESS SAVED.',
          })
        }
      } else if (lesson?.choices) {
        // A wrong syntax: mark the offending characters red and tell the
        // player none of it ran.
        const { wrong, missing } = highlightDiff(answer, lesson.code ?? '')
        setWrongChars(wrong)
        setMissingTail(missing)
        const choice = matchingChoice(answer, lesson.choices)
        if (choice !== null) setChoiceBad(choice)
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

  // Clicking a hint types it into the box and starts the highlight state over.
  const pickChoice = (choice: number, value: string): void => {
    setAnswer(value)
    setSelectedChoice(choice)
    setWrongChars([])
    setMissingTail(false)
    setChoiceOk(null)
    setChoiceBad(null)
  }

  // Back to typing by hand: clear the hint pick and the old highlight state.
  const changeAnswer = (value: string): void => {
    setAnswer(value)
    setSelectedChoice(null)
    setWrongChars([])
    setMissingTail(false)
    setChoiceOk(null)
    setChoiceBad(null)
  }

  // The player finished the learning screen; show the green CORRECT! and
  // saved message.
  const closeCore = (): void => {
    setShowCore(false)
    setFeedback({ ok: true, text: 'CORRECT! PROGRESS SAVED.' })
  }

  const nextMission = (() => {
    if (!progress) return null
    const missions = progress.chapters.find((c) => c.id === chapter)?.missions
    if (!missions) return null
    const index = missions.findIndex((m) => m.number === mission)
    const next = missions[index + 1]
    return next && next.unlocked ? next.number : null
  })()

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
          <GameNav onBack={onBack} onChapter={onChapter} onExit={onExit} />
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
          <GameNav onBack={onBack} onChapter={onChapter} onExit={onExit} />
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
          <GameNav onBack={onBack} onChapter={onChapter} onExit={onExit} />
        </div>
      </div>
    )
  }

  const done = missionStatus.completed || feedback?.ok === true

  return (
    <div
      className={[
        'mission-screen',
        lesson?.sceneBg ? 'mission-scene-bg' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {lesson?.sceneBg && (
        <img className="mission-scene" src={lesson.sceneBg} alt="" />
      )}
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
        <p className="mission-skip">
          {missionStatus.completed ? 'ALREADY COMPLETED – PLAY AGAIN' : ' '}
        </p>

        {lesson?.prompt ? (
          <div className="mission-challenge">
            <p className="mission-challenge-prompt">{lesson.prompt}</p>
            {lesson.choices && (
              <div className="mission-choices">
                {lesson.choices.map((choice, i) => (
                  <button
                    type="button"
                    key={i}
                    className={[
                      'mission-choice',
                      selectedChoice === i ? 'selected' : '',
                      choiceOk === i ? 'choice-correct' : '',
                      choiceBad === i ? 'choice-wrong' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => pickChoice(i, choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mission-hint">
            <p className="mission-hint-label">MISSION CONTENT</p>
            <p className="mission-hint-body">Coming soon…</p>
          </div>
        )}

        <form className="mission-form" onSubmit={handleSubmit}>
          <div className="mission-code-zone">
            <input
              className={[
                'mission-input',
                wrongChars.length > 0 || missingTail ? 'highlighted' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              type="text"
              value={answer}
              onChange={(e) => changeAnswer(e.target.value)}
              placeholder="TYPE HERE"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={checking}
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

        {feedback && (
          <p className={`mission-feedback ${feedback.ok ? 'correct' : 'wrong'}`}>
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
          <button type="button" className="pixel-button mission-next" onClick={onChapter}>
            CHAPTER CLEARED ✓ GO TO CHAPTERS
          </button>
        )}
      </div>

      <GameNav onBack={onBack} onChapter={onChapter} onExit={onExit} />

      {showCore && lesson?.core && (
        <CoreBreakdown
          code={lesson.code}
          core={lesson.core}
          onClose={closeCore}
        />
      )}
    </div>
  )
}

export default MissionScreen