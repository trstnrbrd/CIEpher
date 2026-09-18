import { useEffect, useRef, useState } from 'react'
import './CodeWorkflow.css'

// One piece of the code with its explanation, as the poster shows it: a
// coloured chip on the left, the explanation beside it, a small icon.
export interface WorkflowPart {
  chip: string
  tone: 'blue' | 'green' | 'yellow' | 'pink'
  text: string
  icon: WorkflowIcon
}

// The whole "UNDERSTAND THE CODE" poster for one mission. Every mission fills
// the same shape, so they all come out looking the same.
export interface Workflow {
  // The line under the title, e.g. ENTER THE UNIVERSITY.
  subtitle: string
  parts: WorkflowPart[]
  // The flow chart: what is checked, the question, and both answers.
  check: string
  condition: string
  // What runs when the condition is true: the call, then what happens.
  yes: [string, string]
  // What the player sees when it is false.
  no: string
  // The ribbon at the bottom, e.g. CHAPTER 1 MISSION 1.
  label: string
}

// Small pixel icons, drawn as squares so they match the game's art instead
// of the system emoji.
export type WorkflowIcon = 'bulb' | 'check' | 'doc' | 'clip'

const ICONS: Record<WorkflowIcon, { fill: string; cells: string }[]> = {
  bulb: [
    {
      fill: '#ffd23f',
      cells:
        '3,1 4,1 5,1 6,1 2,2 3,2 4,2 5,2 6,2 7,2 2,3 3,3 4,3 5,3 6,3 7,3 2,4 3,4 4,4 5,4 6,4 7,4 3,5 4,5 5,5 6,5',
    },
    { fill: '#8d96ab', cells: '3,6 4,6 5,6 6,6 4,7 5,7 4,8 5,8' },
  ],
  check: [
    {
      fill: '#3fc463',
      cells:
        '1,1 2,1 3,1 4,1 5,1 6,1 7,1 8,1 1,2 2,2 3,2 4,2 5,2 6,2 7,2 8,2 1,3 2,3 3,3 4,3 5,3 6,3 7,3 8,3 1,4 2,4 3,4 4,4 5,4 6,4 7,4 8,4 1,5 2,5 3,5 4,5 5,5 6,5 7,5 8,5 1,6 2,6 3,6 4,6 5,6 6,6 7,6 8,6 1,7 2,7 3,7 4,7 5,7 6,7 7,7 8,7 1,8 2,8 3,8 4,8 5,8 6,8 7,8 8,8',
    },
    { fill: '#ffffff', cells: '2,5 3,6 4,7 5,6 6,5 7,4 8,3' },
  ],
  doc: [
    {
      fill: '#fffdf2',
      cells:
        '2,1 3,1 4,1 5,1 6,1 2,2 3,2 4,2 5,2 6,2 7,2 2,3 3,3 4,3 5,3 6,3 7,3 2,4 3,4 4,4 5,4 6,4 7,4 2,5 3,5 4,5 5,5 6,5 7,5 2,6 3,6 4,6 5,6 6,6 7,6 2,7 3,7 4,7 5,7 6,7 7,7 2,8 3,8 4,8 5,8 6,8 7,8',
    },
    { fill: '#8d96ab', cells: '3,3 4,3 5,3 6,3 3,5 4,5 5,5 6,5 3,7 4,7 5,7' },
  ],
  clip: [
    {
      fill: '#d98a33',
      cells:
        '1,1 2,1 3,1 6,1 7,1 8,1 1,2 2,2 3,2 4,2 5,2 6,2 7,2 8,2 1,3 8,3 1,4 8,4 1,5 8,5 1,6 8,6 1,7 8,7 1,8 2,8 3,8 4,8 5,8 6,8 7,8 8,8',
    },
    { fill: '#8d96ab', cells: '4,0 5,0 4,1 5,1' },
    {
      fill: '#fffdf2',
      cells:
        '2,3 3,3 4,3 5,3 6,3 7,3 2,4 3,4 4,4 5,4 6,4 7,4 2,5 3,5 4,5 5,5 6,5 7,5 2,6 3,6 4,6 5,6 6,6 7,6 2,7 3,7 4,7 5,7 6,7 7,7',
    },
    { fill: '#4c5468', cells: '3,4 4,4 5,4 6,4 3,6 4,6 5,6' },
  ],
}

function PixelIcon({ name }: { name: WorkflowIcon }) {
  return (
    <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      {ICONS[name].map((layer) =>
        layer.cells.split(' ').map((cell) => {
          const [x, y] = cell.split(',')
          return (
            <rect
              key={layer.fill + cell}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={layer.fill}
            />
          )
        }),
      )}
    </svg>
  )
}

interface CodeWorkflowProps {
  code: string
  workflow: Workflow
  onClose: () => void
}

// Colours the code the way the poster does: the keyword, the condition in
// the brackets, and the call inside the braces.
function CodeLine({ line }: { line: string }) {
  const keyword = /^(\s*)(if|else if|else|switch|while|do|for)\b(.*)$/.exec(
    line,
  )
  if (keyword) {
    const [, space, word, rest] = keyword
    const condition = /^(\s*\()(.*)(\).*)$/.exec(rest)
    return (
      <span className="workflow-code-line">
        {space}
        <span className="workflow-code-keyword">{word}</span>
        {condition ? (
          <>
            {condition[1]}
            <span className="workflow-code-condition">{condition[2]}</span>
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
      <span className="workflow-code-line">
        {call[1]}
        <span className="workflow-code-call">{call[2]}</span>
      </span>
    )
  }
  return <span className="workflow-code-line">{line}</span>
}

// The poster is laid out at its design size (the artwork's proportions) and
// then scaled to whatever room the screen has, so every part keeps its place
// exactly as drawn.
const DESIGN_WIDTH = 820
const DESIGN_HEIGHT = 1024

function CodeWorkflow({ code, workflow, onClose }: CodeWorkflowProps) {
  const screen = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const box = screen.current
    if (!box) return
    const fit = (): void => {
      const { width, height } = box.getBoundingClientRect()
      setScale(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT, 1.6))
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(box)
    return () => watch.disconnect()
  }, [])

  return (
    <div
      className="workflow-screen"
      role="dialog"
      aria-label="Understand the code"
      ref={screen}
    >
      <div className="workflow-card" style={{ transform: `scale(${scale})` }}>
        <h2 className="workflow-title">UNDERSTAND THE CODE</h2>
        <p className="workflow-subtitle">{workflow.subtitle}</p>

        <div className="workflow-panels">
          <section className="workflow-panel workflow-panel-code">
            <h3 className="workflow-panel-head">THE CODE</h3>
            <div className="workflow-window">
              <span className="workflow-window-bar" aria-hidden="true">
                <i className="workflow-dot workflow-dot-red" />
                <i className="workflow-dot workflow-dot-yellow" />
                <i className="workflow-dot workflow-dot-green" />
              </span>
              <pre className="workflow-code">
                {code.split('\n').map((line, i) => (
                  <CodeLine key={i} line={line} />
                ))}
              </pre>
            </div>

            <ul className="workflow-parts">
              {workflow.parts.map((part) => (
                <li
                  key={part.chip}
                  className={`workflow-part workflow-part-${part.tone}`}
                >
                  <span className="workflow-chip">{part.chip}</span>
                  <span className="workflow-part-text">{part.text}</span>
                  <span className="workflow-part-icon">
                    <PixelIcon name={part.icon} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="workflow-panel workflow-panel-flow">
            <h3 className="workflow-panel-head">PROGRAM FLOW</h3>
            <div className="workflow-flow">
              <span className="workflow-box workflow-box-start">START</span>
              <span className="workflow-arrow" aria-hidden="true" />
              <span className="workflow-box">{workflow.check}</span>
              <span className="workflow-arrow" aria-hidden="true" />
              <span className="workflow-diamond">{workflow.condition}</span>

              <div className="workflow-branches">
                <span className="workflow-split" aria-hidden="true" />
                <div className="workflow-branch workflow-branch-yes">
                  <span className="workflow-branch-label">YES</span>
                  <span className="workflow-box">{workflow.yes[0]}</span>
                  <span className="workflow-arrow" aria-hidden="true" />
                  <span className="workflow-box workflow-box-done">
                    {workflow.yes[1]}
                  </span>
                </div>
                <div className="workflow-branch workflow-branch-no">
                  <span className="workflow-branch-label">NO</span>
                  <span className="workflow-box workflow-box-stop">
                    {workflow.no}
                  </span>
                </div>
                <span className="workflow-join" aria-hidden="true" />
              </div>

              <span className="workflow-arrow" aria-hidden="true" />
              <span className="workflow-box workflow-box-end">END</span>
            </div>
          </section>
        </div>

        <p className="workflow-label">★ {workflow.label} ★</p>

        <button
          type="button"
          className="pixel-button core-ok"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  )
}

export default CodeWorkflow
