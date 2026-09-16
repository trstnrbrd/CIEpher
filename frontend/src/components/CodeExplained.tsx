import './CoreBreakdown.css'
import './CodeExplained.css'

interface CodeExplainedProps {
  // The chapter that was just cleared; names the next one being unlocked.
  chapter: number
  // Close the screen and move on.
  onContinue: () => void
  // The Code Journal gained a new lesson once the chapter completed.
  onJournal: () => void
}

// The if statement's building blocks, recapped when Chapter 2 unlocks.
const ANATOMY: { text: string; label: string }[] = [
  {
    text: 'if',
    label:
      'This keyword acts as a trigger. It tells the program that it needs to make a decision based on what follows.',
  },
  {
    text: '(isCompleted)',
    label:
      'This is the specific condition the program is checking. It evaluates whether this status is true or false.',
  },
  {
    text: '{ }',
    label:
      'These encapsulate a block of logic. Any code placed inside these brackets will only execute if the condition checked above is TRUE.',
  },
  {
    text: 'SubmitActivity();',
    label:
      'This is the actual action or function the program will perform if the condition is met.',
  },
]

const FLOW: { text: string; cls: string }[] = [
  { text: 'START', cls: 'flow-point-start' },
  { text: 'Check isCompleted', cls: '' },
  { text: 'Is isCompleted == true?', cls: 'flow-decision' },
  { text: 'YES → SubmitActivity(); — Activity submitted', cls: 'flow-yes' },
  { text: 'NO — Activity not submitted', cls: 'flow-no' },
  { text: 'END', cls: 'flow-point-end' },
]

// The recap shown instead of the padlock celebration when Chapter 2 unlocks:
// the if statement broken down piece by piece (left) next to the same logic
// as a program flow (right), with a teaser for the else statement.
function CodeExplained({ chapter, onContinue, onJournal }: CodeExplainedProps) {
  const nextChapter = chapter + 1

  return (
    <div className="ce-screen">
      <div className="core-card ce-card">
        <p className="ce-kicker">CHAPTER {nextChapter} · UNLOCKED</p>
        <h2 className="core-title">THE CODE EXPLAINED</h2>

        <div className="core-lower">
          <section className="core-block">
            <h3 className="core-block-title">BREAKING DOWN THE CODE</h3>
            <div className="core-anatomy">
              {ANATOMY.map((part, i) => (
                <div key={i} className="core-anatomy-row">
                  <span className={`core-anatomy-chip anatomy-${i}`}>
                    {part.text}
                  </span>
                  <span className="core-anatomy-label">{part.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="core-block">
            <h3 className="core-block-title">THE PROGRAM FLOW</h3>
            <ol className="core-flow">
              {FLOW.map((step, i) => (
                <li
                  key={i}
                  className={`core-flow-step ${step.cls}`}
                >
                  <span className="flow-step-text">{step.text}</span>
                  {i < FLOW.length - 1 && (
                    <span className="flow-arrow" aria-hidden="true">
                      ↓
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <p className="core-takeaway">
          Does this breakdown help clarify how conditional statements operate,
          or would you like to explore how to write an else statement to
          handle the &ldquo;NO&rdquo; path in code?
        </p>

        <div className="ce-actions">
          <button
            type="button"
            className="pixel-button ce-journal-btn"
            onClick={onJournal}
          >
            📖 CODE JOURNAL UPDATED — CLICK TO LEARN
          </button>
          <button
            type="button"
            className="pixel-button core-ok"
            onClick={onContinue}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  )
}

export default CodeExplained