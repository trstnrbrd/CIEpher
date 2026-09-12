import { useState, type FormEvent } from 'react'
import './RegisterCard.css'

interface RegisterCardProps {
  onBack: () => void
  onClose: () => void
}

function RegisterCard({ onBack, onClose }: RegisterCardProps) {
  const [username, setUsername] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [yearLevel, setYearLevel] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [consent, setConsent] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    if (!consent) {
      setError('You must agree to the Privacy Notice to create an account.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:54321/functions/v1/api'}/api/auth/sign-up`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          gender,
          yearLevel,
          consent: true,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error?.message ?? 'Could not create your account. Please try again.')
        return
      }
      onBack()
    } catch {
      setError('Could not reach the server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-overlay" onClick={onClose}>
      <div
        className="register-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="back-button" onClick={onBack}>
          ←
        </button>

        <h2 className="register-title">Register</h2>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field-wrap">
              <input
                className="input-field"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <p className="field-hint">3–20 letters, numbers or _</p>
            </div>

            <div className="select-wrapper">
              <select
                className="select-field"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="" disabled hidden>
                  Gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <span className="select-arrow">v</span>
            </div>

            <input
              className="input-field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="input-field"
              type="text"
              placeholder="Year Level"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              required
            />

            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            <input
              className="input-field"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="consent-block">
            <p className="privacy-notice">
              Your personal information (name, email, year level) is collected to
              create and manage your Ciepher account. It is stored securely and
              will never be sold, in compliance with the Data Privacy Act of 2012.
            </p>
            <label className="consent-label">
              <input
                type="checkbox"
                className="consent-checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>I agree to the collection and processing of my personal data as described in the Privacy Notice.</span>
            </label>
          </div>

          {error && <p className="reg-error">{error}</p>}

          <div className="reg-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Submit'}
            </button>
            <button type="button" className="btn-login" onClick={onBack}>
              LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterCard