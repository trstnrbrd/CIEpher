import { useState, type FormEvent } from 'react'
import { signIn, saveSession } from '../api/client'
import './LoginCard.css'

interface LoginCardProps {
  onClose: () => void
  onSignUp: () => void
  onLoginSuccess: () => Promise<void>
}

function LoginCard({ onClose, onSignUp, onLoginSuccess }: LoginCardProps) {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleEnter = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await signIn(username, password)
      saveSession(session)
      await onLoginSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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

          {error && <p className="login-error">{error}</p>}

          <div className="login-actions">
            <button type="submit" className="login-btn login-enter" disabled={loading}>
              {loading ? 'WAIT...' : 'ENTER'}
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
