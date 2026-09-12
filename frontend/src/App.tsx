import { useState } from 'react'
import { logout, type Profile } from './api/client'
import MainMenu from './components/MainMenu'
import WelcomeScreen from './components/WelcomeScreen'
import './App.css'

function App() {
  // The logged-in player, or null while on the welcome screen.
  const [profile, setProfile] = useState<Profile | null>(null)

  const handleLogout = async (): Promise<void> => {
    await logout()
    setProfile(null)
  }

  if (profile) {
    return <MainMenu profile={profile} onLogout={handleLogout} />
  }
  return <WelcomeScreen onLoggedIn={setProfile} />
}

export default App
