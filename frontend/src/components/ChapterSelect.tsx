import { useEffect, useState } from 'react'
import { ApiError, getProgress, type Progress } from '../api/client'
import './ChapterSelect.css'

interface ChapterSelectProps {
  onBack: () => void
  onExit: () => void
  onOpenMission: (chapter: number, mission: number) => void
}

function chapterLabel(id: number): string {
  if (id === 0) return 'PROLOGUE'
  if (id === 8) return 'EPILOGUE'
  return `CHAPTER ${id}`
}

function ChapterSelect({ onBack, onExit, onOpenMission }: ChapterSelectProps) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        setError(
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
        )
      })
    return () => {
      active = false
    }
  }, [onExit])

  const firstMissionOf = (chapter: number, unlocked: boolean) => {
    const status = progress?.chapters.find((c) => c.id === chapter)
    const unlockedMission = status?.missions.find((m) => m.unlocked)
    return unlocked ? unlockedMission?.number ?? 1 : null
  }

  const resume = progress?.chapters.find((c) => c.unlocked && !c.completed)
  const completedCount =
    progress?.chapters.filter((c) => c.completed).length ?? 0
  const totalCount = progress?.chapters.length ?? 0

  if (error) {
    return (
      <div className="chapter-select">
        <div className="chapter-content">
          <h2 className="chapter-title">CHAPTERS</h2>
          <p className="chapter-error">{error}</p>
          <button type="button" className="pixel-button" onClick={onBack}>
            BACK
          </button>
        </div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="chapter-select">
        <div className="chapter-content">
          <p className="chapter-loading">LOADING…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chapter-select">
      <div className="chapter-content">
        <h2 className="chapter-title">SELECT CHAPTER</h2>
        <p className="chapter-progress">
          {completedCount}/{totalCount} COMPLETE
        </p>

        <div className="chapter-grid">
          {progress.chapters.map((chapter) => {
            const target = firstMissionOf(chapter.id, chapter.unlocked)
            const className = [
              'chapter-card',
              !chapter.unlocked ? 'locked' : '',
              chapter.completed ? 'completed' : '',
            ]
              .filter(Boolean)
              .join(' ')
            const label = chapterLabel(chapter.id)

            return target !== null ? (
              <button
                key={chapter.id}
                type="button"
                className={className}
                onClick={() => onOpenMission(chapter.id, target)}
              >
                <span className="chapter-number">{chapter.id}</span>
                <span className="chapter-label">{label}</span>
                <span className="chapter-status">
                  {chapter.completed
                    ? '✓ COMPLETED'
                    : chapter.id === resume?.id
                      ? 'RESUME'
                      : 'UNLOCKED'}
                </span>
              </button>
            ) : (
              <div key={chapter.id} className={className} aria-disabled="true">
                <span className="chapter-number">{chapter.id}</span>
                <span className="chapter-label">{label}</span>
                <span className="chapter-status">🔒 LOCKED</span>
              </div>
            )
          })}
        </div>

        <div className="chapter-commands">
          <button type="button" className="pixel-button" onClick={onBack}>
            BACK
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChapterSelect