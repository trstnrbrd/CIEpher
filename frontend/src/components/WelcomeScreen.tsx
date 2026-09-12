import { useState } from 'react'
import type { Profile } from '../api/client'
import LoginCard from './LoginCard'
import RegisterCard from './RegisterCard'
import './WelcomeScreen.css'

type AuthView = 'login' | 'register' | null

interface WelcomeScreenProps {
  onLoggedIn: (profile: Profile) => void
}

function WelcomeScreen({ onLoggedIn }: WelcomeScreenProps) {
  const [authView, setAuthView] = useState<AuthView>(null)
  // Set right after registering, so the login card can welcome the new player.
  const [newUsername, setNewUsername] = useState<string>('')

  const handleStart = (): void => {
    setAuthView('login')
  }

  const handleCloseLogin = (): void => {
    setNewUsername('')
    setAuthView(null)
  }

  const handleSignUp = (): void => {
    setNewUsername('')
    setAuthView('register')
  }

  // The client's flow: after registering, go back to login and sign in.
  const handleRegistered = (profile: Profile): void => {
    setNewUsername(profile.username)
    setAuthView('login')
  }

  return (
    <>
      <div className={`welcome-screen ${authView ? 'blurred' : ''}`}>
        <div className="welcome-bg" />
        <div className="welcome-overlay" />

        <div className="cloud-layer">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="cloud cloud-4" />
          <div className="cloud cloud-5" />
        </div>

        <div className="welcome-content">
          <h1 className="welcome-title welcome-subtitle">WELCOME TO</h1>
          <h1 className="welcome-title welcome-main-title">CIEPHER</h1>
        </div>
        <button className="start-button" onClick={handleStart}>
          START
        </button>
      </div>

      {authView === 'login' && (
        <LoginCard
          onClose={handleCloseLogin}
          onSignUp={handleSignUp}
          onLoggedIn={onLoggedIn}
          registeredUsername={newUsername}
        />
      )}
      {authView === 'register' && (
        <RegisterCard
          onBack={() => setAuthView('login')}
          onClose={handleCloseLogin}
          onRegistered={handleRegistered}
        />
      )}
    </>
  )
}

export default WelcomeScreen
