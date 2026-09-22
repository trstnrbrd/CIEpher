import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '../lessons'
import mission1Poster from '../assets/chapter 4/programFlow/mission1.webp'
import mission2Poster from '../assets/chapter 4/programFlow/mission2.webp'
import mission3Poster from '../assets/chapter 4/programFlow/mission3.webp'
import mission4Poster from '../assets/chapter 4/programFlow/mission4.webp'
import mission5Poster from '../assets/chapter 4/programFlow/mission5.webp'
import './ChapterFourFeedback.css'

interface ChapterFourFeedbackProps {
  lesson: Lesson
  question: number
  onContinue: () => void
}

interface CodeLineProps {
  line: string
}

function CodeLine({ line }: CodeLineProps) {
  const keyword = /^(\s*)(switch|case|default|break)\b(.*)$/.exec(line)
  if (keyword) {
    const [, space, word, rest] = keyword
    const caseVal = /^(\s*[^:]+)(:.*)$/.exec(rest)
    return (
      <span className="ch4-workflow-code-line">
        {space}
        <span className="ch4-workflow-code-keyword">{word}</span>
        {caseVal ? (
          <>
            <span className="ch4-workflow-code-val">{caseVal[1]}</span>
            {caseVal[2]}
          </>
        ) : (
          rest
        )}
      </span>
    )
  }
  const call = /^(\s*)([A-Za-z_]\w*\(\).*)$/.exec(line)
  if (call) {
    return (
      <span className="ch4-workflow-code-line">
        {call[1]}
        <span className="ch4-workflow-code-call">{call[2]}</span>
      </span>
    )
  }
  return <span className="ch4-workflow-code-line">{line || '\u00A0'}</span>
}

const POSTERS: Record<number, string> = {
  1: mission1Poster,
  2: mission2Poster,
  3: mission3Poster,
  4: mission4Poster,
  5: mission5Poster,
}

const SUBTITLES: Record<number, string> = {
  1: 'STUDENT SERVICE KIOSK',
  2: 'SELECT A LABORATORY COMPUTER',
  3: 'CHOOSE A PROGRAMMING EXERCISE',
  4: 'SELECT A CAMPUS DESTINATION',
  5: 'PROGRAMMING LAB MENU',
}

const LANDSCAPE_WIDTH = 1220
const LANDSCAPE_HEIGHT = 800
const PORTRAIT_WIDTH = 860
const PORTRAIT_HEIGHT = 920

function ChapterFourFeedback({
  lesson,
  question,
  onContinue,
}: ChapterFourFeedbackProps) {
  const screen = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isLandscape, setIsLandscape] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileTab, setMobileTab] = useState<'all' | 'concept' | 'flow'>('all')

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

  const core = lesson.core
  if (!core) return null

  const isMission1 = lesson.mission === 1
  const choiceQuestion = isMission1 && question === 1
  const posterImg = POSTERS[lesson.mission] || mission1Poster
  const subtitle = choiceQuestion ? 'WHY USE SWITCH?' : SUBTITLES[lesson.mission] || 'UNDERSTAND THE CODE'
  const code = lesson.code ?? ''

  const showLeftPanel = !isMobile || mobileTab === 'concept' || mobileTab === 'all'
  const showRightPanel = !isMobile || mobileTab === 'flow' || mobileTab === 'all'
  const isSingleTab = isMobile && mobileTab !== 'all'

  return (
    <div
      className={`ch4-workflow-screen ${isMobile ? 'is-mobile' : ''}`}
      role="dialog"
      aria-label="Understand the code"
      ref={screen}
    >
      <div
        className={`ch4-workflow-card ${isMobile ? 'is-mobile' : isLandscape ? 'is-landscape' : 'is-portrait'} ${isSingleTab ? 'single-tab' : ''}`}
        style={isMobile ? undefined : { transform: `scale(${scale})` }}
      >
        {/* Top Header */}
        <div className="ch4-workflow-header-wrap">
          <div className="ch4-header-cap-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <polygon points="10,2 19,7 10,12 1,7" fill="#1864ab" />
              <polygon points="10,4 17,7 10,10 3,7" fill="#339af0" />
              <rect x="5" y="9" width="10" height="4" rx="2" fill="#1864ab" />
              <line x1="17" y1="7" x2="18" y2="14" stroke="#ffd43b" strokeWidth="1.5" />
              <circle cx="18" cy="14" r="1.5" fill="#fcc419" />
            </svg>
          </div>
          <div className="ch4-header-center">
            <h2 className="ch4-workflow-title">
              {choiceQuestion ? 'UNDERSTAND THE CORE' : 'UNDERSTAND THE CODE'}
            </h2>
            <div className="ch4-workflow-subtitle-pill">{subtitle}</div>
          </div>
          <div className="ch4-header-books-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <rect x="3" y="10" width="14" height="4" fill="#2b8a3e" rx="1" />
              <rect x="4" y="6" width="13" height="4" fill="#c92a2a" rx="1" />
              <line x1="4" y1="7" x2="16" y2="7" stroke="#fff" strokeWidth="0.8" />
              <line x1="3" y1="11" x2="16" y2="11" stroke="#fff" strokeWidth="0.8" />
            </svg>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        {isMobile && (
          <div className="ch4-mobile-tabs" role="tablist">
            <button
              type="button"
              className={`ch4-mobile-tab ${mobileTab === 'all' ? 'active' : ''}`}
              onClick={() => setMobileTab('all')}
            >
              ALL
            </button>
            <button
              type="button"
              className={`ch4-mobile-tab ${mobileTab === 'concept' ? 'active' : ''}`}
              onClick={() => setMobileTab('concept')}
            >
              {choiceQuestion ? 'THE CONCEPT' : 'THE CODE'}
            </button>
            <button
              type="button"
              className={`ch4-mobile-tab ${mobileTab === 'flow' ? 'active' : ''}`}
              onClick={() => setMobileTab('flow')}
            >
              {choiceQuestion ? 'PROGRAM FLOW' : 'POSTER FLOW'}
            </button>
          </div>
        )}

        {choiceQuestion ? (
          /* Part 1 Concept Screen */
          <div className="ch4-workflow-panels">
            {showLeftPanel && (
              <section className="ch4-workflow-panel ch4-workflow-panel-code">
                <h3 className="ch4-workflow-panel-head">THE CONCEPT</h3>
                <div className="ch4-concept-container">
                  <div className="ch4-concept-callout">
                    <span className="ch4-concept-rule-badge">RULE</span>
                    <p className="ch4-concept-rule-text">
                      The switch statement is best when selecting one action from multiple fixed options.
                    </p>
                  </div>

                  <div className="ch4-concept-compare-grid">
                    <div className="ch4-concept-card ch4-concept-wrong">
                      <span className="ch4-concept-card-title">INCORRECT</span>
                      <span className="ch4-concept-chip ch4-chip-red">else if</span>
                      <p className="ch4-concept-card-desc">
                        An else if chain evaluates multiple conditions one by one sequentially.
                      </p>
                    </div>
                    <div className="ch4-concept-card ch4-concept-right">
                      <span className="ch4-concept-card-title">CORRECT</span>
                      <span className="ch4-concept-chip ch4-chip-green">switch</span>
                      <p className="ch4-concept-card-desc">
                        The switch statement compares a value directly against fixed case values.
                      </p>
                    </div>
                  </div>

                  <div className="ch4-workflow-window ch4-concept-window">
                    <span className="ch4-workflow-window-bar" aria-hidden="true">
                      <i className="ch4-workflow-dot ch4-workflow-dot-red" />
                      <i className="ch4-workflow-dot ch4-workflow-dot-yellow" />
                      <i className="ch4-workflow-dot ch4-workflow-dot-green" />
                    </span>
                    <pre className="ch4-workflow-code">
                      {code.split('\n').map((line, i) => (
                        <CodeLine key={i} line={line} />
                      ))}
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {showRightPanel && (
              <section className="ch4-workflow-panel ch4-workflow-panel-flow">
                <h3 className="ch4-workflow-panel-head">PROGRAM FLOW</h3>
                <div className="ch4-workflow-flow-scroll">
                  <div className="ch4-flow-container">
                    <span className="ch4-flow-pill ch4-flow-pill-start">START</span>
                    <span className="ch4-flow-arrow">&darr;</span>

                    <div className="ch4-flow-check-box">Check option</div>
                    <span className="ch4-flow-arrow">&darr;</span>

                    <div className="ch4-flow-diamond">option == 1?</div>

                    <div className="ch4-flow-branch-row">
                      <div className="ch4-flow-col ch4-flow-yes-col">
                        <span className="ch4-flow-tag ch4-tag-yes">YES</span>
                        <div className="ch4-flow-action-box">ViewSchedule();</div>
                        <span className="ch4-flow-arrow">&darr;</span>
                        <div className="ch4-flow-result-box ch4-res-green">
                          <span className="ch4-res-title">Schedule shown</span>
                          <span className="ch4-res-icon">📅</span>
                        </div>
                      </div>

                      <div className="ch4-flow-col ch4-flow-no-col">
                        <span className="ch4-flow-tag ch4-tag-no">NO</span>
                        <div className="ch4-flow-diamond">option == 2?</div>

                        <div className="ch4-flow-sub-row">
                          <div className="ch4-flow-col ch4-flow-yes-col">
                            <span className="ch4-flow-tag ch4-tag-yes">YES</span>
                            <div className="ch4-flow-action-box">ViewGrades();</div>
                            <span className="ch4-flow-arrow">&darr;</span>
                            <div className="ch4-flow-result-box ch4-res-green">
                              <span className="ch4-res-title">Grades shown</span>
                              <span className="ch4-res-icon">📊</span>
                            </div>
                          </div>
                          <div className="ch4-flow-col ch4-flow-no-col">
                            <span className="ch4-flow-tag ch4-tag-no">NO</span>
                            <div className="ch4-flow-action-box ch4-act-red">ShowInvalidOption();</div>
                            <span className="ch4-flow-arrow">&darr;</span>
                            <div className="ch4-flow-result-box ch4-res-red">
                              <span className="ch4-res-title">Invalid option shown</span>
                              <span className="ch4-res-icon">⚠️</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className="ch4-flow-arrow">&darr;</span>
                    <span className="ch4-flow-pill ch4-flow-pill-end">END</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Mission 1-5 Visual Canva Poster Screen */
          <div className="ch4-workflow-poster-wrap">
            <div className="ch4-poster-scroll-area">
              <img
                src={posterImg}
                alt={`Chapter 4 Mission ${lesson.mission} Program Flow Poster`}
                className="ch4-poster-img"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="ch4-workflow-footer">
          <div className="ch4-footer-badge-pill">
            <span className="ch4-badge-star">★</span>
            <span className="ch4-badge-text">
              {choiceQuestion
                ? 'CHAPTER 4 MISSION 1 · PART 1'
                : `CHAPTER 4 MISSION ${lesson.mission}`}
            </span>
            <span className="ch4-badge-star">★</span>
          </div>

          <button
            type="button"
            className="ch4-core-ok pixel-button"
            onClick={onContinue}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChapterFourFeedback
