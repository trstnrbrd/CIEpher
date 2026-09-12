import { useEffect, useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import LoginCard from './components/LoginCard'
import RegisterCard from './components/RegisterCard'
import CharacterSelect from './components/CharacterSelect'
import HomeScreen from './components/HomeScreen'
import { getMe, clearSession, isUnauthorized, type Profile } from './api/client'
import './App.css'

type Phase = 'loading' | 'welcome' | 'character-select' | 'home'
type AuthView = 'login' | 'register' | null

function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [authView, setAuthView] = useState<AuthView>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let active = true
    getMe()
      .then((p) => {
        if (!active) return
        setProfile(p)
        setPhase(p.character === null || p.character === undefined ? 'character-select' : 'home')
      })
      .catch((err: unknown) => {
        if (!active) return
        clearSession()
        if (isUnauthorized(err)) {
          setAuthView('login')
        }
        setPhase('welcome')
      })
    return () => {
      active = false
    }
  }, [])

  const handleStart = (): void => {
    setAuthView('login')
  }

  const handleCloseAuth = (): void => {
    setAuthView(null)
  }

  const applyProfile = (p: Profile): void => {
    setProfile(p)
    setAuthView(null)
    setPhase(p.character === null || p.character === undefined ? 'character-select' : 'home')
  }

  const handleLoginSuccess = async (): Promise<void> => {
    try {
      applyProfile(await getMe())
    } catch {
      setAuthView(null)
      setPhase('welcome')
    }
  }

  const handleCharacterSaved = (p: Profile): void => {
    setProfile(p)
    setPhase('home')
  }

  const handleUnauthorized = (): void => {
    clearSession()
    setProfile(null)
    setAuthView('login')
    setPhase('welcome')
  }

  const handleLogout = (): void => {
    clearSession()
    setProfile(null)
    setAuthView(null)
    setPhase('welcome')
  }

  return (
    <>
      {phase !== 'character-select' && phase !== 'home' && (
        <WelcomeScreen onStart={handleStart} loading={phase === 'loading'} dimmed={authView !== null} />
      )}

      {authView === 'login' && (
        <LoginCard
          onClose={handleCloseAuth}
          onSignUp={() => setAuthView('register')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {authView === 'register' && (
        <RegisterCard onBack={() => setAuthView('login')} onClose={handleCloseAuth} />
      )}

      {phase === 'character-select' && (
        <CharacterSelect onSaved={handleCharacterSaved} onUnauthorized={handleUnauthorized} />
      )}

      {phase === 'home' && profile && (
        <HomeScreen profile={profile} onLogout={handleLogout} />
      )}
    </>
  )
}

export default App