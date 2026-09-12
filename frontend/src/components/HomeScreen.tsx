import type { Profile } from '../api/client'
import './HomeScreen.css'

interface HomeScreenProps {
  profile: Profile
  onLogout: () => void
}

function HomeScreen({ profile, onLogout }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <h1 className="home-title">CIEPHER</h1>
      <p className="home-welcome">Welcome, {profile.username}!</p>
      <p className="home-character">Character: {profile.character?.toUpperCase()}</p>
      <button type="button" className="home-logout" onClick={onLogout}>
        LOG OUT
      </button>
    </div>
  )
}

export default HomeScreen