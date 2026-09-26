import { useState } from 'react'
import {
  ApiError,
  setCharacter,
  type Character,
  type Profile,
} from '../api/client'
import { CHARACTER_ART, fitVariables } from '../characters'
import './CharacterSelect.css'

interface CharacterSelectProps {
  onSaved: (profile: Profile) => void
  onUnauthorized: () => void
}

const CHARACTERS: Character[] = ['boy', 'girl']

// The mockup's green pixel arrow, pointing left (CSS mirrors it for the
// right one): an arrowhead with a notched tail. Each row is [from, to].
const ARROW_ROWS: [number, number][] = [
  [6, 6],
  [5, 7],
  [4, 8],
  [3, 9],
  [2, 9],
  [1, 7],
  [0, 5],
  [1, 7],
  [2, 9],
  [3, 9],
  [4, 8],
  [5, 7],
  [6, 6],
]

const ARROW_COLORS = {
  light: '#a9dc6b',
  top: '#80b44f',
  middle: '#6fa343',
  bottom: '#578a36',
  dark: '#3e682a',
  shadow: '#0a0924',
}

// Lit from the top left: a light edge along the upper side, a darker lower
// half with a dark edge, and a shadow one pixel below.
function arrowColor(x: number, y: number, from: number, to: number): string {
  if (y < 6) return x === from ? ARROW_COLORS.light : ARROW_COLORS.top
  if (y === 6) return x === from ? ARROW_COLORS.light : ARROW_COLORS.middle
  return x === to ? ARROW_COLORS.dark : ARROW_COLORS.bottom
}

// One rect per run of same-coloured pixels.
const ARROW_RECTS = ARROW_ROWS.flatMap(([from, to], y) => {
  const rects: { x: number; y: number; w: number; fill: string }[] = []
  for (let x = from; x <= to; x++) {
    const fill = arrowColor(x, y, from, to)
    const last = rects[rects.length - 1]
    if (last && last.fill === fill) last.w++
    else rects.push({ x, y, w: 1, fill })
  }
  return rects
})

function PixelArrow() {
  return (
    <svg viewBox="0 0 13 14" shapeRendering="crispEdges" aria-hidden="true">
      {ARROW_ROWS.map(([from, to], y) => (
        <rect
          key={`s${y}`}
          x={from}
          y={y + 1}
          width={to - from + 1}
          height={1}
          fill={ARROW_COLORS.shadow}
        />
      ))}
      {ARROW_RECTS.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  )
}

function CharacterSelect({ onSaved, onUnauthorized }: CharacterSelectProps) {
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = CHARACTERS[index]
  const art = CHARACTER_ART[current]

  // Left and right both circle through the two characters: from boy, one
  // click right goes to girl, one click left also goes to girl.
  const move = (step: number): void => {
    setError(null)
    setIndex((i) => (i + step + CHARACTERS.length) % CHARACTERS.length)
  }

  const handlePrev = (): void => move(-1)
  const handleNext = (): void => move(1)

  const handleSave = async (): Promise<void> => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const profile = await setCharacter(current)
      onSaved(profile)
    } catch (err) {
      // The session ended (e.g. logged out elsewhere): back to login.
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="character-select">
      <div className="character-stage">
        <div className="character-head">
          <h2 className="character-title">CHOOSE YOUR CHARACTER</h2>
          {error && (
            <p className="character-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          className="character-arrow character-arrow-previous"
          onClick={handlePrev}
          aria-label="Previous character"
        >
          <PixelArrow />
        </button>

        <div className="character-card">
          <img
            className="character-image"
            src={art.img}
            alt={art.alt}
            style={fitVariables(art.fit)}
          />
        </div>

        <button
          type="button"
          className="character-arrow character-arrow-next"
          onClick={handleNext}
          aria-label="Next character"
        >
          <PixelArrow />
        </button>

        <button
          type="button"
          className="character-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'SAVING...' : 'SELECT'}
        </button>
      </div>
    </div>
  )
}

export default CharacterSelect
