import { useState } from 'react'
import type { Profile } from '../api/client'
import ForgotPasswordCard from './ForgotPasswordCard'
import LoginCard from './LoginCard'
import RegisterCard from './RegisterCard'
import './WelcomeScreen.css'

type AuthView = 'login' | 'register' | 'forgot' | null

interface WelcomeScreenProps {
  onLoggedIn: (profile: Profile) => void
  // Open straight on the login card with this message, e.g. after the player
  // set a new password from a reset link.
  loginNotice?: string
}

function WelcomeScreen({ onLoggedIn, loginNotice = '' }: WelcomeScreenProps) {
  const [authView, setAuthView] = useState<AuthView>(
    loginNotice ? 'login' : null,
  )
  // Set right after registering, so the login card can welcome the new player.
  const [newUsername, setNewUsername] = useState<string>('')
  const [notice, setNotice] = useState<string>(loginNotice)

  const handleStart = (): void => {
    setAuthView('login')
  }

  const handleCloseLogin = (): void => {
    setNewUsername('')
    setNotice('')
    setAuthView(null)
  }

  const handleSignUp = (): void => {
    setNewUsername('')
    setNotice('')
    setAuthView('register')
  }

  const handleForgot = (): void => {
    setNotice('')
    setAuthView('forgot')
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
          onForgot={handleForgot}
          onLoggedIn={onLoggedIn}
          registeredUsername={newUsername}
          notice={notice}
        />
      )}
      {authView === 'register' && (
        <RegisterCard
          onBack={() => setAuthView('login')}
          onClose={handleCloseLogin}
          onRegistered={handleRegistered}
        />
      )}
      {authView === 'forgot' && (
        <ForgotPasswordCard
          onBack={() => setAuthView('login')}
          onClose={handleCloseLogin}
        />
      )}
    </>
  )
}

export default WelcomeScreen
