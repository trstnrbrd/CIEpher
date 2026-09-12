import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  getProgress,
  submitAnswer,
  type Character,
  type Progress,
} from '../api/client'
import GameNav from './GameNav'
import PostSelectWelcome from './PostSelectWelcome'
import './MissionScreen.css'

interface MissionScreenProps {
  chapter: number
  mission: number
  character: Character
  onBack: () => void
  onChapter: () => void
  onExit: () => void
  onOpenMission: (chapter: number, mission: number) => void
}

function chapterLabel(id: number): string {
  return id === 0 ? 'PROLOGUE' : `CHAPTER ${id}`
}

function MissionScreen({
  chapter,
  mission,
  character,
  onBack,
  onChapter,
  onExit,
  onOpenMission,
}: MissionScreenProps) {
  // The prologue opens with the character's intro: play it before mission 1.
  // Re-entering the prologue (a fresh mount) shows it again.
  const [showingIntro, setShowingIntro] = useState<boolean>(
    chapter === 0 && mission === 1,
  )
  const [progress, setProgress] = useState<Progress | null>(null)
  const [answer, setAnswer] = useState('')
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  )
  const [serverError, setServerError] = useState<string | null>(null)

  const refreshProgress = async (): Promise<void> => {
    try {
      const p = await getProgress()
      setProgress(p)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExit()
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
          onExit()
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
  }, [onExit])

  // The prologue opens with the character's intro before mission 1. Only
  // mission 1 mounts it, so missions 2+ skip straight to the exercise.
  if (showingIntro) {
    return (
      <PostSelectWelcome
        character={character}
        onContinue={() => setShowingIntro(false)}
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
      const { correct } = await submitAnswer(chapter, mission, answer)
      if (correct) {
        setAnswer('')
        await refreshProgress()
        setFeedback({
          ok: true,
          text: 'CORRECT! PROGRESS SAVED.',
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
        onExit()
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
    <div className="mission-screen">
      <div className="mission-content">
        <h2 className="mission-header">
          {chapterLabel(chapter)} – MISSION {mission}
        </h2>
        <p className="mission-skip">
          {missionStatus.completed ? 'ALREADY COMPLETED – PLAY AGAIN' : ' '}
        </p>

        <div className="mission-hint">
          <p className="mission-hint-label">MISSION CONTENT</p>
          <p className="mission-hint-body">Coming soon…</p>
        </div>

        <form className="mission-form" onSubmit={handleSubmit}>
          <input
            className="mission-input"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="TYPE HERE"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={checking}
          />
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
    </div>
  )
}

export default MissionScreen