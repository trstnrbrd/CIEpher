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
      <h1 className="home-title">CIEPHER</h1>
      <p className="home-welcome">Welcome, {profile.username}!</p>
      {profile.character && (
        <div className="home-character">
          <img
            className="home-avatar"
            src={profile.character === 'boy' ? boyImg : girlImg}
            alt={profile.character}
          />
        </div>
      )}
      <button type="button" className="home-play" onClick={onPlay}>
        PLAY
      </button>
      <button type="button" className="home-logout" onClick={onLogout}>
        LOG OUT
      </button>
    </div>
  )
}

export default HomeScreen