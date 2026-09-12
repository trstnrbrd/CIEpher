import { useState, type ChangeEvent, type SubmitEvent } from 'react'
import { ApiError, register, type Profile } from '../api/client'
import PasswordInput from './PasswordInput'
import './RegisterCard.css'

interface RegisterCardProps {
  onBack: () => void
  onClose: () => void
  onRegistered: (profile: Profile) => void
}

// The inputs that can show a red message under them.
const FIELDS = [
  'username',
  'email',
  'password',
  'confirmPassword',
  'privacyConsent',
] as const
type Field = (typeof FIELDS)[number]
type FieldErrors = Partial<Record<Field, string>>

function isField(value: string | undefined): value is Field {
  return FIELDS.includes(value as Field)
}

// API errors that don't name a field still belong under one.
const FIELD_FOR_CODE: Record<string, Field> = {
  USERNAME_TAKEN: 'username',
  EMAIL_TAKEN: 'email',
}

// The red message under an input, if it has one.
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <span className="field-error" role="alert">
      {message}
    </span>
  )
}

function RegisterCard({ onBack, onClose, onRegistered }: RegisterCardProps) {
  const [username, setUsername] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [yearLevel, setYearLevel] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Empty or mismatched fields, checked before anything is sent. The API
  // checks everything again; this is only so players get instant feedback.
  const findProblems = (): FieldErrors => {
    const problems: FieldErrors = {}
    if (!username.trim()) problems.username = 'Please enter a username.'
    if (!email.trim()) problems.email = 'Please enter your email.'
    if (!password) problems.password = 'Please enter a password.'
    if (!confirmPassword) {
      problems.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      // Only checked here: the API never receives the second password.
      problems.confirmPassword = "Passwords don't match."
    }
    if (!privacyConsent) {
      problems.privacyConsent = 'You must agree to the privacy notice.'
    }
    return problems
  }

  const handleSubmit = async (
    e: SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    setFormError('')

    const problems = findProblems()
    setFieldErrors(problems)
    if (Object.keys(problems).length > 0) return

    setLoading(true)
    try {
      // gender and yearLevel aren't sent yet: waiting on the client
      // (see Documents/api-contract.md).
      const profile = await register({
        username,
        email,
        password,
        privacyConsent,
      })
      onRegistered(profile)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setFormError('Something went wrong. Please try again.')
        return
      }
      const field = err.field ?? FIELD_FOR_CODE[err.code]
      if (isField(field)) {
        setFieldErrors({ [field]: err.message })
      } else {
        setFormError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Typing in a field clears its red message.
  const clearError = (field: Field): void => {
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }))
  }

  const edit =
    (field: Field, setValue: (value: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setValue(e.target.value)
      clearError(field)
    }

  const inputClass = (field: Field): string =>
    fieldErrors[field] ? 'input-field input-error' : 'input-field'

  return (
    <div className="register-overlay" onClick={onClose}>
      <div className="register-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="back-button" onClick={onBack}>
          ←
        </button>

        <h2 className="register-title">Register</h2>

        {/* noValidate: we show our own red messages instead of the browser's
            "Please fill out this field" bubbles. */}
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <input
                className={inputClass('username')}
                type="text"
                placeholder="Username"
                autoComplete="username"
                maxLength={20}
                value={username}
                onChange={edit('username', setUsername)}
                aria-invalid={Boolean(fieldErrors.username)}
              />
              <FieldError message={fieldErrors.username} />
            </div>

            <div className="select-wrapper">
              <select
                className="select-field"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
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

            <div className="field">
              <input
                className={inputClass('email')}
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={edit('email', setEmail)}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <input
              className="input-field"
              type="text"
              placeholder="Year Level"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
            />

            <div className="field">
              <PasswordInput
                className={inputClass('password')}
                placeholder="Password"
                autoComplete="new-password"
                maxLength={72}
                value={password}
                onChange={edit('password', setPassword)}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <FieldError message={fieldErrors.password} />
            </div>

            <div className="field">
              <PasswordInput
                className={inputClass('confirmPassword')}
                placeholder="Confirm password"
                autoComplete="new-password"
                maxLength={72}
                value={confirmPassword}
                onChange={edit('confirmPassword', setConfirmPassword)}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              <FieldError message={fieldErrors.confirmPassword} />
            </div>

            {/* Required by the Data Privacy Act. The API rejects the
                registration without it. TODO: link the privacy notice. */}
            <div className="field field-wide">
              <label
                className={
                  fieldErrors.privacyConsent
                    ? 'consent-row consent-error'
                    : 'consent-row'
                }
              >
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => {
                    setPrivacyConsent(e.target.checked)
                    clearError('privacyConsent')
                  }}
                />
                <span>I agree to the privacy notice</span>
              </label>
              <FieldError message={fieldErrors.privacyConsent} />
            </div>
          </div>

          {formError && (
            <p className="register-error" role="alert">
              {formError}
            </p>
          )}

          <div className="reg-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '...' : 'SUBMIT'}
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
