import type { Lesson } from '../lessons'
import './ChapterThreeFeedback.css'

interface ChapterThreeFeedbackProps {
  lesson: Lesson
  question: number
  onContinue: () => void
}

// Chapter 3 has its own lesson screen. The flow makes the two decisions
// visible at once, which is the important difference between else-if and the
// two-path if...else lesson in Chapter 2.
function ChapterThreeFeedback({
  lesson,
  question,
  onContinue,
}: ChapterThreeFeedbackProps) {
  const core = lesson.core
  if (!core) return null

  const choiceQuestion = question === 1
  const incorrect = choiceQuestion ? 'if...else' : core.incorrectExample
  const correct = choiceQuestion ? 'else if' : (lesson.code ?? 'else if')
  const meaning = choiceQuestion
    ? 'The else if statement is used when there are more than two possible outcomes.'
    : 'The else if statement allows a program to evaluate multiple conditions in sequence until one condition is true.'

  return (
    <div className="chapter-three-feedback" role="dialog" aria-modal="true">
      <section
        className="chapter-three-feedback-card"
        aria-labelledby="chapter-three-feedback-title"
      >
        <header className="chapter-three-feedback-header">
          <p>LESSON 3 · DECISION PATHS</p>
          <h2 id="chapter-three-feedback-title">UNDERSTAND THE CORE</h2>
        </header>

        <p className="chapter-three-feedback-valid">✓ CORRECT</p>

        <section className="chapter-three-meaning">
          <h3>WHY USE ELSE IF?</h3>
          <p>{meaning}</p>
        </section>

        <div className="chapter-three-compare">
          <section className="chapter-three-code-card is-wrong">
            <p>INCORRECT</p>
            <pre>{incorrect}</pre>
            <span>
              {choiceQuestion
                ? 'if...else only gives the program two paths.'
                : core.incorrectNote}
            </span>
          </section>
          <section className="chapter-three-code-card is-correct">
            <p>CORRECT</p>
            <pre>{correct}</pre>
            <span>
              {choiceQuestion
                ? 'else if checks another condition when the first one is false.'
                : core.correctNote}
            </span>
          </section>
        </div>

        <section
          className="chapter-three-program-flow"
          aria-labelledby="chapter-three-program-flow-title"
        >
          <h3 id="chapter-three-program-flow-title">PROGRAM FLOW</h3>
          <div
            className="chapter-three-flow"
            role="img"
            aria-label={
              'Start, input score, check whether the score is at least 90, then check whether it is at least 75 if needed. The program displays Excellent, Passed, or Needs Improvement before ending.'
            }
          >
            <div className="chapter-three-flow-start">START</div>
            <span className="chapter-three-flow-arrow" aria-hidden="true">
              &darr;
            </span>
            <div className="chapter-three-flow-input">INPUT SCORE</div>
            <span className="chapter-three-flow-arrow" aria-hidden="true">
              &darr;
            </span>
            <div className="chapter-three-flow-decision">IS SCORE &ge; 90?</div>
            <div className="chapter-three-flow-primary-branches">
              <div className="chapter-three-flow-lane">
                <span className="chapter-three-flow-route is-yes">YES</span>
                <span className="chapter-three-flow-arrow" aria-hidden="true">
                  &darr;
                </span>
                <div className="chapter-three-flow-outcome is-excellent">
                  DISPLAY &quot;EXCELLENT&quot;
                </div>
                <span className="chapter-three-flow-arrow" aria-hidden="true">
                  &darr;
                </span>
                <div className="chapter-three-flow-end">END</div>
              </div>
              <div className="chapter-three-flow-next-check">
                <span className="chapter-three-flow-route is-no">NO</span>
                <span className="chapter-three-flow-arrow" aria-hidden="true">
                  &darr;
                </span>
                <div className="chapter-three-flow-decision">
                  IS SCORE &ge; 75?
                </div>
                <div className="chapter-three-flow-secondary-branches">
                  <div className="chapter-three-flow-lane">
                    <span className="chapter-three-flow-route is-yes">YES</span>
                    <span
                      className="chapter-three-flow-arrow"
                      aria-hidden="true"
                    >
                      &darr;
                    </span>
                    <div className="chapter-three-flow-outcome is-passed">
                      DISPLAY &quot;PASSED&quot;
                    </div>
                    <span
                      className="chapter-three-flow-arrow"
                      aria-hidden="true"
                    >
                      &darr;
                    </span>
                    <div className="chapter-three-flow-end">END</div>
                  </div>
                  <div className="chapter-three-flow-lane">
                    <span className="chapter-three-flow-route is-no">NO</span>
                    <span
                      className="chapter-three-flow-arrow"
                      aria-hidden="true"
                    >
                      &darr;
                    </span>
                    <div className="chapter-three-flow-outcome is-needs-improvement">
                      DISPLAY &quot;NEEDS IMPROVEMENT&quot;
                    </div>
                    <span
                      className="chapter-three-flow-arrow"
                      aria-hidden="true"
                    >
                      &darr;
                    </span>
                    <div className="chapter-three-flow-end">END</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          className="pixel-button chapter-three-feedback-next"
          onClick={onContinue}
        >
          {choiceQuestion ? 'CONTINUE' : 'OK'}
        </button>
      </section>
    </div>
  )
}

export default ChapterThreeFeedback
