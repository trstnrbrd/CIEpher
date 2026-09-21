import { useEffect, useState } from 'react'
import type { Character } from '../api/client'
import { CHARACTER_ART, fitVariables, type CharacterFit } from '../characters'
import guardImg from '../chapter1/guard.webp'
import journalImg from '../icons/journal.webp'
import professorImg from '../chapter 2/professor.webp'
import bedroomImg from '../assets/prologue/player bedroom.webp'
import closeDoorImg from '../assets/prologue/CloseDoor.webp'
import GameTopBar from './GameTopBar'
import type { StoryPage } from '../storyPages'
import './PrologueStory.css'

interface PrologueStoryProps {
  character: Character
  onFinish: () => void
  onJournal: () => void
  onSettings: () => void
  // Which story pages to play. Defaults to the prologue's opening story.
  pages?: StoryPage[]
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
  {
    bg: closeDoorImg,
    lines: ['The door is lock!'],
  },
]

// Where the guard stands inside his picture, like CHARACTER_ART's fits.
const GUARD_FIT: CharacterFit = { top: 0.162, bottom: 0.858, middle: 0.4965 }

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

function PrologueStory({
  character,
  onFinish,
  onJournal,
  onSettings,
  pages,
}: PrologueStoryProps) {
  const [page, setPage] = useState(0)
  const [count, setCount] = useState(0)

  const list = pages ?? PAGES
  const {
    bg,
    lines,
    scene,
    pos,
    align,
    guard,
    professor,
    speaker,
    animation,
    bubble,
    noSprite,
    halfBody,
    screenText,
    screenImage,
    screenImageAlt,
    screenCursor,
    screenCursorAlt,
    screenCursorTarget,
    screenIcon,
    card,
    cardList,
    cardStyle,
  } = list[page]
  const guardSpeaking = speaker === 'guard' && guard
  const kioskSpeaking = speaker === 'kiosk'
  const professorSpeaking = speaker === 'professor'
  const { starts, total } = lineStarts(lines)
  // A card shows its text in full straight away.
  const done = card !== undefined || count >= total
  const last = page === list.length - 1

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

  // Advance or finish on Enter. On a focused button (the bubble, Next) the
  // button's own click already does it, so it isn't done twice.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return
      if (!done) {
        setCount(total)
      } else if (page === list.length - 1) {
        onFinish()
      } else {
        setCount(0)
        setPage((p) => p + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, page, total, onFinish, list.length])

  const art = CHARACTER_ART[character]
  const personClass = ['story-person']
  if (align === 'left') personClass.push('story-person-left')
  if (align === 'right') personClass.push('story-person-right')
  if (halfBody) personClass.push('story-person-half')

  // The school gate pages (the ones with the guard) have their own layout,
  // from Tristan's mockup: see .story-scene-guard.
  return (
    <div
      className={[
        'prologue-story',
        guard ? 'story-scene-guard' : '',
        scene ? `story-scene-${scene}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        className="story-bg"
        src={bg}
        alt=""
        style={{ objectPosition: pos ?? '55% 100%' }}
      />
      {screenText && (
        <span className="story-screen-layer" aria-hidden="true">
          <span className="story-screen-text">
            {screenText.map((line) => (
              <span key={line} className="story-screen-line">
                {line}
              </span>
            ))}
            <span className="story-screen-file-cursor" />
          </span>
        </span>
      )}
      {screenImage && (
        <span className="story-screen-layer">
          <img
            className="story-screen-image"
            src={screenImage}
            alt={screenImageAlt ?? ''}
          />
          {screenCursor && (
            <img
              className={[
                'story-screen-mouse',
                screenCursorTarget === 'history'
                  ? 'story-screen-mouse-history'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              src={screenCursor}
              alt={screenCursorAlt ?? ''}
            />
          )}
        </span>
      )}
      {screenIcon === 'file' && (
        <span className="story-screen-file" aria-hidden="true">
          <span className="story-screen-file-page" />
          <span className="story-screen-file-cursor" />
        </span>
      )}
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />
      {animation && (
        <div
          key={`${page}-${animation}`}
          className={`story-action story-action-${animation}`}
          role="img"
          aria-label={
            animation === 'worksheet'
              ? 'The cashier hands the worksheet to the player'
              : 'Wi-Fi changes from disconnected to connected'
          }
        >
          {animation === 'worksheet' ? (
            <div className="story-worksheet">
              <span>WORKSHEET</span>
              <i />
              <i />
              <i />
            </div>
          ) : (
            <div className="story-wifi">
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      )}
      {card !== undefined ? (
        <section
          className={
            cardStyle === 'complete'
              ? 'story-card story-card-complete'
              : 'story-card'
          }
          aria-labelledby="story-card-title"
        >
          <div className="story-card-box">
            <h2 id="story-card-title" className="story-card-title">
              {card}
            </h2>
            {lines.map((line) => (
              <p key={line} className="story-card-text">
                {line}
              </p>
            ))}
            {cardList && (
              <p className="story-card-list">
                {cardList.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </p>
            )}
            {cardStyle === 'complete' && (
              <button
                type="button"
                className="story-card-journal"
                onClick={onJournal}
              >
                <img src={journalImg} alt="" />
                Click to Learn!
              </button>
            )}
          </div>
          <button type="button" className="story-card-next" onClick={advance}>
            Next
          </button>
        </section>
      ) : lines.length === 0 ? (
        // A picture-only scene (no line to say): tapping anywhere moves on.
        <button type="button" className="story-tap-layer" onClick={advance}>
          <span className="story-tap">Tap to next</span>
        </button>
      ) : (
        <button
          type="button"
          className={[
            'story-bubble',
            `story-bubble-${character}`,
            guardSpeaking ? 'story-bubble-guard' : '',
            kioskSpeaking ? 'story-bubble-kiosk' : '',
            professorSpeaking ? 'story-bubble-professor' : '',
            speaker === 'cashier' ? 'story-bubble-cashier' : '',
            bubble === 'yellow' ? 'story-bubble-yellow' : '',
            bubble === 'white' ? 'story-bubble-white' : '',
            bubble === 'left' ? 'story-bubble-left' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={tapBubble}
        >
          {(speaker === 'cashier' ||
            speaker === 'professor' ||
            speaker === 'narrator') && (
            <span className="story-speaker">
              {speaker === 'cashier'
                ? 'Cashier'
                : speaker === 'professor'
                  ? 'Professor Reyes'
                  : 'Scene'}
            </span>
          )}
          <span className="story-text">
            {lines.map((line, i) => {
              const shown = Math.max(
                0,
                Math.min(line.length, count - starts[i]),
              )
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
      )}

      {guard && (
        <img
          className="story-guard"
          src={guardImg}
          alt="Security guard"
          style={fitVariables(GUARD_FIT)}
        />
      )}
      {professor && (
        <img
          className="story-professor"
          src={professorImg}
          alt="Professor Reyes"
        />
      )}
      {!noSprite && (
        <img
          className={personClass.join(' ')}
          src={art.img}
          alt={character}
          style={fitVariables(art.fit)}
        />
      )}
    </div>
  )
}

export default PrologueStory
