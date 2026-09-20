import { Fragment } from 'react'
import type { Mistake } from '../api/client'

// Server offsets use UTF-16 positions. Keep whole Unicode characters while
// tracking their string offsets, and insert zero-width markers for omissions.
export default function MistakeHighlight({
  answer,
  mistakes,
}: {
  answer: string
  mistakes: Mistake[]
}) {
  let offset = 0
  const missingAt = (position: number) =>
    mistakes.some(({ start, end }) => start === end && start === position)
  const marker = (
    <span className="hl-missing">
      <span>▏</span>
    </span>
  )

  return (
    <>
      {Array.from(answer).map((character) => {
        const start = offset
        offset += character.length
        const wrong = mistakes.some(
          (mistake) => mistake.start < offset && mistake.end > start,
        )
        return (
          <Fragment key={start}>
            {missingAt(start) && marker}
            <span className={wrong ? 'hl-red' : undefined}>{character}</span>
          </Fragment>
        )
      })}
      {missingAt(answer.length) && marker}
    </>
  )
}
