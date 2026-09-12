import { useState, type SubmitEvent } from 'react'
import { ApiError, login, type Profile } from '../api/client'
import './LoginCard.css'

interface LoginCardProps {
  onClose: () => void
  onSignUp: () => void
  onLoggedIn: (profile: Profile) => void
  // Set right after registering: fills in the username and shows a welcome.
  registeredUsername?: string
}

function LoginCard({
  onClose,
  onSignUp,
  onLoggedIn,
  registeredUsername = '',
}: LoginCardProps) {
  const [username, setUsername] = useState<string>(registeredUsername)
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleEnter = async (
    e: SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await login(username, password)
      onLoggedIn(profile)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      )
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

        {registeredUsername && !error && (
          <p className="login-notice" role="status">
            Account created! Log in to start playing.
          </p>
        )}

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

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <div className="login-actions">
            <button
              type="submit"
              className="login-btn login-enter"
              disabled={loading}
            >
              {loading ? '...' : 'ENTER'}
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
