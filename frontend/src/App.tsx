import { useCallback, useEffect, useState } from 'react'
import { getMe, logout, type Profile } from './api/client'
import { configError } from './api/supabase'
import ChapterSelect from './components/ChapterSelect'
import CharacterSelect from './components/CharacterSelect'
import HomeScreen from './components/HomeScreen'
import MissionScreen from './components/MissionScreen'
import WelcomeScreen from './components/WelcomeScreen'
import './App.css'

// Where the logged-in game screen is. The mission screen is the only one
// with the BACK / CHAPTER / EXIT nav bar.
type GameView =
  | { screen: 'home' }
  | { screen: 'chapters' }
  | { screen: 'mission'; chapter: number; mission: number }

function App() {
  // The logged-in player, or null while on the welcome screen.
  const [profile, setProfile] = useState<Profile | null>(null)
  // Which game screen to show once the player has a character.
  const [view, setView] = useState<GameView>({ screen: 'home' })
  // True until we know whether a saved session exists. If the client can't be
  // configured, there's nothing to check, so start resolved.
  const [checking, setChecking] = useState<boolean>(!configError)

  // After a page refresh supabase-js still has the session, so pick the
  // player back up instead of asking them to log in again. A 15s cap keeps a
  // hanging boot check from leaving a blank page; it's generous because slow
  // school Wi-Fi shouldn't log players out.
  useEffect(() => {
    if (configError) {
      return
    }
    let active = true
    const boot = Promise.race([
      getMe(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('boot timed out')), 15000),
      ),
    ])
    boot
      .then((p) => {
        if (active) setProfile(p)
      })
      .catch(() => {
        if (active) setProfile(null)
      })
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSavedCharacter = (saved: Profile): void => {
    setProfile(saved)
  }

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout()
    setProfile(null)
    // Lab PCs are shared: the next player must start on the home screen,
    // never on the last player's chapter or mission.
    setView({ screen: 'home' })
  }, [])

  if (checking) {
    return <div className="boot-screen">Loading…</div>
  }
  if (configError) {
    return (
      <div className="boot-screen boot-error">{configError}</div>
    )
  }
  if (!profile) {
    return <WelcomeScreen onLoggedIn={setProfile} />
  }
  // New players pick a character first: it's null until they do.
  if (profile.character === null) {
    return (
      <CharacterSelect
        onSaved={handleSavedCharacter}
        onUnauthorized={handleLogout}
      />
    )
  }
  // The intro with the chosen character plays inside the prologue now.
  const goToChapters = (): void => setView({ screen: 'chapters' })
  const openMission = (chapter: number, mission: number): void =>
    setView({ screen: 'mission', chapter, mission })

  if (view.screen === 'chapters') {
    return (
      <ChapterSelect
        onBack={() => setView({ screen: 'home' })}
        onExit={handleLogout}
        onOpenMission={openMission}
      />
    )
  }
  if (view.screen === 'mission') {
    return (
      <MissionScreen
        // A new key per mission gives each one a fresh screen, so the last
        // mission's "CORRECT!" and answer don't carry over.
        key={`${view.chapter}-${view.mission}`}
        chapter={view.chapter}
        mission={view.mission}
        character={profile.character}
        onBack={goToChapters}
        onChapter={goToChapters}
        onExit={handleLogout}
        onOpenMission={openMission}
      />
    )
  }
  return (
    <HomeScreen
      profile={profile}
      onLogout={handleLogout}
      onPlay={() => setView({ screen: 'chapters' })}
    />
  )
}

export default App
