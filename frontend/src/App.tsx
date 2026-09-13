import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { getMe, logout, type Profile } from './api/client'
import { configError, resetLink } from './api/supabase'
import ChapterSelect from './components/ChapterSelect'
import CharacterSelect from './components/CharacterSelect'
import ConfirmDialog from './components/ConfirmDialog'
import HomeScreen from './components/HomeScreen'
import JournalScreen from './components/JournalScreen'
import MissionScreen from './components/MissionScreen'
import NewPasswordScreen from './components/NewPasswordScreen'
import SettingsScreen from './components/SettingsScreen'
import WelcomeScreen from './components/WelcomeScreen'
import './App.css'

// Where the logged-in game screen is. The mission screen is the only one
// with the BACK / CHAPTER / EXIT nav bar. The journal and settings are
// overlays on top of whatever game screen is active, so leaving them drops
// the player right back where they were (e.g. the prologue story page).
type GameView =
  | { screen: 'home' }
  | { screen: 'chapters' }
  | { screen: 'mission'; chapter: number; mission: number }

function App() {
  // The logged-in player, or null while on the welcome screen.
  const [profile, setProfile] = useState<Profile | null>(null)
  // Which game screen to show once the player has a character.
  const [view, setView] = useState<GameView>({ screen: 'home' })
  // True while the "set a new password" screen from a reset email is open.
  const [resettingPassword, setResettingPassword] = useState<boolean>(
    resetLink !== null,
  )
  // A message for the login card, e.g. "Password changed!".
  const [loginNotice, setLoginNotice] = useState<string>('')
  // True until we know whether a saved session exists. If the client can't be
  // configured, or a reset link opened the game, there's nothing to check.
  const [checking, setChecking] = useState<boolean>(
    !configError && resetLink === null,
  )
  // True while the "Log out?" question is on screen.
  const [confirmingLogout, setConfirmingLogout] = useState<boolean>(false)
  // The journal and settings open as overlays above the game screen, never
  // replacing it, so closing them restores the exact screen and prologue
  // page the player was on.
  const [journalOpen, setJournalOpen] = useState<boolean>(false)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)

  // After a page refresh supabase-js still has the session, so pick the
  // player back up instead of asking them to log in again. A 15s cap keeps a
  // hanging boot check from leaving a blank page; it's generous because slow
  // school Wi-Fi shouldn't log players out. Not for a reset link: its
  // one-time session is only for setting a new password, never for playing.
  useEffect(() => {
    if (configError || resetLink !== null) {
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

  // Logs out right away. Used when the session has already ended (401), so
  // there's nothing to ask.
  const handleLogout = useCallback(async (): Promise<void> => {
    setConfirmingLogout(false)
    setJournalOpen(false)
    setSettingsOpen(false)
    await logout()
    setProfile(null)
    // Lab PCs are shared: the next player must start on the home screen,
    // never on the last player's chapter or mission.
    setView({ screen: 'home' })
  }, [])

  // The LOG OUT and EXIT buttons ask first.
  const askToLogout = useCallback((): void => setConfirmingLogout(true), [])
  const cancelLogout = useCallback((): void => setConfirmingLogout(false), [])

  // Leaves the reset screen for the login card. The reset link's details are
  // cleared from the address bar so a refresh doesn't reopen it.
  const finishReset = (notice: string): void => {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    )
    setLoginNotice(notice)
    setResettingPassword(false)
  }

  const handleLoggedIn = (loggedIn: Profile): void => {
    setLoginNotice('')
    setProfile(loggedIn)
  }

  if (checking) {
    return <div className="boot-screen">Loading…</div>
  }
  if (configError) {
    return (
      <div className="boot-screen boot-error">{configError}</div>
    )
  }
  if (resettingPassword) {
    return (
      <NewPasswordScreen
        linkExpired={resetLink === 'expired'}
        onDone={finishReset}
      />
    )
  }
  if (!profile) {
    return (
      <WelcomeScreen
        // A new key when the notice changes, so the screen opens on login.
        key={loginNotice}
        onLoggedIn={handleLoggedIn}
        loginNotice={loginNotice}
      />
    )
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
  const openJournal = (): void => setJournalOpen(true)
  const openSettings = (): void => setSettingsOpen(true)

  let screen: ReactNode
  if (view.screen === 'chapters') {
    screen = (
      <ChapterSelect
        onBack={() => setView({ screen: 'home' })}
        onExit={handleLogout}
        onOpenMission={openMission}
        onJournal={openJournal}
        onSettings={openSettings}
      />
    )
  } else if (view.screen === 'mission') {
    screen = (
      <MissionScreen
        // A new key per mission gives each one a fresh screen, so the last
        // mission's "CORRECT!" and answer don't carry over.
        key={`${view.chapter}-${view.mission}`}
        chapter={view.chapter}
        mission={view.mission}
        character={profile.character}
        onBack={goToChapters}
        onChapter={goToChapters}
        onExit={askToLogout}
        onUnauthorized={handleLogout}
        onOpenMission={openMission}
        onJournal={openJournal}
        onSettings={openSettings}
      />
    )
  } else {
    screen = (
      <HomeScreen
        profile={profile}
        onLogout={askToLogout}
        onPlay={() => setView({ screen: 'chapters' })}
        onJournal={openJournal}
        onSettings={openSettings}
      />
    )
  }

  return (
    <>
      {screen}
      {journalOpen && (
        <JournalScreen
          onBack={() => setJournalOpen(false)}
          onUnauthorized={handleLogout}
        />
      )}
      {settingsOpen && (
        <SettingsScreen
          onBack={() => setSettingsOpen(false)}
          onLogout={askToLogout}
        />
      )}
      {confirmingLogout && (
        <ConfirmDialog
          title="LOG OUT?"
          message="Are you sure you want to log out? Your progress is already saved."
          cancelLabel="NO, STAY"
          confirmLabel="YES, LOG OUT"
          onCancel={cancelLogout}
          onConfirm={() => void handleLogout()}
        />
      )}
    </>
  )
}

export default App
