import { useCallback, useState, type SubmitEvent } from 'react'
import { ApiError, requestPasswordReset } from '../api/client'
import { TURNSTILE_SITE_KEY } from '../turnstile'
import TurnstileWidget from './TurnstileWidget'
import './LoginCard.css'

interface ForgotPasswordCardProps {
  onBack: () => void
  onClose: () => void
}

// "Forgot password?": the player types their username and gets an email with
// a link to set a new password. It looks like the login card on purpose.
function ForgotPasswordCard({ onBack, onClose }: ForgotPasswordCardProps) {
  const [username, setUsername] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [sent, setSent] = useState<boolean>(false)
  // The "I'm not a robot" token, and a counter that restarts the check: a
  // token works only once, so every failed attempt needs a fresh one.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileRound, setTurnstileRound] = useState<number>(0)

  // Stable, so the widget isn't redrawn every time the player types.
  const handleTurnstileToken = useCallback((token: string | null): void => {
    setTurnstileToken(token)
    if (token) setError('')
  }, [])

  const handleSend = async (e: SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    if (username.trim().length === 0) {
      setError('Type your username first.')
      return
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(`Please tick the "I'm not a robot" check first.`)
      return
    }
    setSending(true)
    try {
      await requestPasswordReset(username.trim(), turnstileToken ?? undefined)
      setSent(true)
    } catch (err) {
      // The token was used up by this attempt: start a new check.
      setTurnstileToken(null)
      setTurnstileRound((round) => round + 1)
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="login-title">FORGOT PASSWORD</h2>

        {sent ? (
          <>
            {/* The same message whether or not the username exists. */}
            <p className="login-notice" role="status">
              If that account exists, we sent a reset link to its email. Check
              your inbox and your spam folder.
            </p>
            <div className="login-actions login-actions-centered">
              <button
                type="button"
                className="login-btn login-enter"
                onClick={onBack}
              >
                BACK TO LOGIN
              </button>
            </div>
          </>
        ) : (
          <form className="login-form" onSubmit={handleSend} noValidate>
            <p className="login-hint">
              Type your username. We'll email you a link to set a new password.
            </p>

            <label className="login-label" htmlFor="forgot-username">
              Username
            </label>
            <input
              id="forgot-username"
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />

            <TurnstileWidget
              key={turnstileRound}
              onToken={handleTurnstileToken}
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
                disabled={sending}
              >
                {sending ? '...' : 'SEND LINK'}
              </button>
              <button
                type="button"
                className="login-btn login-signup"
                onClick={onBack}
              >
                BACK
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordCard
