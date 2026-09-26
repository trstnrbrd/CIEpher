import type { Lesson } from '../lessons'
import CoreBreakdown from './CoreBreakdown'

interface ChapterTwoFeedbackProps {
  lesson: Lesson
  answer: string
  onContinue: () => void
}

export default function ChapterTwoFeedback({
  lesson,
  answer,
  onContinue,
}: ChapterTwoFeedbackProps) {
  if (!lesson.core) return null

  return (
    <CoreBreakdown
      code={lesson.code ?? answer}
      core={lesson.core}
      onClose={onContinue}
    />
  )
}
