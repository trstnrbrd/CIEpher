import { useEffect, useState } from 'react'
import type { Character } from '../api/client'
import boyImg from '../assets/boy.png'
import girlImg from '../assets/girl.png'
import welcomerImg from '../assets/welcomeperson.png'
import './PostSelectWelcome.css'

interface PostSelectWelcomeProps {
  character: Character
  onContinue: () => void
}

type Phase = 'intro' | 'ready' | 'mechanics'

type LineKind = 'heading' | 'body' | 'ready'

interface Line {
  text: string
  kind: LineKind
}

const INTRO_LINES: Line[] = [
  { text: 'WELCOME TO CIEPHER', kind: 'heading' },
  {
    text: 'Welcome to the exciting world of C# Control Structures! This game is a supplementary tool that can support you in Abstract execution flow of C# Control Structure. This will also be your training ground as you aim to be better in C# Programming!',
    kind: 'body',
  },
]

const READY_LINES: Line[] = [
  { text: 'Are you ready to\nbegin the adventure?', kind: 'ready' },
]

// Start index of each line in the combined character count.
const STARTS: Record<Phase, number[]> = { intro: [], ready: [] }
let run = 0
for (const line of INTRO_LINES) {
  STARTS.intro.push(run)
  run += line.text.length
}
const INTRO_TOTAL = run
run = 0
for (const line of READY_LINES) {
  STARTS.ready.push(run)
  run += line.text.length
}
const READY_TOTAL = run

const HOW_TO_PLAY =
  'The game follows a story-based gameplay where the player encounters different scenarios that require the use of C# control structures. In each scenario, the player is given a task with missing code and must choose and type the correct syntax to proceed. Once submitted, a visual code flow shows how the condition is evaluated, allowing the player to understand why the code is correct. If the code is correct, the action is executed and the story continues; if incorrect, the player receives feedback and can try again.'

// One character every 26 ms (~38 chars / sec).
const CHAR_MS = 26

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
    const id = window.setInterval(() => {
      setCount((c) => Math.min(c + 1, total))
    }, CHAR_MS)
    return () => window.clearInterval(id)
  }, [phase, total])

  // Advance or finish on Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter') return
      if (phase === 'mechanics') {
        onContinue()
        return
      }
      if (phase === 'intro' && done) {
        setCount(0)
        setPhase('ready')
      } else if (phase === 'ready' && done) {
        setCount(0)
        setPhase('mechanics')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, done, onContinue])

  const skip = (): void => {
    if (phase !== 'mechanics') setCount(total)
  }

  const advance = (): void => {
    if (phase === 'intro') {
      setCount(0)
      setPhase('ready')
    } else if (phase === 'ready') {
      setCount(0)
      setPhase('mechanics')
    } else onContinue()
  }

  // Where the caret blinks, or -1 if typing is complete / idle.
  let activeLine = -1
  if (phase !== 'mechanics') {
    for (let i = 0; i < lines.length; i++) {
      const end = starts[i] + lines[i].text.length
      if (count > starts[i] && count < end) {
        activeLine = i
        break
      }
    }
  }

  const sprite = phase === 'mechanics'
    ? (character === 'boy' ? boyImg : girlImg)
    : welcomerImg

  return (
    <div className="post-select-welcome">
      <img className="welcome-person" src={sprite} alt={phase === 'mechanics' ? character : 'welcomer'} />

      {phase !== 'mechanics' ? (
        <button type="button" className="speech-bubble" onClick={skip}>
          {lines.map((line, i) => {
            const shown = Math.max(
              0,
              Math.min(line.text.length, count - starts[i]),
            )
            return (
              <p key={line.kind} className={`speech-line speech-${line.kind}`}>
                {line.text.slice(0, shown)}
                {i === activeLine && (
                  <span className="speech-caret">&#9646;</span>
                )}
              </p>
            )
          })}
        </button>
      ) : (
        <div className="mechanics-layer">
          <div className="howto-card">
            <h2 className="howto-title">HOW TO PLAY</h2>
            <p className="howto-body">{HOW_TO_PLAY}</p>
          </div>
          <button type="button" className="start-button" onClick={onContinue}>
            START
          </button>
        </div>
      )}

      {phase === 'intro' && done && (
        <button type="button" className="tap-next" onClick={advance}>
          TAP TO NEXT <span className="tap-caret">&#9660;</span>
        </button>
      )}

      {phase === 'ready' && done && (
        <button type="button" className="tap-next" onClick={advance}>
          TAP TO NEXT <span className="tap-caret">&#9660;</span>
        </button>
      )}
    </div>
  )
}

export default PostSelectWelcome