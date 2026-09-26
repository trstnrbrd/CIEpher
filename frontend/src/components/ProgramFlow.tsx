import './CoreBreakdown.css'

interface ProgramFlowProps {
  // The code the player just typed and got accepted.
  code: string
  flow: string[]
  showValidation?: boolean
  onClose: () => void
}

// The "PROGRAM FLOW" popup shown after a correct answer to a readiness quiz
// mission: the accepted syntax and the vertical execution path, before the
// result appears. No anatomy breakdown — a quiz only traces the flow.
function ProgramFlow({
  code,
  flow,
  onClose,
  showValidation = true,
}: ProgramFlowProps) {
  return (
    <div className="core-screen">
      <div className="core-card">
        <h2 className="core-title">PROGRAM FLOW</h2>

        {showValidation && (
          <p className="core-valid">✓ CORRECT SYNTAX ACCEPTED</p>
        )}

        <pre className="core-code core-code-ok">{code}</pre>

        <div className="core-flow-wrap">
          <ol className="core-flow">
            {flow.map((step, i) => (
              <li
                key={i}
                className={`core-flow-step ${
                  i === 0
                    ? 'flow-point-start'
                    : i === flow.length - 1
                      ? 'flow-point-end'
                      : step.startsWith('YES')
                        ? 'flow-yes'
                        : step.startsWith('NO')
                          ? 'flow-no'
                          : ''
                }`}
              >
                <span className="flow-step-text">{step}</span>
                {i < flow.length - 1 && (
                  <span className="flow-arrow" aria-hidden="true">
                    ↓
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div
            className="core-terminal"
            role="img"
            aria-label="A computer terminal screen displaying a green prompt"
          >
            <div className="core-monitor">
              <div className="core-monitor-screen">
                <span className="terminal-prompt">C:\CIEPHER&gt;</span>
                <span className="terminal-caret" aria-hidden="true">
                  _
                </span>
              </div>
            </div>
            <div className="core-monitor-stand" aria-hidden="true" />
          </div>
        </div>

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

export default ProgramFlow
