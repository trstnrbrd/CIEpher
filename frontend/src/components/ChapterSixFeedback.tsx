import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '../lessons'
import mission1Poster from '../chapter 6/programFlow/mission1.webp'
import mission2Poster from '../chapter 6/programFlow/mission2.webp'
import mission3Poster from '../chapter 6/programFlow/mission3.webp'
import mission4Poster from '../chapter 6/programFlow/mission4.webp'
import mission5Poster from '../chapter 6/programFlow/mission5.webp'
import './ChapterSixFeedback.css'

interface ChapterSixFeedbackProps {
  lesson: Lesson
  question: number
  onContinue: () => void
}

const POSTERS: Record<number, string> = {
  1: mission1Poster,
  2: mission2Poster,
  3: mission3Poster,
  4: mission4Poster,
  5: mission5Poster,
}

const SUBTITLES: Record<number, string> = {
  1: 'DISPLAY WELCOME MESSAGE',
  2: 'RETRY LOGIN',
  3: 'SCAN STUDENT ID',
  4: 'CONTINUE SOLVING PRACTICE PROBLEMS',
  5: 'SHOW THE COMPLETION SCREEN',
}

const LANDSCAPE_WIDTH = 1220
const LANDSCAPE_HEIGHT = 800
const PORTRAIT_WIDTH = 860
const PORTRAIT_HEIGHT = 920

function ChapterSixFeedback({
  lesson,
  question: _question,
  onContinue,
}: ChapterSixFeedbackProps) {
  const screen = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isLandscape, setIsLandscape] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const box = screen.current
    if (!box) return
    const fit = (): void => {
      const { width, height } = box.getBoundingClientRect()
      const mobile = width <= 768 || (width < height && width <= 820)
      setIsMobile(mobile)
      if (mobile) {
        setScale(1)
        setIsLandscape(false)
        return
      }
      const landscape = width >= height * 1.0
      setIsLandscape(landscape)
      const dw = landscape ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH
      const dh = landscape ? LANDSCAPE_HEIGHT : PORTRAIT_HEIGHT
      setScale(Math.min(width / dw, height / dh, 1.4))
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(box)
    return () => watch.disconnect()
  }, [])

  const posterImg = POSTERS[lesson.mission] || mission1Poster
  const subtitle = SUBTITLES[lesson.mission] || 'THE DO...WHILE LOOP'

  return (
    <div
      className={`ch6-workflow-screen ${isMobile ? 'is-mobile' : ''}`}
      role="dialog"
      aria-label="Understand the code"
      ref={screen}
    >
      <div
        className={`ch6-workflow-card ${isMobile ? 'is-mobile' : isLandscape ? 'is-landscape' : 'is-portrait'}`}
        style={isMobile ? undefined : { transform: `scale(${scale})` }}
      >
        {/* Top Header */}
        <div className="ch6-workflow-header-wrap">
          <div className="ch6-header-cap-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <polygon points="10,2 19,7 10,12 1,7" fill="#1864ab" />
              <polygon points="10,4 17,7 10,10 3,7" fill="#339af0" />
              <rect x="5" y="9" width="10" height="4" rx="2" fill="#1864ab" />
              <line x1="17" y1="7" x2="18" y2="14" stroke="#ffd43b" strokeWidth="1.5" />
              <circle cx="18" cy="14" r="1.5" fill="#fcc419" />
            </svg>
          </div>
          <div className="ch6-header-center">
            <h2 className="ch6-workflow-title">UNDERSTAND THE CODE</h2>
            <div className="ch6-workflow-subtitle-pill">{subtitle}</div>
          </div>
          <div className="ch6-header-books-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <rect x="3" y="10" width="14" height="4" fill="#2b8a3e" rx="1" />
              <rect x="4" y="6" width="13" height="4" fill="#c92a2a" rx="1" />
              <line x1="4" y1="7" x2="16" y2="7" stroke="#fff" strokeWidth="0.8" />
              <line x1="3" y1="11" x2="16" y2="11" stroke="#fff" strokeWidth="0.8" />
            </svg>
          </div>
        </div>

        {/* Visual Poster Screen */}
        <div className="ch6-workflow-poster-wrap">
          <div className="ch6-poster-scroll-area">
            <img
              src={posterImg}
              alt={`Chapter 6 Mission ${lesson.mission} Program Flow Poster`}
              className="ch6-poster-img"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="ch6-workflow-footer">
          <div className="ch6-footer-badge-pill">
            <span className="ch6-badge-star">★</span>
            <span className="ch6-badge-text">
              {`CHAPTER 6 MISSION ${lesson.mission}`}
            </span>
            <span className="ch6-badge-star">★</span>
          </div>

          <button
            type="button"
            className="ch6-core-ok pixel-button"
            onClick={onContinue}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChapterSixFeedback
