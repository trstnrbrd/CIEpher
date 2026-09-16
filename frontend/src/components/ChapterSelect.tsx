import { useEffect, useState } from 'react'
import { ApiError, getProgress, type Progress } from '../api/client'
import GameTopBar from './GameTopBar'
import levelboard from '../icons/levelboard.png'
import './ChapterSelect.css'

interface ChapterSelectProps {
  onExit: () => void
  onOpenMission: (chapter: number, mission: number) => void
  onJournal: () => void
  onSettings: () => void
}

// The board shows the seven story chapters. The prologue (0) plays right
// after the character is picked, and the epilogue (8) right after chapter 7,
// so neither gets a tile: the game opens them itself.
const PROLOGUE = 0
const EPILOGUE = 8
// Five on the top row of the board, two centered under them.
const ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7],
]
const CHAPTERS = ROWS.flat()

// The chapter tiles are drawn pixel by pixel on a 40 x 49 grid, so they stay
// pixel art at any size: a gold plate with a bevel, a chunky outlined number,
// and - when the chapter is locked - silver nuts and a padlock plate.
// The digits are 6 x 7 with two-pixel strokes; '#' is an on pixel.
const DIGITS: Record<number, string[]> = {
  1: ['..##..', '.###..', '..##..', '..##..', '..##..', '..##..', '.####.'],
  2: ['.####.', '##..##', '...##.', '..##..', '.##...', '##....', '######'],
  3: ['.####.', '##..##', '....##', '..###.', '....##', '##..##', '.####.'],
  4: ['...##.', '..###.', '.####.', '##.##.', '######', '...##.', '...##.'],
  5: ['######', '##....', '#####.', '....##', '....##', '##..##', '.####.'],
  6: ['..###.', '.##...', '##....', '#####.', '##..##', '##..##', '.####.'],
  7: ['######', '....##', '...##.', '..##..', '..##..', '.##...', '.##...'],
}

// One digit. `size` is how many grid units each of its pixels takes.
function Digit({
  value,
  x,
  y,
  size,
  fill,
}: {
  value: number
  x: number
  y: number
  size: number
  fill: string
}) {
  return (
    <g fill={fill}>
      {(DIGITS[value] ?? []).flatMap((row, ry) =>
        [...row].map((pixel, rx) =>
          pixel === '#' ? (
            <rect
              key={`${rx}-${ry}`}
              x={x + rx * size}
              y={y + ry * size}
              width={size}
              height={size}
            />
          ) : null,
        ),
      )}
    </g>
  )
}

function Nut({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="3" height="3" fill="#6f6f78" />
      <rect x={x + 1} y={y} width="1" height="1" fill="#e6e6ec" />
      <rect x={x} y={y + 1} width="3" height="1" fill="#c6c6ce" />
      <rect x={x + 1} y={y + 1} width="1" height="1" fill="#f2f2f6" />
    </g>
  )
}

function Tile({
  value,
  locked,
  current,
}: {
  value: number
  locked: boolean
  current: boolean
}) {
  // A locked plate shows a smaller number above its padlock; an open one
  // shows a big number in the middle.
  const size = locked ? 2 : 3
  const digitX = locked ? 14 : 11
  const digitY = locked ? 6 : 14
  // A thin outline: one grid unit out in all eight directions, so it has no
  // gaps where the digit steps diagonally.
  const outline = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]

  return (
    <svg
      className="chapter-art"
      viewBox="0 0 40 49"
      shapeRendering="crispEdges"
      role="img"
      aria-label={String(value)}
    >
      {/* the gold plate: dark edge, face, then the bevel */}
      <rect x="0" y="0" width="40" height="49" fill="#241505" />
      <rect x="2" y="2" width="36" height="45" fill="#eeb42c" />
      <rect x="2" y="2" width="36" height="4" fill="#ffd75c" />
      <rect x="2" y="2" width="4" height="45" fill="#fbcc4e" />
      <rect x="34" y="2" width="4" height="45" fill="#d99a24" />
      <rect x="2" y="41" width="36" height="6" fill="#c9891c" />
      <rect x="6" y="6" width="28" height="1" fill="#f7c53f" />
      {current && (
        <>
          <rect x="2" y="2" width="36" height="2" fill="#fff6d5" />
          <rect x="2" y="2" width="2" height="45" fill="#fff6d5" />
          <rect x="36" y="2" width="2" height="45" fill="#fff6d5" />
          <rect x="2" y="45" width="36" height="2" fill="#fff6d5" />
        </>
      )}

      {locked && (
        <>
          <Nut x={3} y={3} />
          <Nut x={34} y={3} />
          <Nut x={3} y={43} />
          <Nut x={34} y={43} />
        </>
      )}

      {outline.map(([dx, dy]) => (
        <Digit
          key={`${dx}-${dy}`}
          value={value}
          x={digitX + dx}
          y={digitY + dy}
          size={size}
          fill="#241505"
        />
      ))}
      <Digit value={value} x={digitX} y={digitY} size={size} fill="#ffffff" />

      {locked && (
        <>
          {/* the padlock plate */}
          <rect x="9" y="23" width="22" height="20" fill="#3a3a42" />
          <rect x="11" y="25" width="18" height="16" fill="#b4b4bd" />
          <rect x="11" y="25" width="18" height="2" fill="#d9d9df" />
          <rect x="11" y="39" width="18" height="2" fill="#8d8d96" />
          <rect x="12" y="26" width="2" height="2" fill="#6f6f78" />
          <rect x="26" y="26" width="2" height="2" fill="#6f6f78" />
          <rect x="12" y="38" width="2" height="2" fill="#6f6f78" />
          <rect x="26" y="38" width="2" height="2" fill="#6f6f78" />
          {/* the keyhole */}
          <rect x="18" y="28" width="4" height="4" fill="#17171c" />
          <rect x="19" y="32" width="2" height="4" fill="#17171c" />
          <rect x="18" y="36" width="4" height="2" fill="#17171c" />
        </>
      )}
    </svg>
  )
}

function ChapterSelect({
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

  const chapter = (id: number) => progress?.chapters.find((c) => c.id === id)

  // Where a chapter opens: the first mission that's open but not finished
  // (resume), or mission 1 to replay a finished chapter. null = still locked.
  const missionToOpen = (id: number): number | null => {
    const status = chapter(id)
    if (!status?.unlocked) return null
    return status.missions.find((m) => m.unlocked && !m.completed)?.number ?? 1
  }

  // The prologue and the epilogue play on their own. Open whichever one the
  // player owes before the board is any use to them.
  const auto = ((): number | null => {
    if (!progress) return null
    if (!chapter(PROLOGUE)?.completed) return PROLOGUE
    const story = chapter(EPILOGUE)
    // The epilogue only exists once the client's content is in the database.
    if (story?.unlocked && !story.completed && story.missions.length > 0) {
      return EPILOGUE
    }
    return null
  })()

  useEffect(() => {
    if (auto === null) return
    const mission = missionToOpen(auto)
    if (mission !== null) onOpenMission(auto, mission)
    // missionToOpen reads the progress this effect already depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, progress, onOpenMission])

  // The chapter the player is on: the first open one they haven't finished.
  const current = CHAPTERS.find((id) => {
    const status = chapter(id)
    return status?.unlocked && !status.completed
  })

  let notice: string | null = null
  if (error) notice = error
  else if (!progress || auto !== null) notice = 'LOADING…'

  return (
    <div className="chapter-select">
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />

      <h1 className="chapter-plaque">
        <span className="chapter-plaque-select">SELECT</span>
        <span className="chapter-plaque-word">Chapter</span>
      </h1>

      <div className="chapter-board">
        <img className="chapter-board-art" src={levelboard} alt="" />

        {notice ? (
          <p className="chapter-notice" role="status">
            {notice}
          </p>
        ) : (
          <div className="chapter-tiles">
            {ROWS.map((row, index) => (
              <div className="chapter-row" key={index}>
                {row.map((id) => {
                  const status = chapter(id)
                  const mission = missionToOpen(id)
                  const className = [
                    'chapter-tile',
                    mission === null ? 'is-locked' : '',
                    id === current ? 'is-current' : '',
                    status?.completed ? 'is-done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return mission === null ? (
                    <div
                      key={id}
                      className={className}
                      aria-disabled="true"
                      aria-label={`Chapter ${id}, locked`}
                    >
                      <Tile value={id} locked current={false} />
                    </div>
                  ) : (
                    <button
                      key={id}
                      type="button"
                      className={className}
                      aria-label={`Chapter ${id}`}
                      onClick={() => onOpenMission(id, mission)}
                    >
                      <Tile
                        value={id}
                        locked={false}
                        current={id === current}
                      />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChapterSelect
