import { useEffect, useState, type ReactNode } from 'react'
import { ApiError, getProgress, type Progress } from '../api/client'
import { JOURNAL, type JournalLesson } from '../journal'
import './JournalScreen.css'

interface JournalScreenProps {
  onBack: () => void
  onUnauthorized: () => void
}

// A pixel-art cloud for the sky behind the notebook.
function Cloud({ className }: { className: string }) {
  return (
    <svg
      className={`journal-cloud ${className}`}
      viewBox="0 0 20 7"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="#fff">
        <rect x="7" y="0" width="4" height="1" />
        <rect x="4" y="1" width="9" height="1" />
        <rect x="14" y="1" width="3" height="1" />
        <rect x="2" y="2" width="17" height="1" />
        <rect x="1" y="3" width="19" height="1" />
        <rect x="0" y="4" width="20" height="1" />
      </g>
      <g fill="#cfeefc">
        <rect x="0" y="5" width="20" height="1" />
        <rect x="1" y="6" width="18" height="1" />
      </g>
    </svg>
  )
}

// The outlined triangle in a bottom corner of the notebook. It points left;
// CSS mirrors it for the next-page arrow.
function Arrow() {
  return (
    <svg viewBox="0 0 12 18" aria-hidden="true">
      <polygon points="10,1.5 10,16.5 2,9" />
    </svg>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="journal-heading">{children}</h2>
}

function LeftPage({ lesson }: { lesson: JournalLesson }) {
  return (
    <>
      <Heading>Definition</Heading>
      {lesson.definition.map((text) => (
        <p key={text} className="journal-text">
          {text}
        </p>
      ))}
      <Heading>Basic Syntax</Heading>
      <pre className="journal-code">{lesson.syntax}</pre>
      {lesson.syntaxNotes.length > 0 && (
        <ul className="journal-list">
          {lesson.syntaxNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </>
  )
}

function RightPage({ lesson }: { lesson: JournalLesson }) {
  return (
    <>
      <Heading>Common Syntax Errors</Heading>
      {lesson.mistakes.map((mistake) => (
        <div key={mistake.wrong} className="journal-mistake">
          <code className="journal-wrong">{mistake.wrong}</code>
          <p className="journal-text">{mistake.fix}</p>
        </div>
      ))}
      <Heading>Real-World Applications</Heading>
      <ul className="journal-list">
        {lesson.uses.map((use) => (
          <li key={use}>{use}</li>
        ))}
      </ul>
    </>
  )
}

function JournalScreen({ onBack, onUnauthorized }: JournalScreenProps) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The open lesson; null opens the newest one.
  const [picked, setPicked] = useState<number | null>(null)

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

  // A chapter's lesson is written into the journal once the chapter is
  // completed, in chapter order.
  const lessons = progress
    ? JOURNAL.filter((lesson) =>
        progress.chapters.some(
          (chapter) => chapter.id === lesson.chapter && chapter.completed,
        ),
      )
    : []
  const current = Math.min(picked ?? lessons.length - 1, lessons.length - 1)
  const lesson: JournalLesson | undefined = lessons[current]
  const hasPrevious = current > 0
  const hasNext = current < lessons.length - 1

  // Arrow keys turn the pages; Escape closes the journal.
  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onBack()
      else if (event.key === 'ArrowLeft' && hasPrevious) setPicked(current - 1)
      else if (event.key === 'ArrowRight' && hasNext) setPicked(current + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onBack, current, hasPrevious, hasNext])

  let notice: string | null = null
  if (error) notice = error
  else if (progress === null) notice = 'Loading…'
  else if (!lesson)
    notice = 'No lessons yet. Finish a chapter and its lesson is written here.'

  return (
    <div className="journal-screen">
      <Cloud className="journal-cloud-1" />
      <Cloud className="journal-cloud-2" />
      <Cloud className="journal-cloud-3" />
      <Cloud className="journal-cloud-4" />
      <div className="journal-ground" aria-hidden="true" />

      <h1 className="journal-title">
        {lesson ? lesson.title : 'Code Journal'}
      </h1>

      <div className="journal-book">
        <div className="journal-spread">
          <section className="journal-page journal-page-left">
            {lesson ? (
              <LeftPage lesson={lesson} />
            ) : (
              <p className="journal-text">{notice}</p>
            )}
          </section>
          <section className="journal-page journal-page-right">
            {lesson && <RightPage lesson={lesson} />}
          </section>
        </div>
        <div className="journal-spiral" aria-hidden="true" />
        <button
          type="button"
          className="journal-arrow journal-arrow-previous"
          aria-label="Previous lesson"
          disabled={!hasPrevious}
          onClick={() => setPicked(current - 1)}
        >
          <Arrow />
        </button>
        <button
          type="button"
          className="journal-arrow journal-arrow-next"
          aria-label="Next lesson"
          disabled={!hasNext}
          onClick={() => setPicked(current + 1)}
        >
          <Arrow />
        </button>
      </div>

      <button type="button" className="journal-back" onClick={onBack}>
        BACK
      </button>
    </div>
  )
}

export default JournalScreen
