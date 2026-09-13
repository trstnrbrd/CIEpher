import type { Profile } from '../api/client'
import boyImg from '../assets/boy.png'
import girlImg from '../assets/girl.png'
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
  return (
    <div className="home-screen">
      <GameTopBar onJournal={onJournal} onSettings={onSettings} />
      <main className="home-menu">
        <p className="home-kicker">PLAYER HUB</p>
        <h1 className="home-title">CIEPHER</h1>
        <p className="home-welcome">Welcome, {profile.username}!</p>
        {profile.character && (
          <div className="home-character">
            <span className="home-avatar-label">{profile.character}</span>
            <img
              className="home-avatar"
              src={profile.character === 'boy' ? boyImg : girlImg}
              alt={profile.character}
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
