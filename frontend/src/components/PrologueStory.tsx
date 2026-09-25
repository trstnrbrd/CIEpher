import { useEffect, useState } from 'react'
import type { Character } from '../api/client'
import { CHARACTER_ART, fitVariables, type CharacterFit } from '../characters'
import guardImg from '../chapter1/guard.webp'
import journalImg from '../icons/journal.webp'
import professorImg from '../chapter 2/professor.webp'
import staffImg from '../chapter 3/girl.webp'
import chapterThreeComputerImg from '../chapter 3/computer.webp'
import medalImg from '../chapter 3/medal.webp'
import mouseImg from '../chapter 2/mouse.webp'
import bedroomImg from '../assets/prologue/player bedroom.webp'
import closeDoorImg from '../assets/prologue/CloseDoor.webp'
import GameTopBar from './GameTopBar'
import type { StoryPage } from '../storyPages'
import { startTypingSound, stopTypingSound } from '../sound'
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
  const [prevPages, setPrevPages] = useState(pages)

  // Adjust state during render when the pages prop changes (React recommended pattern)
  if (pages !== prevPages) {
    setPrevPages(pages)
    setPage(0)
    setCount(0)
  }

  const list = pages ?? PAGES
  const safeIndex = Math.min(page, Math.max(0, list.length - 1))
  const currentPageData = list[safeIndex] ?? list[0] ?? { bg: '', lines: [] }

  const {
    bg,
    lines = [],
    scene,
    pos,
    align,
    guard,
    professor,
    staff,
    scoreMonitor,
    monitorType,
    retroPC,
    pcImage,
    kiosk,
    kioskImage,
    destinationCard,
    book,
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
    kioskCursor,
    kioskCursorTarget,
  } = currentPageData
  const guardSpeaking = speaker === 'guard' && guard
  const kioskSpeaking = speaker === 'kiosk'
  const professorSpeaking = speaker === 'professor'
  const { starts, total } = lineStarts(lines)
  // A card shows its text in full straight away.
  const done = card !== undefined || count >= total
  const last = safeIndex >= list.length - 1

  // Typewriter: re-runs for each new page and counts up to its total.
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
  }, [safeIndex, total, done])

  const advance = (): void => {
    stopTypingSound()
    if (last) {
      onFinish()
    } else {
      setCount(0)
      setPage((p) => Math.min(p + 1, list.length - 1))
    }
  }

  const tapBubble = (): void => {
    if (!done) {
      stopTypingSound()
      setCount(total)
    } else {
      advance()
    }
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
        stopTypingSound()
        setCount(total)
      } else if (safeIndex >= list.length - 1) {
        stopTypingSound()
        onFinish()
      } else {
        stopTypingSound()
        setCount(0)
        setPage((p) => Math.min(p + 1, list.length - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, safeIndex, total, onFinish, list.length])

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
        staff ? 'story-scene-staff' : '',
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
      {monitorType && (
        <span className="story-screen-layer" aria-hidden="true">
          {monitorType === 'pc2' ? (
            <div className="story-monitor-pc2-screen-digit">2</div>
          ) : (
            <span className="story-screen-text story-screen-monitor-content">
              {monitorType === 'wifi' && (
                <div className="story-monitor-wifi">
                  <svg viewBox="0 0 32 32" className="story-monitor-wifi-svg" aria-hidden="true">
                    <path
                      d="M7 10 h18 v2 h-18 z M5 12 h2 v2 h-2 z M25 12 h2 v2 h-2 z M3 14 h2 v2 h-2 z M27 14 h2 v2 h-2 z"
                      fill="#111111"
                    />
                    <path
                      d="M11 15 h10 v2 h-10 z M9 17 h2 v2 h-2 z M21 17 h2 v2 h-2 z M7 19 h2 v2 h-2 z M23 19 h2 v2 h-2 z"
                      fill="#111111"
                    />
                    <path
                      d="M13 20 h6 v2 h-6 z M11 22 h2 v2 h-2 z M19 22 h2 v2 h-2 z"
                      fill="#111111"
                    />
                    <path
                      d="M15 24 h2 v6 h-2 z M13 26 h6 v2 h-6 z"
                      fill="#111111"
                    />
                  </svg>
                </div>
              )}
              {monitorType === 'submitted' && (
                <div className="story-monitor-submitted">
                  <span>ACTIVITY</span>
                  <span>SUBMITTED</span>
                  <span>SUCCESSFULLY</span>
                  <span className="story-monitor-exclaim">! ! !</span>
                </div>
              )}
              {monitorType === 'medal' && (
                <div className="story-monitor-medal">
                  <img src={medalImg} alt="Gold Medal" />
                </div>
              )}
              {monitorType === 'score' && (
                <div className="story-score-display">90</div>
              )}
            </span>
          )}
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
            speaker === 'staff' ? 'story-bubble-staff' : '',
            speaker === 'player' ? 'story-bubble-player' : '',
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
      {staff && (
        <img
          className="story-staff"
          src={staffImg}
          alt="Scholarship Staff"
        />
      )}
      {scoreMonitor && (
        <div className="story-score-monitor">
          <img src={chapterThreeComputerImg} alt="" />
          {monitorType === 'pc2Assigned' ? (
            <div className="story-monitor-pc2-screen">
              <span className="story-pc2-text">COMPUTER 2</span>
              <span className="story-pc2-tag">ASSIGNED</span>
            </div>
          ) : monitorType === 'controlStructures' ? (
            <div className="story-monitor-pc2-screen">
              <span className="story-pc2-text">CONTROL STRUCTURES</span>
              <span className="story-pc2-tag">EXERCISE</span>
            </div>
          ) : (
            <div className="story-score-display">90</div>
          )}
        </div>
      )}
      {kiosk && kioskImage && (
        <div className="story-kiosk-wrap">
          <img className="story-kiosk-img" src={kioskImage} alt="Campus Kiosk" />
          {kioskCursor && (
            <img
              className={[
                'story-kiosk-mouse',
                kioskCursorTarget ? `story-kiosk-mouse-${kioskCursorTarget}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
              src={mouseImg}
              alt="Cursor"
            />
          )}
        </div>
      )}
      {retroPC && pcImage && (
        <div className="story-retropc-wrap">
          <img className="story-retropc-img" src={pcImage} alt="Computer Monitor" />
        </div>
      )}
      {destinationCard && (
        <div className="story-destination-wrap">
          <img
            className="story-destination-img"
            src={screenImage || bg}
            alt="Select Destination"
          />
        </div>
      )}
      {book && (
        <div className="story-desk-book" aria-hidden="true">
          <svg viewBox="0 0 60 40" className="story-desk-book-svg">
            <polygon points="12,18 42,4 58,16 28,30" fill="#a493c4" />
            <polygon points="10,21 40,7 42,4 12,18" fill="#584877" />
            <polygon points="10,21 28,33 58,19 58,16 28,30 10,21" fill="#f0edf5" />
            <polygon points="8,24 28,36 58,22 58,19 28,33 8,24" fill="#36294d" />
            <polygon points="8,24 10,21 28,33 28,36" fill="#281d3d" />
            <polygon points="28,36 28,33 58,19 58,22" fill="#281d3d" />
            <polygon points="25,23 37,17 40,19 28,25" fill="#4d3b6e" opacity="0.6" />
          </svg>
        </div>
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
