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
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    console.log('Register:', {
      username,
      gender,
      email,
      yearLevel,
      confirmPassword,
      password,
    })
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
            <input
              className="input-field"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

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
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="reg-actions">
            <button type="submit" className="btn-submit">
              SUBMIT
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