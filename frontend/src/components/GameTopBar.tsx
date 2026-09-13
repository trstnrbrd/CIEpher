import journalImg from '../icons/journal.png'
import settingsImg from '../icons/settings.png'
import './GameTopBar.css'

interface GameTopBarProps {
  onJournal: () => void
  onSettings: () => void
}

// The journal (top-left) and settings (top-right) icons, shown on the game
// screens but never over the welcomer or story pages.
function GameTopBar({ onJournal, onSettings }: GameTopBarProps) {
  return (
    <div className="game-top-bar">
      <button
        type="button"
        className="top-bar-btn top-bar-journal"
        onClick={onJournal}
        aria-label="Open the code journal"
      >
        <img src={journalImg} alt="Journal" />
      </button>
      <button
        type="button"
        className="top-bar-btn top-bar-settings"
        onClick={onSettings}
        aria-label="Open settings"
      >
        <img src={settingsImg} alt="Settings" />
      </button>
    </div>
  )
}

export default GameTopBar