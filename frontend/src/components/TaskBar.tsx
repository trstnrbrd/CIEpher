import { useState } from 'react'
import type { Progress } from '../api/client'
import { getLesson } from '../lessons'
import './TaskBar.css'

interface TaskBarProps {
  chapter: number
  progress: Progress | null
  currentMission?: number
  currentQuestion?: number
  totalQuestions?: number
  onOpenMission: (chapter: number, mission: number) => void
}

function chapterLabel(id: number): string {
  if (id === 0) return 'PROLOGUE'
  if (id === 8) return 'EPILOGUE'
  return `CHAPTER ${id}`
}

// The floating part tracker over the game screens: it starts showing on the
// prologue's bedroom scene and follows the player through every chapter.
// Each part is one mission of the current chapter. A book slot is drawn for
// every part: checked green once its answer is correct, plain while in
// progress, dimmed while locked. The green segments under the books fill up
// as parts get done. Opening the bar lists the parts so the player can tap
// the one they want to come back to.
function TaskBar({
  chapter,
  progress,
  currentMission,
  currentQuestion,
  totalQuestions,
  onOpenMission,
}: TaskBarProps) {
  const [open, setOpen] = useState(false)

  const missions =
    progress?.chapters.find((c) => c.id === chapter)?.missions ?? []
  const total = missions.length
  if (total === 0) return null

  const done = missions.filter((m) => m.completed).length

  const close = (): void => setOpen(false)

  const goTo = (mission: number, unlocked: boolean): void => {
    if (!unlocked) return
    close()
    onOpenMission(chapter, mission)
  }

  const bookClass = (m: {
    number: number
    unlocked: boolean
    completed: boolean
  }): string =>
    [
      'task-book',
      m.completed ? 'done' : '',
      m.unlocked ? '' : 'locked',
      m.number === currentMission ? 'current' : '',
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <div className="task-bar">
      <button
        type="button"
        className="task-bar-track"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Open the part list"
      >
        <span className="task-bar-label">{chapterLabel(chapter)}</span>
        <span className="task-bar-segments" aria-hidden="true">
          {missions.map((m) => (
            <span
              key={m.number}
              className={['task-seg', m.completed ? 'done' : '']
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </span>
        <span className="task-books" aria-hidden="true">
          {missions.map((m) => (
            <span key={m.number} className={bookClass(m)}>
              <span className="task-book-spine" />
              {m.completed && <span className="task-book-check">✓</span>}
            </span>
          ))}
        </span>
        {currentMission &&
        totalQuestions &&
        totalQuestions > 1 &&
        currentQuestion ? (
          <span className="task-bar-step-pill">
            Q{currentQuestion}/{totalQuestions}
          </span>
        ) : null}
        <span className="task-bar-count">
          {done}/{total}
        </span>
        <span className="task-bar-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="task-bar-backdrop"
            onClick={close}
            aria-label="Close the part list"
          />
          <div className="task-bar-panel" role="dialog" aria-label="Parts">
            <p className="task-panel-title">
              {chapterLabel(chapter)} · {done}/{total} DONE
            </p>
            {missions.map((m) => {
              const lesson = getLesson(chapter, m.number)
              const partNumber = m.number
              const isCurrent = m.number === currentMission
              const hasMultiQuestions =
                isCurrent &&
                totalQuestions &&
                totalQuestions > 1 &&
                currentQuestion
              return (
                <button
                  key={m.number}
                  type="button"
                  className={[
                    'task-part',
                    m.unlocked ? '' : 'locked',
                    isCurrent ? 'current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => goTo(m.number, m.unlocked)}
                  disabled={!m.unlocked}
                >
                  <span className={bookClass(m)}>
                    <span className="task-book-spine" />
                    {m.completed && <span className="task-book-check">✓</span>}
                  </span>
                  <span className="task-part-name">
                    <span className="task-part-tag">
                      PART {partNumber}
                      {hasMultiQuestions
                        ? ` · QUESTION ${currentQuestion} OF ${totalQuestions}`
                        : ''}
                    </span>
                    <span className="task-part-title">
                      {lesson?.title ?? `MISSION ${partNumber}`}
                    </span>
                  </span>
                  <span
                    className={[
                      'task-part-status',
                      m.completed ? 'done' : m.unlocked ? 'open' : 'locked',
                    ].join(' ')}
                  >
                    {m.completed
                      ? '✓ DONE'
                      : m.unlocked
                        ? 'IN PROGRESS'
                        : 'LOCKED'}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default TaskBar