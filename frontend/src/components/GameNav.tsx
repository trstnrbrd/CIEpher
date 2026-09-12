import './GameNav.css'

interface GameNavProps {
  onBack: () => void
  onChapter: () => void
  onExit: () => void
}

function GameNav({ onBack, onChapter, onExit }: GameNavProps) {
  return (
    <nav className="game-nav">
      <button type="button" className="nav-btn" onClick={onBack}>
        BACK
      </button>
      <button type="button" className="nav-btn" onClick={onChapter}>
        CHAPTER
      </button>
      <button type="button" className="nav-btn nav-exit" onClick={onExit}>
        EXIT
      </button>
    </nav>
  )
}

export default GameNav