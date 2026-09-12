import { useState } from 'react'
import {
  ApiError,
  setCharacter,
  type Character,
  type Profile,
} from '../api/client'
import './CharacterSelect.css'

interface CharacterSelectProps {
  onSaved: (profile: Profile) => void
  onUnauthorized: () => void
}

function CharacterSelect({ onSaved, onUnauthorized }: CharacterSelectProps) {
  const [selected, setSelected] = useState<Character | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (): Promise<void> => {
    if (!selected || saving) return
    setSaving(true)
    setError(null)
    try {
      const profile = await setCharacter(selected)
      onSaved(profile)
    } catch (err) {
      // The session ended (e.g. logged out elsewhere): back to login.
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
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

  return (
    <div className="character-select">
      <h2 className="character-title">CHOOSE YOUR CHARACTER</h2>

      <div className="character-options">
        <button
          type="button"
          className={`character-option ${selected === 'boy' ? 'selected' : ''}`}
          onClick={() => setSelected('boy')}
        >
          <span className="character-emoji" aria-hidden="true">
            👦
          </span>
          <span className="character-name">BOY</span>
        </button>

        <button
          type="button"
          className={`character-option ${selected === 'girl' ? 'selected' : ''}`}
          onClick={() => setSelected('girl')}
        >
          <span className="character-emoji" aria-hidden="true">
            👧
          </span>
          <span className="character-name">GIRL</span>
        </button>
      </div>

      {error && <p className="character-error">{error}</p>}

      <button
        type="button"
        className="character-save"
        onClick={handleSave}
        disabled={!selected || saving}
      >
        {saving ? 'SAVING...' : 'SELECT'}
      </button>
    </div>
  )
}

export default CharacterSelect
