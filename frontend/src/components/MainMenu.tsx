import type { Profile } from '../api/client'
import './MainMenu.css'

interface MainMenuProps {
  profile: Profile
  onLogout: () => void
}

// Placeholder so login can be tested end to end. Vhan designs the real screen.
function MainMenu({ profile, onLogout }: MainMenuProps) {
  return (
    <div className="main-menu">
      <h1 className="main-menu-title">MAIN MENU</h1>
      <p className="main-menu-text">Logged in as {profile.username}</p>
      <p className="main-menu-text">
        Character: {profile.character ?? 'not chosen yet'}
      </p>
      <button type="button" className="main-menu-logout" onClick={onLogout}>
        LOGOUT
      </button>
    </div>
  )
}

export default MainMenu
