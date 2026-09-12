import { useState, type SubmitEvent } from 'react'
import { ApiError, logout, setNewPassword } from '../api/client'
import PasswordInput from './PasswordInput'
import './LoginCard.css'
import './WelcomeScreen.css'

interface NewPasswordScreenProps {
  // The reset link had already expired or been used when it was opened.
  linkExpired: boolean
  // Back to the login screen, with a message for the login card.
  onDone: (loginNotice: string) => void
}

type State = 'form' | 'saved' | 'expired'

// Opened from the link in a "reset your password" email. It looks exactly
// like the login card over the blurred welcome screen, on purpose.
function NewPasswordScreen({ linkExpired, onDone }: NewPasswordScreenProps) {
  const [state, setState] = useState<State>(linkExpired ? 'expired' : 'form')
  const [password, setPassword] = useState<string>('')
  const [confirm, setConfirm] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  const handleSave = async (e: SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    // The same rules as registering. The server checks them again.
    if (
      password.length < 8 ||
      password.length > 72 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError('Password must be 8-72 characters, with a letter and a number.')
      return
    }
    if (password !== confirm) {
      setError("The passwords don't match.")
      return
    }
    setSaving(true)
    try {
      await setNewPassword(password)
      setState('saved')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState('expired')
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // Opening the link logs the player in for this one change, so cancelling
  // must log them out again.
  const handleCancel = async (): Promise<void> => {
    await logout()
    onDone('')
  }

  return (
    <>
      {/* The welcome screen behind the card, blurred, as behind LOGIN. */}
      <div className="welcome-screen blurred" aria-hidden="true">
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
      </div>

      <div className="login-overlay">
        <div className="login-card">
          {state === 'form' && (
            <>
              <h2 className="login-title">NEW PASSWORD</h2>
              <form className="login-form" onSubmit={handleSave} noValidate>
                <p className="login-hint">
                  Choose a new password for your account.
                </p>

                <label className="login-label" htmlFor="new-password">
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  className="login-input"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <label className="login-label" htmlFor="confirm-password">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm-password"
                  className="login-input"
                  placeholder="Enter it again"
                  autoComplete="new-password"
                  maxLength={72}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                    disabled={saving}
                  >
                    {saving ? '...' : 'SAVE'}
                  </button>
                  <button
                    type="button"
                    className="login-btn login-signup"
                    onClick={handleCancel}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </>
          )}

          {state === 'saved' && (
            <>
              <h2 className="login-title">PASSWORD CHANGED</h2>
              <p className="login-notice" role="status">
                All set! Log in with your new password.
              </p>
              <div className="login-actions login-actions-centered">
                <button
                  type="button"
                  className="login-btn login-enter"
                  onClick={() =>
                    onDone('Password changed! Log in with your new password.')
                  }
                >
                  GO TO LOGIN
                </button>
              </div>
            </>
          )}

          {state === 'expired' && (
            <>
              <h2 className="login-title">LINK EXPIRED</h2>
              <p className="login-error" role="alert">
                This reset link has expired or was already used. Use "Forgot
                password?" to get a new one.
              </p>
              <div className="login-actions login-actions-centered">
                <button
                  type="button"
                  className="login-btn login-enter"
                  onClick={() => onDone('')}
                >
                  BACK TO LOGIN
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default NewPasswordScreen
