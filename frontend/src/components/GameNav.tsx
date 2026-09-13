import './GameNav.css'

interface GameNavProps {
  onBack: () => void
  onChapter: () => void
  onExit?: () => void
}

function GameNav({ onBack, onChapter }: GameNavProps) {
  return (
    <nav className="game-nav">
      <button type="button" className="nav-btn" onClick={onBack}>
        BACK
      </button>
      <button type="button" className="nav-btn" onClick={onChapter}>
        CHAPTER
      </button>
    </nav>
  )
}

export default GameNav
