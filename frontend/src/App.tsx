import { useEffect, useState } from 'react'
import { getMe, logout, type Profile } from './api/client'
import CharacterSelect from './components/CharacterSelect'
import HomeScreen from './components/HomeScreen'
import WelcomeScreen from './components/WelcomeScreen'
import './App.css'

function App() {
  // The logged-in player, or null while on the welcome screen.
  const [profile, setProfile] = useState<Profile | null>(null)
  // True until we know whether a saved session exists.
  const [checking, setChecking] = useState<boolean>(true)

  // After a page refresh supabase-js still has the session, so pick the
  // player back up instead of asking them to log in again.
  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setChecking(false))
  }, [])

  const handleLogout = async (): Promise<void> => {
    await logout()
    setProfile(null)
  }

  if (checking) return null
  if (!profile) {
    return <WelcomeScreen onLoggedIn={setProfile} />
  }
  // New players pick a character first: it's null until they do.
  if (profile.character === null) {
    return (
      <CharacterSelect onSaved={setProfile} onUnauthorized={handleLogout} />
    )
  }
  return <HomeScreen profile={profile} onLogout={handleLogout} />
}

export default App
