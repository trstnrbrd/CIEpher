import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '../lessons'
import './ChapterThreeFeedback.css'

type WorkflowIcon =
  | 'bulb'
  | 'check'
  | 'star'
  | 'branch'
  | 'docUp'
  | 'chart'
  | 'goldMedal'
  | 'silverMedal'
  | 'bronzeMedal'
  | 'wifi'
  | 'trophy'
  | 'report'
  | 'cert'
  | 'gauge'
  | 'clipboardA'

function PixelArtIcon({ name }: { name: WorkflowIcon }) {
  switch (name) {
    case 'bulb':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="6" y="1" width="4" height="1" fill="#ffe066" />
          <rect x="4" y="2" width="8" height="1" fill="#ffe066" />
          <rect x="3" y="3" width="10" height="4" fill="#ffd43b" />
          <rect x="4" y="7" width="8" height="2" fill="#ffd43b" />
          <rect x="5" y="9" width="6" height="2" fill="#fcc419" />
          <rect x="6" y="11" width="4" height="2" fill="#adb5bd" />
          <rect x="7" y="13" width="2" height="1" fill="#868e96" />
          {/* Sparkles */}
          <rect x="1" y="4" width="1" height="2" fill="#fff3bf" />
          <rect x="14" y="4" width="1" height="2" fill="#fff3bf" />
          <rect x="2" y="1" width="2" height="1" fill="#fff3bf" />
          <rect x="12" y="1" width="2" height="1" fill="#fff3bf" />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="#40c057" />
          <rect x="2" y="2" width="12" height="12" fill="#51cf66" />
          <path d="M4 8 L7 11 L12 5 L11 4 L7 9 L5 7 Z" fill="#ffffff" />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="7" y="1" width="2" height="2" fill="#ffd43b" />
          <rect x="6" y="3" width="4" height="2" fill="#ffd43b" />
          <rect x="1" y="5" width="14" height="2" fill="#fcc419" />
          <rect x="3" y="7" width="10" height="2" fill="#fcc419" />
          <rect x="4" y="9" width="8" height="2" fill="#fab005" />
          <rect x="3" y="11" width="4" height="2" fill="#fab005" />
          <rect x="9" y="11" width="4" height="2" fill="#fab005" />
          <rect x="2" y="13" width="3" height="2" fill="#f59f00" />
          <rect x="11" y="13" width="3" height="2" fill="#f59f00" />
          {/* Sparkles */}
          <rect x="1" y="2" width="1" height="1" fill="#fff3bf" />
          <rect x="14" y="2" width="1" height="1" fill="#fff3bf" />
          <rect x="1" y="11" width="1" height="1" fill="#fff3bf" />
          <rect x="14" y="11" width="1" height="1" fill="#fff3bf" />
        </svg>
      )
    case 'branch':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          {/* Root node */}
          <rect x="7" y="2" width="3" height="3" fill="#ff6b6b" />
          {/* Connecting stems */}
          <rect x="8" y="5" width="1" height="3" fill="#c92a2a" />
          <rect x="4" y="7" width="9" height="1" fill="#c92a2a" />
          <rect x="4" y="8" width="1" height="2" fill="#c92a2a" />
          <rect x="8" y="8" width="1" height="2" fill="#c92a2a" />
          <rect x="12" y="8" width="1" height="2" fill="#c92a2a" />
          {/* Child nodes */}
          <rect x="3" y="10" width="3" height="3" fill="#fa5252" />
          <rect x="7" y="10" width="3" height="3" fill="#fa5252" />
          <rect x="11" y="10" width="3" height="3" fill="#fa5252" />
          {/* Sparkles */}
          <rect x="1" y="3" width="1" height="1" fill="#ffc9c9" />
          <rect x="14" y="3" width="1" height="1" fill="#ffc9c9" />
        </svg>
      )
    case 'docUp':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="3" y="1" width="10" height="14" fill="#e7f5ff" />
          <rect x="4" y="2" width="8" height="12" fill="#ffffff" />
          {/* Folded corner */}
          <rect x="10" y="1" width="3" height="3" fill="#a5d8ff" />
          {/* Up arrow */}
          <rect x="7" y="5" width="2" height="6" fill="#1c7ed6" />
          <polygon points="8,3 5,6 11,6" fill="#1c7ed6" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          {/* Baseline */}
          <rect x="2" y="13" width="12" height="1" fill="#c92a2a" />
          {/* Bar 1 */}
          <rect x="3" y="9" width="3" height="4" fill="#ff8787" />
          {/* Bar 2 */}
          <rect x="7" y="6" width="3" height="7" fill="#ff6b6b" />
          {/* Bar 3 */}
          <rect x="11" y="3" width="3" height="10" fill="#fa5252" />
        </svg>
      )
    case 'goldMedal':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          {/* Ribbon */}
          <polygon points="5,1 7,6 3,6" fill="#fa5252" />
          <polygon points="11,1 9,6 13,6" fill="#fa5252" />
          {/* Medal Circle */}
          <circle cx="8" cy="10" r="5" fill="#fcc419" />
          <circle cx="8" cy="10" r="4" fill="#ffd43b" />
          <rect x="7" y="8" width="2" height="4" fill="#f08c00" />
        </svg>
      )
    case 'silverMedal':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          {/* Ribbon */}
          <polygon points="5,1 7,6 3,6" fill="#339af0" />
          <polygon points="11,1 9,6 13,6" fill="#339af0" />
          {/* Medal Circle */}
          <circle cx="8" cy="10" r="5" fill="#ced4da" />
          <circle cx="8" cy="10" r="4" fill="#e9ecef" />
          <rect x="7" y="8" width="2" height="4" fill="#868e96" />
        </svg>
      )
    case 'bronzeMedal':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          {/* Ribbon */}
          <polygon points="5,1 7,6 3,6" fill="#51cf66" />
          <polygon points="11,1 9,6 13,6" fill="#51cf66" />
          {/* Medal Circle */}
          <circle cx="8" cy="10" r="5" fill="#d9480f" />
          <circle cx="8" cy="10" r="4" fill="#f76707" />
          <rect x="7" y="8" width="2" height="4" fill="#b03a08" />
        </svg>
      )
    case 'wifi':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <circle cx="8" cy="13" r="1.5" fill="#1c7ed6" />
          <path d="M5 10 A4.5 4.5 0 0 1 11 10" stroke="#1c7ed6" strokeWidth="1.5" fill="none" />
          <path d="M3 7 A7.5 7.5 0 0 1 13 7" stroke="#1c7ed6" strokeWidth="1.5" fill="none" />
          <path d="M1 4 A10.5 10.5 0 0 1 15 4" stroke="#1c7ed6" strokeWidth="1.5" fill="none" />
        </svg>
      )
    case 'trophy':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="5" y="2" width="6" height="5" fill="#ffd43b" />
          <rect x="3" y="2" width="2" height="3" fill="#fab005" />
          <rect x="11" y="2" width="2" height="3" fill="#fab005" />
          <rect x="6" y="7" width="4" height="2" fill="#fcc419" />
          <rect x="7" y="9" width="2" height="3" fill="#f59f00" />
          <rect x="5" y="12" width="6" height="2" fill="#e67700" />
        </svg>
      )
    case 'report':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="3" y="1" width="10" height="14" fill="#fff" />
          <rect x="3" y="1" width="10" height="14" stroke="#e03131" strokeWidth="1" fill="none" />
          <rect x="5" y="4" width="6" height="1" fill="#495057" />
          <rect x="5" y="7" width="6" height="1" fill="#495057" />
          <rect x="5" y="10" width="4" height="1" fill="#495057" />
        </svg>
      )
    case 'cert':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="2" y="2" width="12" height="9" fill="#fffdf2" stroke="#228be6" strokeWidth="1" />
          <rect x="4" y="4" width="8" height="1" fill="#adb5bd" />
          <rect x="4" y="6" width="6" height="1" fill="#adb5bd" />
          <circle cx="10" cy="11" r="2.5" fill="#fcc419" />
          <polygon points="9,13 10,16 11,13" fill="#e03131" />
        </svg>
      )
    case 'gauge':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <path d="M2 12 A6 6 0 0 1 14 12" stroke="#adb5bd" strokeWidth="2" fill="none" />
          <path d="M2 12 A6 6 0 0 1 6 6" stroke="#40c057" strokeWidth="2" fill="none" />
          <path d="M6 6 A6 6 0 0 1 10 6" stroke="#fab005" strokeWidth="2" fill="none" />
          <path d="M10 6 A6 6 0 0 1 14 12" stroke="#fa5252" strokeWidth="2" fill="none" />
          <circle cx="8" cy="12" r="1.5" fill="#212529" />
          <line x1="8" y1="12" x2="11" y2="7" stroke="#e03131" strokeWidth="1.5" />
        </svg>
      )
    case 'clipboardA':
      return (
        <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges">
          <rect x="3" y="3" width="10" height="12" rx="1" fill="#e7f5ff" stroke="#1864ab" strokeWidth="1" />
          <rect x="6" y="1" width="4" height="2" fill="#868e96" />
          <text x="8" y="11" fontSize="7" fontWeight="bold" fill="#e03131" textAnchor="middle" fontFamily="sans-serif">
            A+
          </text>
        </svg>
      )
  }
}

interface ChapterThreeFeedbackProps {
  lesson: Lesson
  question: number
  onContinue: () => void
}

interface CodeLineProps {
  line: string
}

function CodeLine({ line }: CodeLineProps) {
  const keyword = /^(\s*)(if|else if|else)\b(.*)$/.exec(line)
  if (keyword) {
    const [, space, word, rest] = keyword
    const condition = /^(\s*\()(.*)(\).*)$/.exec(rest)
    return (
      <span className="ch3-workflow-code-line">
        {space}
        <span className="ch3-workflow-code-keyword">{word}</span>
        {condition ? (
          <>
            {condition[1]}
            <span className="ch3-workflow-code-condition">{condition[2]}</span>
            {condition[3]}
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
      <span className="ch3-workflow-code-line">
        {call[1]}
        <span className="ch3-workflow-code-call">{call[2]}</span>
      </span>
    )
  }
  return <span className="ch3-workflow-code-line">{line || '\u00A0'}</span>
}

function renderActionText(action: string) {
  if (action === 'ShowNeedsImprovement();') {
    return (
      <>
        ShowNeeds
        <br />
        Improvement();
      </>
    )
  }
  if (action === 'PartialScholarship();') {
    return (
      <>
        Partial
        <br />
        Scholarship();
      </>
    )
  }
  if (action === 'FullScholarship();') {
    return (
      <>
        Full
        <br />
        Scholarship();
      </>
    )
  }
  return action
}

const LANDSCAPE_WIDTH = 1220
const LANDSCAPE_HEIGHT = 780
const PORTRAIT_WIDTH = 860
const PORTRAIT_HEIGHT = 920

function ChapterThreeFeedback({
  lesson,
  question,
  onContinue,
}: ChapterThreeFeedbackProps) {
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
      setScale(Math.min(width / dw, height / dh, 1.45))
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(box)
    return () => watch.disconnect()
  }, [])

  const core = lesson.core
  if (!core) return null

  const isMission1 = lesson.mission === 1
  const isMission2 = lesson.mission === 2
  const isMission3 = lesson.mission === 3
  const isMission4 = lesson.mission === 4
  const isMission5 = lesson.mission === 5
  const choiceQuestion = isMission1 && question === 1

  const incorrect = 'if...else'
  const correct = 'else if'
  const meaning =
    'The else if statement is used when there are more than two possible outcomes.'

  // Full Canva "UNDERSTAND THE CODE" Workflow aligned directly with mission 1-5 diagrams
  const code = lesson.code ?? ''
  const subtitle = choiceQuestion
    ? 'WHY USE ELSE IF?'
    : isMission5
      ? 'EVALUATE THE SCORE'
      : isMission4
        ? 'AWARD THE MEDALS'
        : isMission3
          ? 'CHECK INTERNET SPEED'
          : isMission2
            ? 'SCHOLARSHIP QUALIFICATION'
            : 'EVALUATE LABORATORY SCORES'

  const label = choiceQuestion
    ? 'CHAPTER 3 MISSION 1 · PART 1'
    : `CHAPTER 3 MISSION ${lesson.mission}`

  const footerBadgeIcon: WorkflowIcon = isMission5
    ? 'report'
    : isMission4
      ? 'trophy'
      : isMission3
        ? 'gauge'
        : isMission2
          ? 'cert'
          : 'clipboardA'

  // Code anatomy chips and descriptions matching each Canva graphic
  const parts: {
    chip: string
    tone: 'blue' | 'green' | 'yellow' | 'pink' | 'purple'
    text: string
    icon: WorkflowIcon
  }[] = isMission5
    ? [
        { chip: 'if', tone: 'blue', text: 'Checks the first condition.', icon: 'bulb' },
        { chip: 'score >= 90', tone: 'green', text: 'If true, show Excellent.', icon: 'check' },
        { chip: 'ShowExcellent();', tone: 'yellow', text: 'Displays the Excellent result.', icon: 'trophy' },
        { chip: 'else if', tone: 'pink', text: 'Checks another condition when previous is false.', icon: 'branch' },
        { chip: 'score >= 80', tone: 'purple', text: 'If true, show Very Good.', icon: 'check' },
        { chip: 'ShowVeryGood();', tone: 'yellow', text: 'Displays the Very Good result.', icon: 'silverMedal' },
        { chip: 'score >= 75', tone: 'green', text: 'If true, show Good.', icon: 'check' },
        { chip: 'ShowGood();', tone: 'yellow', text: 'Displays the Good result.', icon: 'bronzeMedal' },
        { chip: 'else', tone: 'pink', text: 'Runs if none of the conditions above are true.', icon: 'branch' },
        { chip: 'ShowNeedsImprovement();', tone: 'purple', text: 'Displays Needs Improvement.', icon: 'report' },
      ]
    : isMission4
      ? [
          { chip: 'if', tone: 'blue', text: 'Checks the first condition.', icon: 'bulb' },
          { chip: 'score >= 95', tone: 'green', text: 'If true, award gold.', icon: 'check' },
          { chip: 'AwardGold();', tone: 'yellow', text: 'Gives the gold award.', icon: 'goldMedal' },
          { chip: 'else if', tone: 'pink', text: 'Checks another condition if the first one is false.', icon: 'branch' },
          { chip: 'score >= 85', tone: 'purple', text: 'If true, award silver.', icon: 'check' },
          { chip: 'AwardSilver();', tone: 'yellow', text: 'Gives the silver award.', icon: 'silverMedal' },
          { chip: 'else', tone: 'pink', text: 'Runs if none of the conditions above are true.', icon: 'branch' },
          { chip: 'AwardBronze();', tone: 'purple', text: 'Gives the bronze award.', icon: 'bronzeMedal' },
        ]
      : isMission3
        ? [
            { chip: 'if', tone: 'blue', text: 'Checks the first condition.', icon: 'bulb' },
            { chip: 'speed >= 100', tone: 'green', text: 'If true, the speed is excellent.', icon: 'check' },
            { chip: 'ShowExcellent();', tone: 'yellow', text: 'Displays the excellent result.', icon: 'star' },
            { chip: 'else if', tone: 'pink', text: 'Checks another condition if the first one is false.', icon: 'branch' },
            { chip: 'speed >= 50', tone: 'purple', text: 'If true, the speed is good.', icon: 'check' },
            { chip: 'ShowGood();', tone: 'yellow', text: 'Displays the good result.', icon: 'docUp' },
            { chip: 'else', tone: 'pink', text: 'Runs when none of the conditions are true.', icon: 'branch' },
            { chip: 'ShowPoor();', tone: 'purple', text: 'Displays the poor result.', icon: 'chart' },
          ]
        : isMission2
          ? [
              { chip: 'if', tone: 'blue', text: 'Checks the first condition.', icon: 'bulb' },
              { chip: 'gpa <= 1.25', tone: 'green', text: 'If true, the student gets a full scholarship.', icon: 'check' },
              { chip: 'FullScholarship();', tone: 'yellow', text: 'Displays the full scholarship result.', icon: 'star' },
              { chip: 'else if', tone: 'pink', text: 'Checks another condition if the first one is false.', icon: 'branch' },
              { chip: 'gpa <= 1.75', tone: 'purple', text: 'If true, the student gets a partial scholarship.', icon: 'check' },
              { chip: 'PartialScholarship();', tone: 'yellow', text: 'Displays the partial scholarship result.', icon: 'docUp' },
              { chip: 'else', tone: 'pink', text: 'Runs when none of the conditions are true.', icon: 'branch' },
              { chip: 'NotQualified();', tone: 'purple', text: 'Displays that the student is not qualified.', icon: 'chart' },
            ]
          : [
              { chip: 'if', tone: 'blue', text: 'Checks the first condition.', icon: 'bulb' },
              { chip: 'score >= 90', tone: 'green', text: 'If true, the score is excellent.', icon: 'check' },
              { chip: 'ShowExcellent();', tone: 'yellow', text: 'Displays the excellent result.', icon: 'star' },
              { chip: 'else if', tone: 'pink', text: 'Checks another condition if the first one is false.', icon: 'branch' },
              { chip: 'score >= 75', tone: 'purple', text: 'If true, the student passed.', icon: 'check' },
              { chip: 'ShowPassed();', tone: 'yellow', text: 'Displays the passed result.', icon: 'docUp' },
              { chip: 'else', tone: 'pink', text: 'Runs when none of the conditions are true.', icon: 'branch' },
              { chip: 'ShowNeedsImprovement();', tone: 'purple', text: 'Displays that improvement is needed.', icon: 'chart' },
            ]

  // Flowchart labels for Missions 1-4
  const checkLabel = isMission4
    ? 'Check score'
    : isMission3
      ? 'Check speed'
      : isMission2
        ? 'Check GPA'
        : 'Check score'

  const firstDiamond = isMission4
    ? 'score >= 95?'
    : isMission3
      ? 'speed >= 100?'
      : isMission2
        ? 'gpa <= 1.25?'
        : 'score >= 90?'

  const firstAction = isMission4
    ? 'AwardGold();'
    : isMission3
      ? 'ShowExcellent();'
      : isMission2
        ? 'FullScholarship();'
        : 'ShowExcellent();'

  const firstOutcomeTitle = isMission4
    ? 'Gold'
    : isMission2
      ? 'Full Scholarship'
      : 'Excellent'

  const firstOutcomeIcon: WorkflowIcon = isMission4 ? 'goldMedal' : 'star'

  const secondDiamond = isMission4
    ? 'score >= 85?'
    : isMission3
      ? 'speed >= 50?'
      : isMission2
        ? 'gpa <= 1.75?'
        : 'score >= 75?'

  const secondAction = isMission4
    ? 'AwardSilver();'
    : isMission3
      ? 'ShowGood();'
      : isMission2
        ? 'PartialScholarship();'
        : 'ShowPassed();'

  const secondOutcomeTitle = isMission4
    ? 'Silver'
    : isMission3
      ? 'Good'
      : isMission2
        ? 'Partial Scholarship'
        : 'Passed'

  const secondOutcomeIcon: WorkflowIcon = isMission4
    ? 'silverMedal'
    : isMission3
      ? 'wifi'
      : 'docUp'

  const thirdAction = isMission4
    ? 'AwardBronze();'
    : isMission3
      ? 'ShowPoor();'
      : isMission2
        ? 'NotQualified();'
        : 'ShowNeedsImprovement();'

  const thirdOutcomeTitle = isMission4
    ? 'Bronze'
    : isMission3
      ? 'Poor'
      : isMission2
        ? 'Not Qualified'
        : 'Needs Improvement'

  const thirdOutcomeIcon: WorkflowIcon = isMission4 ? 'bronzeMedal' : 'chart'

  const showLeftPanel = !isMobile || mobileTab === 'concept' || mobileTab === 'all'
  const showRightPanel = !isMobile || mobileTab === 'flow' || mobileTab === 'all'
  const isSingleTab = isMobile && mobileTab !== 'all'

  return (
    <div
      className={`ch3-workflow-screen ${isMobile ? 'is-mobile' : ''}`}
      role="dialog"
      aria-label="Understand the code"
      ref={screen}
    >
      <div
        className={`ch3-workflow-card ${isMobile ? 'is-mobile' : isLandscape ? 'is-landscape' : 'is-portrait'} ${isSingleTab ? 'single-tab' : ''}`}
        style={isMobile ? undefined : { transform: `scale(${scale})` }}
      >
        {/* Top Header with Cap & Books */}
        <div className="ch3-workflow-header-wrap">
          <div className="ch3-header-cap-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <polygon points="10,2 19,7 10,12 1,7" fill="#1864ab" />
              <polygon points="10,4 17,7 10,10 3,7" fill="#339af0" />
              <rect x="5" y="9" width="10" height="4" rx="2" fill="#1864ab" />
              <line x1="17" y1="7" x2="18" y2="14" stroke="#ffd43b" strokeWidth="1.5" />
              <circle cx="18" cy="14" r="1.5" fill="#fcc419" />
            </svg>
          </div>
          <div className="ch3-header-center">
            <h2 className="ch3-workflow-title">
              {choiceQuestion ? 'UNDERSTAND THE CORE' : 'UNDERSTAND THE CODE'}
            </h2>
            <div className="ch3-workflow-subtitle-pill">{subtitle}</div>
          </div>
          <div className="ch3-header-books-icon" aria-hidden="true">
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
          <div className="ch3-mobile-tabs" role="tablist">
            <button
              type="button"
              className={`ch3-mobile-tab ${mobileTab === 'all' ? 'active' : ''}`}
              onClick={() => setMobileTab('all')}
            >
              ALL
            </button>
            <button
              type="button"
              className={`ch3-mobile-tab ${mobileTab === 'concept' ? 'active' : ''}`}
              onClick={() => setMobileTab('concept')}
            >
              {choiceQuestion ? 'THE CONCEPT' : 'THE CODE'}
            </button>
            <button
              type="button"
              className={`ch3-mobile-tab ${mobileTab === 'flow' ? 'active' : ''}`}
              onClick={() => setMobileTab('flow')}
            >
              PROGRAM FLOW
            </button>
          </div>
        )}

        <div className="ch3-workflow-panels">
          {/* Left Panel: THE CODE or THE CONCEPT */}
          {showLeftPanel && (
            <section className="ch3-workflow-panel ch3-workflow-panel-code">
            <h3 className="ch3-workflow-panel-head">
              {choiceQuestion ? 'THE CONCEPT' : 'THE CODE'}
            </h3>

            {choiceQuestion ? (
              <div className="ch3-concept-container">
                <div className="ch3-concept-callout">
                  <span className="ch3-concept-rule-badge">RULE</span>
                  <p className="ch3-concept-rule-text">
                    {meaning}
                  </p>
                </div>

                <div className="ch3-concept-compare-grid">
                  <div className="ch3-concept-card ch3-concept-wrong">
                    <span className="ch3-concept-card-title">INCORRECT</span>
                    <span className="ch3-concept-chip ch3-chip-red">{incorrect}</span>
                    <p className="ch3-concept-card-desc">
                      An if...else statement can only branch into two directions.
                    </p>
                  </div>
                  <div className="ch3-concept-card ch3-concept-right">
                    <span className="ch3-concept-card-title">CORRECT</span>
                    <span className="ch3-concept-chip ch3-chip-green">{correct}</span>
                    <p className="ch3-concept-card-desc">
                      The else if keyword introduces additional conditional branches.
                    </p>
                  </div>
                </div>

                <div className="ch3-workflow-window ch3-concept-window">
                  <span className="ch3-workflow-window-bar" aria-hidden="true">
                    <i className="ch3-workflow-dot ch3-workflow-dot-red" />
                    <i className="ch3-workflow-dot ch3-workflow-dot-yellow" />
                    <i className="ch3-workflow-dot ch3-workflow-dot-green" />
                  </span>
                  <pre className="ch3-workflow-code">
                    {code.split('\n').map((line, i) => (
                      <CodeLine key={i} line={line} />
                    ))}
                  </pre>
                </div>
              </div>
            ) : (
              <>
                <div className="ch3-workflow-window">
                  <span className="ch3-workflow-window-bar" aria-hidden="true">
                    <i className="ch3-workflow-dot ch3-workflow-dot-red" />
                    <i className="ch3-workflow-dot ch3-workflow-dot-yellow" />
                    <i className="ch3-workflow-dot ch3-workflow-dot-green" />
                  </span>
                  <pre className="ch3-workflow-code">
                    {code.split('\n').map((line, i) => (
                      <CodeLine key={i} line={line} />
                    ))}
                  </pre>
                </div>

                <ul className="ch3-workflow-parts">
                  {parts.map((part, idx) => (
                    <li
                      key={part.chip + idx}
                      className={`ch3-workflow-part ch3-workflow-part-${part.tone}`}
                    >
                      <span className="ch3-workflow-chip">{part.chip}</span>
                      <span className="ch3-workflow-part-text">{part.text}</span>
                      <span className="ch3-workflow-part-icon">
                        <PixelArtIcon name={part.icon} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

          {/* Right Panel: PROGRAM FLOW */}
          {showRightPanel && (
            <section className="ch3-workflow-panel ch3-workflow-panel-flow">
            <h3 className="ch3-workflow-panel-head">PROGRAM FLOW</h3>
            <div className="ch3-workflow-flow-scroll">
              {isMission5 ? (
                /* 4-Tier Cascading Flow matching Mission 5 Canva diagram */
                <div className="ch3-canva-flow ch3-canva-flow-t4">
                  <span className="ch3-canva-pill ch3-canva-pill-start">START</span>
                  <span className="ch3-canva-arrow ch3-canva-arrow-blue">&darr;</span>

                  <div className="ch3-canva-check-box">{checkLabel}</div>
                  <span className="ch3-canva-arrow ch3-canva-arrow-blue">&darr;</span>

                  {/* Tier 1: score >= 90? */}
                  <div className="ch3-canva-diamond">score &gt;= 90?</div>
                  <div className="ch3-canva-t4-grid">
                    {/* Left: YES branch */}
                    <div className="ch3-canva-t4-yes-col">
                      <span className="ch3-canva-branch-tag ch3-canva-tag-yes">YES</span>
                      <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                      <div className="ch3-canva-action-box">{renderActionText('ShowExcellent();')}</div>
                      <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                      <div className="ch3-canva-outcome-card ch3-canva-outcome-green">
                        <span className="ch3-canva-outcome-label">Excellent</span>
                        <span className="ch3-canva-outcome-icon">
                          <PixelArtIcon name="trophy" />
                        </span>
                      </div>
                      <div className="ch3-canva-long-stem ch3-canva-stem-green ch3-canva-stem-t1" />
                    </div>

                    {/* Right: NO branch */}
                    <div className="ch3-canva-t4-no-col">
                      <span className="ch3-canva-branch-tag ch3-canva-tag-no">NO</span>
                      <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>

                      {/* Tier 2: score >= 80? */}
                      <div className="ch3-canva-diamond">score &gt;= 80?</div>
                      <div className="ch3-canva-t4-grid">
                        <div className="ch3-canva-t4-yes-col">
                          <span className="ch3-canva-branch-tag ch3-canva-tag-yes">YES</span>
                          <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                          <div className="ch3-canva-action-box">{renderActionText('ShowVeryGood();')}</div>
                          <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                          <div className="ch3-canva-outcome-card ch3-canva-outcome-green">
                            <span className="ch3-canva-outcome-label">Very Good</span>
                            <span className="ch3-canva-outcome-icon">
                              <PixelArtIcon name="silverMedal" />
                            </span>
                          </div>
                          <div className="ch3-canva-long-stem ch3-canva-stem-green ch3-canva-stem-t2" />
                        </div>

                        <div className="ch3-canva-t4-no-col">
                          <span className="ch3-canva-branch-tag ch3-canva-tag-no">NO</span>
                          <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>

                          {/* Tier 3: score >= 75? */}
                          <div className="ch3-canva-diamond">score &gt;= 75?</div>
                          <div className="ch3-canva-t4-grid">
                            <div className="ch3-canva-t4-yes-col">
                              <span className="ch3-canva-branch-tag ch3-canva-tag-yes">YES</span>
                              <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                              <div className="ch3-canva-action-box">{renderActionText('ShowGood();')}</div>
                              <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                              <div className="ch3-canva-outcome-card ch3-canva-outcome-green">
                                <span className="ch3-canva-outcome-label">Good</span>
                                <span className="ch3-canva-outcome-icon">
                                  <PixelArtIcon name="bronzeMedal" />
                                </span>
                              </div>
                              <div className="ch3-canva-long-stem ch3-canva-stem-green ch3-canva-stem-t3" />
                            </div>

                            <div className="ch3-canva-t4-no-col">
                              <span className="ch3-canva-branch-tag ch3-canva-tag-no">NO</span>
                              <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>
                              <div className="ch3-canva-action-box">{renderActionText('ShowNeedsImprovement();')}</div>
                              <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>
                              <div className="ch3-canva-outcome-card ch3-canva-outcome-red">
                                <span className="ch3-canva-outcome-label">Needs Improvement</span>
                                <span className="ch3-canva-outcome-icon">
                                  <PixelArtIcon name="report" />
                                </span>
                              </div>
                              <div className="ch3-canva-long-stem ch3-canva-stem-red ch3-canva-stem-t3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Convergence bar */}
                  <div className="ch3-canva-merge-bar" />
                  <span className="ch3-canva-arrow ch3-canva-arrow-blue">&darr;</span>
                  <span className="ch3-canva-pill ch3-canva-pill-end">END</span>
                </div>
              ) : (
                /* Exact 3-Branch Flow matching Mission 1-4 Canva diagrams */
                <div className="ch3-canva-flow ch3-canva-flow-3branch">
                  <span className="ch3-canva-pill ch3-canva-pill-start">START</span>
                  <span className="ch3-canva-arrow ch3-canva-arrow-blue">&darr;</span>

                  <div className="ch3-canva-check-box">{checkLabel}</div>
                  <span className="ch3-canva-arrow ch3-canva-arrow-blue">&darr;</span>

                  {/* Diamond 1 */}
                  <div className="ch3-canva-diamond">{firstDiamond}</div>

                  <div className="ch3-canva-split-row">
                    {/* Left branch: YES -> Action 1 -> Outcome 1 */}
                    <div className="ch3-canva-branch-lane">
                      <span className="ch3-canva-branch-tag ch3-canva-tag-yes">YES</span>
                      <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                      <div className="ch3-canva-action-box">{renderActionText(firstAction)}</div>
                      <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                      <div className="ch3-canva-outcome-card ch3-canva-outcome-green">
                        <span className="ch3-canva-outcome-label">{firstOutcomeTitle}</span>
                        <span className="ch3-canva-outcome-icon">
                          <PixelArtIcon name={firstOutcomeIcon} />
                        </span>
                      </div>
                      <div className="ch3-canva-stem-to-end ch3-canva-stem-green" />
                    </div>

                    {/* Right branch: NO -> Diamond 2 */}
                    <div className="ch3-canva-branch-lane ch3-canva-no-lane">
                      <span className="ch3-canva-branch-tag ch3-canva-tag-no">NO</span>
                      <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>

                      <div className="ch3-canva-diamond">{secondDiamond}</div>

                      <div className="ch3-canva-sub-split">
                        {/* Sub YES: Action 2 -> Outcome 2 */}
                        <div className="ch3-canva-branch-lane">
                          <span className="ch3-canva-branch-tag ch3-canva-tag-yes">YES</span>
                          <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                          <div className="ch3-canva-action-box">{renderActionText(secondAction)}</div>
                          <span className="ch3-canva-arrow ch3-canva-arrow-green">&darr;</span>
                          <div className="ch3-canva-outcome-card ch3-canva-outcome-green">
                            <span className="ch3-canva-outcome-label">{secondOutcomeTitle}</span>
                            <span className="ch3-canva-outcome-icon">
                              <PixelArtIcon name={secondOutcomeIcon} />
                            </span>
                          </div>
                          <div className="ch3-canva-stem-to-end ch3-canva-stem-green" />
                        </div>

                        {/* Sub NO: Action 3 -> Outcome 3 */}
                        <div className="ch3-canva-branch-lane">
                          <span className="ch3-canva-branch-tag ch3-canva-tag-no">NO</span>
                          <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>
                          <div className="ch3-canva-action-box">{renderActionText(thirdAction)}</div>
                          <span className="ch3-canva-arrow ch3-canva-arrow-red">&darr;</span>
                          <div className="ch3-canva-outcome-card ch3-canva-outcome-red">
                            <span className="ch3-canva-outcome-label">{thirdOutcomeTitle}</span>
                            <span className="ch3-canva-outcome-icon">
                              <PixelArtIcon name={thirdOutcomeIcon} />
                            </span>
                          </div>
                          <div className="ch3-canva-stem-to-end ch3-canva-stem-red" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Convergence bar */}
                  <div className="ch3-canva-merge-bar" />
                  <span className="ch3-canva-arrow ch3-canva-arrow-blue">&darr;</span>
                  <span className="ch3-canva-pill ch3-canva-pill-end">END</span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

        {/* Key Takeaway Banner (Mission 5) */}
        {isMission5 && (
          <div className="ch3-canva-key-takeaway">
            <span className="ch3-takeaway-star">★</span>
            <span className="ch3-takeaway-title">KEY TAKEAWAY:</span>
            <span className="ch3-takeaway-body">
              Use else if to check multiple conditions in order. If none are true, else runs.
            </span>
            <span className="ch3-takeaway-star">★</span>
          </div>
        )}

        {/* Bottom Banner with Books & Mission Badge */}
        <footer className="ch3-workflow-footer">
          <div className="ch3-footer-books">
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <rect x="2" y="11" width="15" height="4" fill="#2b8a3e" rx="1" />
              <rect x="3" y="6" width="14" height="4" fill="#c92a2a" rx="1" />
              <line x1="3" y1="7" x2="16" y2="7" stroke="#fff" strokeWidth="0.8" />
              <line x1="2" y1="12" x2="16" y2="12" stroke="#fff" strokeWidth="0.8" />
            </svg>
          </div>
          <div className="ch3-workflow-badge-pill">
            <span className="ch3-badge-star">★</span>
            <span className="ch3-badge-text">{label}</span>
            <span className="ch3-badge-star">★</span>
          </div>
          <div className="ch3-footer-right-badge">
            <PixelArtIcon name={footerBadgeIcon} />
          </div>
          <button
            type="button"
            className="ch3-core-ok"
            onClick={onContinue}
          >
            OK
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ChapterThreeFeedback
