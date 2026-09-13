import { useEffect, useState } from 'react'
import { ApiError, getProgress, type Progress } from '../api/client'
import { getLesson, type Lesson } from '../lessons'
import './JournalScreen.css'

interface JournalScreenProps {
  onBack: () => void
  onUnauthorized: () => void
}

type JournalEntry = Lesson & { chapter: number; mission: number }

function chapterLabel(id: number): string {
  if (id === 0) return 'PROLOGUE'
  if (id === 8) return 'EPILOGUE'
  return `CHAPTER ${id}`
}

function JournalScreen({ onBack, onUnauthorized }: JournalScreenProps) {
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
          onUnauthorized()
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
  }, [onUnauthorized])

  // Every completed mission, newest first: later chapters above, and the
  // latest mission of each chapter above the earlier ones.
  const entries: JournalEntry[] = []
  if (progress) {
    for (const chapter of [...progress.chapters].reverse()) {
      for (const mission of [...chapter.missions].reverse()) {
        if (!mission.completed) continue
        const lesson = getLesson(chapter.id, mission.number)
        entries.push({
          chapter: chapter.id,
          mission: mission.number,
          title: lesson?.title ?? `MISSION ${mission.number}`,
          story: lesson?.story ?? '',
          lesson: lesson?.lesson ?? 'This lesson is still being written.',
          code: lesson?.code ?? '',
        })
      }
    }
  }

  return (
    <div className="journal-screen">
      <button type="button" className="pixel-button journal-back" onClick={onBack}>
        BACK
      </button>

      <h1 className="journal-title">CODE JOURNAL</h1>

      {error ? (
        <p className="journal-empty">{error}</p>
      ) : progress === null ? (
        <p className="journal-empty">LOADING…</p>
      ) : entries.length === 0 ? (
        <p className="journal-empty">
          NO LESSONS SAVED YET. FINISH A MISSION AND ITS LESSON APPEARS HERE.
        </p>
      ) : (
        <div className="journal-pages">
          {entries.map((entry) => (
            <article
              key={`${entry.chapter}:${entry.mission}`}
              className="journal-page"
            >
              <header className="journal-page-head">
                <span className="journal-page-tag">
                  {chapterLabel(entry.chapter)} – MISSION {entry.mission}
                </span>
                <h2 className="journal-page-title">{entry.title}</h2>
              </header>
              {entry.story && <p className="journal-page-story">{entry.story}</p>}
              <p className="journal-page-lesson">{entry.lesson}</p>
              {entry.code && (
                <pre className="journal-page-code">
                  <code>{entry.code}</code>
                </pre>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default JournalScreen