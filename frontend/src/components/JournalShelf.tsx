import { useEffect, useRef } from 'react'
import type { JournalLesson } from '../journal'
import './JournalShelf.css'

interface JournalShelfProps {
  // The lessons written so far: one book each.
  lessons: JournalLesson[]
  // Shown instead of the books: loading, an error, or "no lessons yet".
  notice: string | null
  // The book to focus when coming back from its notes.
  focus: number | null
  onOpen: (index: number) => void
  onExit: () => void
}

// The client's book pictures, by lesson number: src/icons/lesson1-book.png,
// lesson2-book.png and so on. Dropping a new file in that folder is enough;
// a lesson without a picture keeps the drawn book below.
const BOOK_PICTURES: Record<number, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: string }>('../icons/lesson*-book.png', {
      eager: true,
    }),
  ).flatMap(([path, module]) => {
    const found = /lesson(\d+)-book/.exec(path)
    return found ? [[Number(found[1]), module.default]] : []
  }),
)

// The mockup's EXIT tag, pixel by pixel (44 x 14): x, y, w, h.
const EXIT_FILL: [number, number, number, number][] = [
  [4, 1, 36, 12],
  [3, 2, 1, 10],
  [2, 4, 1, 6],
  [1, 6, 1, 2],
  [40, 2, 1, 10],
  [41, 4, 1, 6],
  [42, 6, 1, 2],
]

const EXIT_OUTLINE: [number, number, number, number][] = [
  [4, 0, 36, 1],
  [4, 13, 36, 1],
  [3, 1, 1, 1],
  [2, 2, 1, 2],
  [1, 4, 1, 2],
  [0, 6, 1, 2],
  [1, 8, 1, 2],
  [2, 10, 1, 2],
  [3, 12, 1, 1],
  [40, 1, 1, 1],
  [41, 2, 1, 2],
  [42, 4, 1, 2],
  [43, 6, 1, 2],
  [42, 8, 1, 2],
  [41, 10, 1, 2],
  [40, 12, 1, 1],
]

// A closed brown book lying on its back, tilted, with the lesson number on
// the cover. The pages show along its right and bottom edges.
function Book({ number }: { number: number }) {
  return (
    <svg viewBox="3 6 120 95" aria-hidden="true">
      <g
        transform="rotate(-20 66 50)"
        stroke="#3d2410"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <rect x="24" y="31" width="86" height="54" rx="7" fill="#a95d1e" />
        <rect x="21" y="26" width="86" height="54" rx="4" fill="#f6ecd6" />
        <g stroke="#cdb48c" strokeWidth="0.9" fill="none">
          <path d="M 102.4 29 V 77 M 104.6 30 V 78" />
          <path d="M 24 75.4 H 102 M 25 77.6 H 104" />
        </g>
        <rect x="14" y="19" width="86" height="54" rx="7" fill="#d98a33" />
        <rect x="14" y="19" width="12" height="54" rx="6" fill="#b86a22" />
        <path d="M 30 23 H 94" stroke="#eeaa5c" strokeWidth="2" />
        <g
          className="journal-shelf-book-label"
          stroke="none"
          textAnchor="middle"
        >
          <text x="61" y="46">
            LESSON
          </text>
          <text x="61" y="61">
            {number}
          </text>
        </g>
      </g>
    </svg>
  )
}

function JournalShelf({
  lessons,
  notice,
  focus,
  onOpen,
  onExit,
}: JournalShelfProps) {
  const focusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    focusRef.current?.focus()
  }, [])

  return (
    <div className="journal-shelf">
      {/* The arched title, like WELCOME TO CIEPHER. The numbers are the
          mockup's pixels. */}
      <h1 className="journal-shelf-title">
        <svg
          viewBox="60 0 690 115"
          role="img"
          aria-label="CIEpher Code Journal"
        >
          <path
            id="journal-shelf-arc"
            d="M 72 100 A 1228 1228 0 0 1 738 100"
            fill="none"
          />
          <text>
            <textPath
              href="#journal-shelf-arc"
              startOffset="50%"
              textAnchor="middle"
              textLength={662}
              lengthAdjust="spacingAndGlyphs"
            >
              CIEPHER CODE JOURNAL
            </textPath>
          </text>
        </svg>
      </h1>

      <button
        type="button"
        className="journal-shelf-exit"
        onClick={onExit}
        aria-label="Exit"
      >
        <svg viewBox="0 0 44 14" aria-hidden="true">
          <g shapeRendering="crispEdges">
            {EXIT_FILL.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="#fff" />
            ))}
            {EXIT_OUTLINE.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="#1b1b1b" />
            ))}
          </g>
          <text x="22" y="10.6" textAnchor="middle">
            EXIT
          </text>
        </svg>
      </button>

      {notice ? (
        <p className="journal-shelf-notice" role="status">
          {notice}
        </p>
      ) : (
        <div className="journal-shelf-books">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.chapter}
              ref={index === focus ? focusRef : undefined}
              type="button"
              className="journal-shelf-book"
              onClick={() => onOpen(index)}
              aria-label={lesson.title}
            >
              {BOOK_PICTURES[lesson.chapter] ? (
                <img
                  className="journal-shelf-picture"
                  src={BOOK_PICTURES[lesson.chapter]}
                  alt=""
                />
              ) : (
                <Book number={lesson.chapter} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default JournalShelf
