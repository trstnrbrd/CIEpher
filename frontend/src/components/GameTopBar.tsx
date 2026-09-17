import { useState } from 'react'
import journalImg from '../icons/journal.webp'
import settingsImg from '../icons/settings.webp'
import './GameTopBar.css'

interface GameTopBarProps {
  onBack?: () => void
  onJournal: () => void
  onSettings: () => void
}

// The journal (top-left) and settings (top-right) icons, shown on the game
// screens but never over the welcomer or story pages. On small screens the
// two corner icons collapse into a single hamburger (top-right) whose menu
// holds the same two actions, so nothing on screen sits under them.
function GameTopBar({ onBack, onJournal, onSettings }: GameTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeAnd = (action: () => void): void => {
    setMenuOpen(false)
    action()
  }

  return (
    <div className={`game-top-bar ${onBack ? 'has-back' : ''}`}>
      {onBack && (
        <button
          type="button"
          className="top-bar-btn top-bar-back"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>
      )}
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
      <button
        type="button"
        className="top-bar-btn top-bar-menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <span className="top-bar-menu-bars" aria-hidden="true" />
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            className="top-bar-menu-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="top-bar-menu" role="menu" aria-label="Game menu">
            <button
              type="button"
              className="top-bar-menu-item"
              role="menuitem"
              onClick={() => closeAnd(onJournal)}
            >
              CODE JOURNAL
            </button>
            <button
              type="button"
              className="top-bar-menu-item"
              role="menuitem"
              onClick={() => closeAnd(onSettings)}
            >
              SETTINGS
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default GameTopBar
