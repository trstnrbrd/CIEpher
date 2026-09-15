import { useEffect, useState, type CSSProperties } from 'react'
import {
  ApiError,
  getProgress,
  type ChapterStatus,
  type Progress,
} from '../api/client'
import GameTopBar from './GameTopBar'
import levelboard from '../icons/levelboard.png'
import woodBgMobile from '../icons/wood_bg mobile.png'
import './ChapterSelect.css'

interface ChapterSelectProps {
  onBack: () => void
  onExit: () => void
  onOpenMission: (chapter: number, mission: number) => void
  onJournal: () => void
  onSettings: () => void
}

function chapterLabel(id: number): string {
  if (id === 0) return 'PROLOGUE'
  if (id === 8) return 'EPILOGUE'
  return `CHAPTER ${id}`
}

function ChapterSelect({
  onBack,
  onExit,
  onOpenMission,
  onJournal,
  onSettings,
}: ChapterSelectProps) {
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

  // Where each level's number sits on the levelboard art, as a percentage of
  // the image (the board draws 10 gold rings; the bottom-right stays empty).
const SLOT_POSITIONS: Record<number, { left: string; top: string }> = {
  0: { left: '27.3%', top: '42.4%' },
  1: { left: '37.9%', top: '43.0%' },
  2: { left: '48.8%', top: '42.1%' },
  3: { left: '59.9%', top: '41.4%' },
  4: { left: '70.9%', top: '42.1%' },
  5: { left: '27.1%', top: '64.0%' },
  6: { left: '37.8%', top: '64.0%' },
  7: { left: '48.8%', top: '64.8%' },
  8: { left: '59.6%', top: '65.2%' },
}

// Where a chapter opens: the first mission that's open but not finished yet
  // (resume), or mission 1 to replay a finished chapter.
  const firstMissionOf = (chapter: number) => {
    const status = progress?.chapters.find((c) => c.id === chapter)
    const nextMission = status?.missions.find((m) => m.unlocked && !m.completed)
    return status?.unlocked ? nextMission?.number ?? 1 : null
  }

  const resume = progress?.chapters.find((c) => c.unlocked && !c.completed)
  const completedCount =
    progress?.chapters.filter((c) => c.completed).length ?? 0
  const totalCount = progress?.chapters.length ?? 0

  // One label on the levelboard: fine when this run cleared the chapter, the
  // number reads bright gold; locked levels are dimmed with a padlock.
  const renderLevel = (chapter: ChapterStatus) => {
    const className = [
      'level-icon',
      !chapter.unlocked ? 'locked' : '',
      chapter.id === resume?.id && !chapter.completed ? 'resume' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const target = firstMissionOf(chapter.id)
    const slotStyle = {
      '--slot-x': SLOT_POSITIONS[chapter.id].left,
      '--slot-y': SLOT_POSITIONS[chapter.id].top,
    } as CSSProperties

    return target !== null ? (
      <button
        key={chapter.id}
        type="button"
        className={className}
        style={slotStyle}
        aria-label={`${chapterLabel(chapter.id)}, unlocked`}
        onClick={() => onOpenMission(chapter.id, target)}
      >
        <span className="level-number">{chapter.id}</span>
      </button>
    ) : (
      <div
        key={chapter.id}
        className={className}
        style={slotStyle}
        aria-disabled="true"
        aria-label={`${chapterLabel(chapter.id)}, locked`}
      >
        <span className="level-number">{chapter.id}</span>
        <span className="lock-icon" aria-hidden="true" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="chapter-select">
        <GameTopBar onJournal={onJournal} onSettings={onSettings} />
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
        <GameTopBar onJournal={onJournal} onSettings={onSettings} />
        <div className="chapter-content">
          <p className="chapter-loading">LOADING…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chapter-select">
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />
      <div className="chapter-content">
        <h2 className="chapter-title">SELECT CHAPTER</h2>
        <p className="chapter-progress">
          {completedCount}/{totalCount} COMPLETE
        </p>

        <div className="level-board">
          <img className="level-art" src={levelboard} alt="" />
          <img className="level-art level-art-mobile" src={woodBgMobile} alt="" />
          <div className="level-slots">{progress.chapters.map(renderLevel)}</div>
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