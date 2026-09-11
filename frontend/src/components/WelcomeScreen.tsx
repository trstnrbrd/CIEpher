import { useState } from 'react'
import LoginCard from './LoginCard'
import RegisterCard from './RegisterCard'
import './WelcomeScreen.css'

type AuthView = 'login' | 'register' | null

function WelcomeScreen() {
  const [authView, setAuthView] = useState<AuthView>(null)

  const handleStart = (): void => {
    setAuthView('login')
  }

  const handleCloseLogin = (): void => {
    setAuthView(null)
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
          <h1 className="welcome-title welcome-subtitle">Welcome to</h1>
          <h1 className="welcome-title welcome-main-title">Ciepher</h1>
        </div>
        <button className="start-button" onClick={handleStart}>
          START
        </button>
      </div>

      {authView === 'login' && (
        <LoginCard onClose={handleCloseLogin} onSignUp={() => setAuthView('register')} />
      )}
      {authView === 'register' && (
        <RegisterCard onBack={() => setAuthView('login')} onClose={handleCloseLogin} />
      )}
    </>
  )
}

export default WelcomeScreen