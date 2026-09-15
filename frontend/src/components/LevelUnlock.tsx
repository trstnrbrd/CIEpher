import './LevelUnlock.css'

interface LevelUnlockProps {
  // The chapter that was just cleared; the celebration names the next one.
  chapter: number
  onContinue: () => void
}

function chapterLabel(id: number): string {
  if (id === 0) return 'PROLOGUE'
  if (id === 8) return 'EPILOGUE'
  return `CHAPTER ${id}`
}

// Full-screen celebration after the last mission of a chapter: a padlock
// shakes, swings open and turns green, the next level's name pops in, and
// the player continues back to the chapter list.
function LevelUnlock({ chapter, onContinue }: LevelUnlockProps) {
  const nextLabel = chapterLabel(chapter + 1)

  return (
    <div
      className="level-unlock"
      role="dialog"
      aria-modal="true"
      aria-label={`${nextLabel} unlocked`}
    >
      <div className="unlock-card">
        <p className="unlock-kicker">NEW LEVEL</p>

        <div className="unlock-lock-wrap">
          <div className="unlock-lock" aria-hidden="true">
            <span className="unlock-keyhole" />
          </div>
          <span className="unlock-spark spark-a" aria-hidden="true" />
          <span className="unlock-spark spark-b" aria-hidden="true" />
          <span className="unlock-spark spark-c" aria-hidden="true" />
          <span className="unlock-spark spark-d" aria-hidden="true" />
          <span className="unlock-spark spark-e" aria-hidden="true" />
          <span className="unlock-spark spark-f" aria-hidden="true" />
        </div>

        <h2 className="unlock-level">{nextLabel}</h2>
        <p className="unlock-tag">UNLOCKED</p>
        <p className="unlock-note">YOU CAN NOW PLAY THE NEXT LEVEL</p>

        <button
          type="button"
          className="pixel-button unlock-continue"
          onClick={onContinue}
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}

export default LevelUnlock