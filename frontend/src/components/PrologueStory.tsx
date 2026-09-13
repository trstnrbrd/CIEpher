import { useEffect, useState } from 'react'
import type { Character } from '../api/client'
import boyImg from '../assets/boy.png'
import girlImg from '../assets/girl.png'
import bedroomImg from '../assets/prologue/player bedroom.png'
import './PrologueStory.css'

interface PrologueStoryProps {
  character: Character
  onFinish: () => void
}

interface StoryPage {
  bg: string
  lines: string[]
}

// The story inside the prologue. Add more pages as scenes are written; they
// play in order after the HOW-TO-PLAY card and before mission 1.
const PAGES: StoryPage[] = [
  {
    bg: bedroomImg,
    lines: [
      'Today is your first day as a programming student.',
      'Your journey begins now. Good luck!',
    ],
  },
]

// One character every 26 ms (~38 chars / sec), like the welcome screens.
const CHAR_MS = 26

// Start index of each line inside a page's combined character count.
function lineStarts(lines: string[]): {
  starts: number[]
  total: number
} {
  const starts: number[] = []
  let run = 0
  for (const line of lines) {
    starts.push(run)
    run += line.length
  }
  return { starts, total: run }
}

function PrologueStory({ character, onFinish }: PrologueStoryProps) {
  const [page, setPage] = useState(0)
  const [count, setCount] = useState(0)

  const { bg, lines } = PAGES[page]
  const { starts, total } = lineStarts(lines)
  const done = count >= total
  const last = page === PAGES.length - 1

  // Typewriter: re-runs for each new page and counts up to its total.
  useEffect(() => {
    const id = window.setInterval(() => {
      setCount((c) => Math.min(c + 1, total))
    }, CHAR_MS)
    return () => window.clearInterval(id)
  }, [page, total])

  const advance = (): void => {
    if (last) {
      onFinish()
    } else {
      setCount(0)
      setPage((p) => p + 1)
    }
  }

  const tapBubble = (): void => {
    if (!done) setCount(total)
    else advance()
  }

  // Where the caret blinks, or -1 if typing is complete.
  let activeLine = -1
  for (let i = 0; i < lines.length; i++) {
    const end = starts[i] + lines[i].length
    if (count > starts[i] && count < end) {
      activeLine = i
      break
    }
  }

  // Advance or finish on Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter') return
      if (!done) {
        setCount(total)
      } else if (page === PAGES.length - 1) {
        onFinish()
      } else {
        setCount(0)
        setPage((p) => p + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, page, total, onFinish])

  const sprite = character === 'boy' ? boyImg : girlImg

  return (
    <div className="prologue-story">
      <img className="story-bg" src={bg} alt="" />
      <button
        type="button"
        className={`story-bubble story-bubble-${character}`}
        onClick={tapBubble}
      >
        <span className="story-text">
          {lines.map((line, i) => {
            const shown = Math.max(0, Math.min(line.length, count - starts[i]))
            return (
              <span key={i} className="story-line">
                {line.slice(0, shown)}
                {i === activeLine && (
                  <span className="story-caret" aria-hidden="true" />
                )}
                <span className="story-rest">{line.slice(shown)}</span>
              </span>
            )
          })}
        </span>
        <span className={done ? 'story-tap' : 'story-tap story-tap-hidden'}>
          Tap to next
        </span>
      </button>

      <img className="story-person" src={sprite} alt={character} />
    </div>
  )
}

export default PrologueStory