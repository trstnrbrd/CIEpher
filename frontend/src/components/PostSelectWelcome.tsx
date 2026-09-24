import { useEffect, useState } from 'react'
import type { Character } from '../api/client'
import boyImg from '../assets/boy.webp'
import girlImg from '../assets/girl.webp'
import welcomerImg from '../assets/welcomeperson.webp'
import { startTypingSound, stopTypingSound } from '../sound'
import './PostSelectWelcome.css'

interface PostSelectWelcomeProps {
  character: Character
  onContinue: () => void
}

// The client's order: intro → how to play (START) → "Are you ready?" (YES).
type Phase = 'intro' | 'ready' | 'mechanics'

// The paragraphs in the speech bubble, as in the client's wireframes.
const INTRO_LINES: string[] = [
  'Welcome to the exciting world of C# Control Structures!',
  'This game is a supplementary tool that can support you in Abstract execution flow of C# Control Structure. This will also be your training ground as you aim to be better in C# Programming!',
]

const READY_LINES: string[] = ['Are you ready to\nbegin the adventure?']

// Start index of each line in the combined character count.
const STARTS: Record<Phase, number[]> = { intro: [], ready: [], mechanics: [] }

let run = 0
for (const line of INTRO_LINES) {
  STARTS.intro.push(run)
  run += line.length
}
const INTRO_TOTAL = run
run = 0
for (const line of READY_LINES) {
  STARTS.ready.push(run)
  run += line.length
}
const READY_TOTAL = run

const HOW_TO_PLAY =
  'The game follows a story-based gameplay where the player encounters different scenarios that require the use of C# control structures. In each scenario, the player is given a task with missing code and must choose and type the correct syntax to proceed. Once submitted, a visual code flow shows how the condition is evaluated, allowing the player to understand why the code is correct. If the code is correct, the action is executed and the story continues; if incorrect, the player receives feedback and can try again.'

// One character every 26 ms (~38 chars / sec).
const CHAR_MS = 26

// Each MECHANICS letter and where it sits along the title's arc, measured
// on the wireframe (the letters are spread out, closer around the I).
const MECHANICS_LETTERS: [string, number][] = [
  ['M', 51.4],
  ['E', 88.9],
  ['C', 126.1],
  ['H', 163],
  ['A', 200.5],
  ['N', 237.8],
  ['I', 268.4],
  ['C', 301.6],
  ['S', 339.2],
]

// The wireframe's START button, pixel by pixel (83 x 35): x, y, w, h, color.
const START_PIXELS: [number, number, number, number, string][] = [
  // Fill, then the light top edge and the dark bottom and right edges.
  [7, 2, 69, 31, '#74a050'],
  [5, 4, 73, 26, '#74a050'],
  [2, 7, 79, 21, '#74a050'],
  [7, 2, 69, 3, '#a8d67c'],
  [7, 30, 69, 2, '#4f722a'],
  [76, 7, 2, 23, '#4f722a'],
  // The outline, with stepped corners.
  [7, 0, 69, 2, '#3d3b52'],
  [7, 33, 69, 2, '#3d3b52'],
  [5, 2, 2, 2, '#3d3b52'],
  [76, 2, 2, 2, '#3d3b52'],
  [2, 4, 3, 3, '#3d3b52'],
  [78, 4, 3, 3, '#3d3b52'],
  [0, 7, 2, 21, '#3d3b52'],
  [81, 7, 2, 21, '#3d3b52'],
  [2, 28, 3, 2, '#3d3b52'],
  [78, 28, 3, 2, '#3d3b52'],
  [5, 30, 2, 3, '#3d3b52'],
  [76, 30, 2, 3, '#3d3b52'],
]

function PostSelectWelcome({ character, onContinue }: PostSelectWelcomeProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [count, setCount] = useState(0)

  const lines = phase === 'intro' ? INTRO_LINES : READY_LINES
  const starts = STARTS[phase]
  const total = phase === 'intro' ? INTRO_TOTAL : READY_TOTAL
  const done = count >= total

  // Typewriter: run per phase. Entering a phase resets the count in the
  // advance handlers below, not here.
  useEffect(() => {
    if (done || total <= 0) {
      stopTypingSound()
      return
    }

    startTypingSound()

    const id = window.setInterval(() => {
      setCount((c) => {
        const next = Math.min(c + 1, total)
        if (next >= total) {
          stopTypingSound()
        }
        return next
      })
    }, CHAR_MS)

    return () => {
      window.clearInterval(id)
      stopTypingSound()
    }
  }, [phase, total, done])

  // Advance or finish on Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter') return
      stopTypingSound()
      if (phase === 'intro' && done) {
        setCount(0)
        setPhase('mechanics')
      } else if (phase === 'mechanics') {
        setCount(0)
        setPhase('ready')
      } else if (phase === 'ready' && done) {
        onContinue()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, done, onContinue])

  const skip = (): void => {
    if (phase !== 'mechanics') {
      stopTypingSound()
      setCount(total)
    }
  }

  const advance = (): void => {
    if (phase === 'intro') {
      setCount(0)
      setPhase('mechanics')
    } else if (phase === 'mechanics') {
      setCount(0)
      setPhase('ready')
    } else onContinue()
  }

  // A tap on the bubble finishes the typing. Once it's done, tapping the
  // intro bubble is "Tap to next"; "Are you ready?" waits for YES.
  const tapBubble = (): void => {
    if (!done) skip()
    else if (phase === 'intro') advance()
  }

  // Where the caret blinks, or -1 if typing is complete / idle.
  let activeLine = -1
  if (phase !== 'mechanics') {
    for (let i = 0; i < lines.length; i++) {
      const end = starts[i] + lines[i].length
      if (count > starts[i] && count < end) {
        activeLine = i
        break
      }
    }
  }

  const sprite =
    phase === 'mechanics'
      ? character === 'boy'
        ? boyImg
        : girlImg
      : welcomerImg

  return (
    <div className="post-select-welcome">
      <img
        className={
          phase === 'mechanics'
            ? `welcome-person welcome-person-${character}`
            : 'welcome-person'
        }
        src={sprite}
        alt={phase === 'mechanics' ? character : 'welcomer'}
      />

      {phase !== 'mechanics' ? (
        <div className="intro-scene">
          {/* The arched title: the text follows a circle arc, like the
              wireframe. The numbers are the wireframe's pixels. */}
          <h1 className="intro-title">
            <svg
              viewBox="126 8 310 52"
              role="img"
              aria-label="Welcome to CIEpher"
            >
              <path
                id="intro-title-arc"
                d="M 131 58.8 A 615 615 0 0 1 431 58.8"
                fill="none"
              />
              <text>
                <textPath
                  href="#intro-title-arc"
                  startOffset="50%"
                  textAnchor="middle"
                  textLength={258}
                  lengthAdjust="spacingAndGlyphs"
                >
                  WELCOME TO CIEPHER
                </textPath>
              </text>
            </svg>
          </h1>

          <button type="button" className="intro-bubble" onClick={tapBubble}>
            <span className={`intro-text intro-text-${phase}`}>
              {lines.map((line, i) => {
                const shown = Math.max(
                  0,
                  Math.min(line.length, count - starts[i]),
                )
                return (
                  <span key={i} className="intro-line">
                    {line.slice(0, shown)}
                    {i === activeLine && (
                      <span className="intro-caret" aria-hidden="true" />
                    )}
                    {/* The rest is laid out but invisible, so the lines
                        never jump while the text types in. */}
                    <span className="intro-rest">{line.slice(shown)}</span>
                  </span>
                )
              })}
            </span>
            {phase === 'intro' && (
              <span className={done ? 'intro-tap' : 'intro-tap intro-hidden'}>
                Tap to next
              </span>
            )}
          </button>

          {phase === 'ready' && done && (
            <button type="button" className="intro-yes" onClick={advance}>
              YES
            </button>
          )}
        </div>
      ) : (
        <div className="mech-scene">
          {/* Spaced letters on an arc, like the wireframe (its pixels). */}
          <h1 className="mech-title">
            <svg viewBox="100 20 360 56" role="img" aria-label="Mechanics">
              <path
                id="mech-title-arc"
                d="M 89 78.3 A 668 668 0 0 1 469 78.3"
                fill="none"
              />
              <text>
                {/* Each letter squeezed to the wireframe's 14px width. */}
                {MECHANICS_LETTERS.map(([letter, at], i) => (
                  <textPath
                    key={i}
                    href="#mech-title-arc"
                    startOffset={at}
                    textAnchor="middle"
                    textLength={16}
                    lengthAdjust="spacingAndGlyphs"
                  >
                    {letter}
                  </textPath>
                ))}
              </text>
            </svg>
          </h1>

          <div className="mech-card">
            <p className="mech-text">{HOW_TO_PLAY}</p>
          </div>

          <button
            type="button"
            className="mech-start"
            onClick={advance}
            aria-label="Start"
          >
            <svg viewBox="0 0 83 35" aria-hidden="true">
              <g shapeRendering="crispEdges">
                {START_PIXELS.map(([x, y, w, h, color], i) => (
                  <rect key={i} x={x} y={y} width={w} height={h} fill={color} />
                ))}
              </g>
              {/* Tall, thin yellow letters with a dark green shadow. */}
              <text
                className="mech-start-shadow"
                x={39.8}
                y={31.8}
                textAnchor="middle"
                textLength={70.5}
                lengthAdjust="spacingAndGlyphs"
              >
                START
              </text>
              <text
                className="mech-start-text"
                x={41.8}
                y={31.8}
                textAnchor="middle"
                textLength={70.5}
                lengthAdjust="spacingAndGlyphs"
              >
                START
              </text>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default PostSelectWelcome
