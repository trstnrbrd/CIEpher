import type { CoreBreakdown as CoreBreakdownData } from '../lessons'
import doorImg from '../assets/prologue/CloseDoor.png'
import './CoreBreakdown.css'

interface CoreBreakdownProps {
  // The correct syntax that was just accepted.
  code: string
  core: CoreBreakdownData
  onClose: () => void
}

// The "UNDERSTAND THE CORE" feedback screen after a correct answer:
// validation, a code explanation, the program flow, and the key takeaway.
function CoreBreakdown({ code, core, onClose }: CoreBreakdownProps) {
  return (
    <div className="core-screen">
      <div className="core-card">
        <h2 className="core-title">UNDERSTAND THE CORE</h2>

        <p className="core-valid">✓ {core.correctNote}</p>

        <div className="core-compare">
          <div className="core-panel core-panel-wrong">
            <p className="core-panel-tag">INCORRECT</p>
            <pre className="core-code core-code-wrong">
              {core.incorrectExample}
            </pre>
            <p className="core-note">{core.incorrectNote}</p>
          </div>
          <div className="core-panel core-panel-right">
            <p className="core-panel-tag">CORRECT</p>
            <pre className="core-code core-code-right">{code}</pre>
            <p className="core-note">✓ {core.correctNote}</p>
          </div>
        </div>

        <div className="core-lower">
          <section className="core-block">
            <h3 className="core-block-title">CODE EXPLANATION</h3>
            <div className="core-anatomy">
              {core.anatomy.map((part, i) => (
                <div key={i} className="core-anatomy-row">
                  <span
                    className={`core-anatomy-chip anatomy-${i}`}
                  >
                    {part.text}
                  </span>
                  <span className="core-anatomy-label">{part.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="core-block">
            <h3 className="core-block-title">PROGRAM FLOW</h3>
            <div className="core-flow-wrap">
              <ol className="core-flow">
                {core.flow.map((step, i) => (
                  <li
                    key={i}
                    className={`core-flow-step ${
                      i === 0
                        ? 'flow-point-start'
                        : i === core.flow.length - 1
                          ? 'flow-point-end'
                          : ''
                    }`}
                  >
                    <span className="flow-step-text">{step}</span>
                    {i < core.flow.length - 1 && (
                      <span className="flow-arrow" aria-hidden="true">
                        ↓
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              <img
                className="core-door"
                src={doorImg}
                alt="The bedroom door swinging open"
              />
            </div>
          </section>
        </div>

        <p className="core-takeaway">
          <strong>KEY TAKEAWAY:</strong> {core.takeaway}
        </p>

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

export default CoreBreakdown