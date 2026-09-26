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

type CodePart = {
  text: string
  label: string
}

type FlowStep = {
  text: string
  cls: string
}

type CodeExplainedContent = {
  anatomy: CodePart[]
  flow: FlowStep[]
  // The closing line / key takeaway banner.
  takeaway: string
}

// Recap shown when a chapter unlocks: the previous lesson's building blocks
// broken down piece by piece (left) next to the same logic as a program flow
// (right). Chapter 1 ends on the teaser for if/else; Chapter 2 recaps the
// if/else statement itself.
const CONTENT: Record<number, CodeExplainedContent> = {
  1: {
    anatomy: [
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
    ],
    flow: [
      { text: 'START', cls: 'flow-point-start' },
      { text: 'Check isCompleted', cls: '' },
      { text: 'Is isCompleted == true?', cls: 'flow-decision' },
      { text: 'YES → SubmitActivity(); — Activity submitted', cls: 'flow-yes' },
      { text: 'NO — Activity not submitted', cls: 'flow-no' },
      { text: 'END', cls: 'flow-point-end' },
    ],
    takeaway:
      'Does this breakdown help clarify how conditional statements operate, or would you like to explore how to write an else statement to handle the "NO" path in code?',
  },
  2: {
    anatomy: [
      { text: 'if', label: 'Checks if the condition is true.' },
      { text: 'correctPassword', label: 'The condition to check.' },
      {
        text: 'ConnectWiFi();',
        label: 'Runs when the password is correct.',
      },
      { text: 'else', label: 'Runs when the condition is false.' },
      {
        text: 'DisplayConnectionError();',
        label: 'Shows a connection error message.',
      },
    ],
    flow: [
      { text: 'START', cls: 'flow-point-start' },
      { text: 'Check correctPassword', cls: '' },
      { text: 'correctPassword == true?', cls: 'flow-decision' },
      { text: 'YES → ConnectWiFi(); · WiFi Connected', cls: 'flow-yes' },
      {
        text: 'NO → DisplayConnectionError(); · Connection Error',
        cls: 'flow-no',
      },
      { text: 'END', cls: 'flow-point-end' },
    ],
    takeaway:
      'Use an if/else statement to give the program two different paths. If the condition is true, it does one thing; if the condition is false, it does something else.',
  },
}

function CodeExplained({ chapter, onContinue, onJournal }: CodeExplainedProps) {
  const content = CONTENT[chapter]
  const nextChapter = chapter + 1

  if (!content) return null

  return (
    <div className="ce-screen">
      <div className="core-card ce-card">
        <p className="ce-kicker">CHAPTER {nextChapter} · UNLOCKED</p>
        <h2 className="core-title">THE CODE EXPLAINED</h2>

        <div className="core-lower">
          <section className="core-block">
            <h3 className="core-block-title">BREAKING DOWN THE CODE</h3>
            <div className="core-anatomy">
              {content.anatomy.map((part, i) => (
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
              {content.flow.map((step, i) => (
                <li key={i} className={`core-flow-step ${step.cls}`}>
                  <span className="flow-step-text">{step.text}</span>
                  {i < content.flow.length - 1 && (
                    <span className="flow-arrow" aria-hidden="true">
                      ↓
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <p className="core-takeaway">{content.takeaway}</p>

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
