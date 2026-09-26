import { useState, type SubmitEvent } from 'react'
import { ApiError, login, type Profile } from '../api/client'
import PasswordInput from './PasswordInput'
import './LoginCard.css'

interface LoginCardProps {
  onClose: () => void
  onSignUp: () => void
  onForgot: () => void
  onLoggedIn: (profile: Profile) => void
  // Set right after registering: fills in the username and shows a welcome.
  registeredUsername?: string
  // A green message at the top, e.g. after a password change.
  notice?: string
}

function LoginCard({
  onClose,
  onSignUp,
  onForgot,
  onLoggedIn,
  registeredUsername = '',
  notice = '',
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

        {(notice || registeredUsername) && !error && (
          <p className="login-notice" role="status">
            {notice || 'Account created! Log in to start playing.'}
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
          <PasswordInput
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <button type="button" className="login-forgot" onClick={onForgot}>
            Forgot password?
          </button>

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
