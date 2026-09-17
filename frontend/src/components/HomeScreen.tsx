import type { Profile } from '../api/client'
import { CHARACTER_ART, fitVariables } from '../characters'
import GameTopBar from './GameTopBar'
import './HomeScreen.css'

interface HomeScreenProps {
  profile: Profile
  onLogout: () => void
  onPlay: () => void
  onJournal: () => void
  onSettings: () => void
}

function HomeScreen({
  profile,
  onLogout,
  onPlay,
  onJournal,
  onSettings,
}: HomeScreenProps) {
  const art = profile.character ? CHARACTER_ART[profile.character] : null

  return (
    <div className="home-screen">
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />
      <main className="home-menu">
        <p className="home-kicker">PLAYER HUB</p>
        <h1 className="home-title">CIEPHER</h1>
        <p className="home-welcome">Welcome, {profile.username}!</p>
        {art && (
          <div className="home-character">
            <span className="home-avatar-label">{profile.character}</span>
            <img
              className="home-avatar"
              src={art.img}
              alt={art.alt}
              style={fitVariables(art.fit)}
            />
          </div>
        )}
        <div className="home-actions">
          <button type="button" className="home-play" onClick={onPlay}>
            PLAY
          </button>
          <button type="button" className="home-logout" onClick={onLogout}>
            LOG OUT
          </button>
        </div>
      </main>
    </div>
  )
}

export default HomeScreen
