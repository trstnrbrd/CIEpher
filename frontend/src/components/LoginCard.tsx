import { useState, type FormEvent } from 'react'
import './LoginCard.css'

interface LoginCardProps {
  onClose: () => void
  onSignUp: () => void
}

function LoginCard({ onClose, onSignUp }: LoginCardProps) {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleEnter = (e: FormEvent): void => {
    e.preventDefault()
    console.log('Login:', { username, password })
  }

  const handleSignUp = (): void => {
    onSignUp()
  }

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="login-title">LOGIN YOUR ACCOUNT</h2>

        <form className="login-form" onSubmit={handleEnter}>
          <label className="login-label">Username</label>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />

          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          <div className="login-actions">
            <button type="submit" className="login-btn login-enter">
              ENTER
            </button>
            <button
              type="button"
              className="login-btn login-signup"
              onClick={handleSignUp}
            >
              SIGN UP
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginCard
