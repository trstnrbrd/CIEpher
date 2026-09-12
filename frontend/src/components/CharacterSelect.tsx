import { useState } from 'react'
import {
  ApiError,
  setCharacter,
  type Character,
  type Profile,
} from '../api/client'
import boyImg from '../assets/boy.png'
import girlImg from '../assets/girl.png'
import './CharacterSelect.css'

interface CharacterSelectProps {
  onSaved: (profile: Profile) => void
  onUnauthorized: () => void
}

const CHARACTERS: { value: Character; img: string; name: string; alt: string }[] =
  [
    { value: 'boy', img: boyImg, name: 'BOY', alt: 'Boy' },
    { value: 'girl', img: girlImg, name: 'GIRL', alt: 'Girl' },
  ]

function CharacterSelect({ onSaved, onUnauthorized }: CharacterSelectProps) {
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = CHARACTERS[index]

  // Left and right both circle through the two characters: from boy, one
  // click right goes to girl, one click left also goes to girl.
  const move = (step: number): void => {
    setError(null)
    setIndex((i) => (i + step + CHARACTERS.length) % CHARACTERS.length)
  }

  const handlePrev = (): void => move(-1)
  const handleNext = (): void => move(1)

  const handleSave = async (): Promise<void> => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const profile = await setCharacter(current.value)
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

      <div className="character-carousel">
        <button
          type="button"
          className="character-arrow"
          onClick={handlePrev}
          aria-label="Previous character"
        >
          {'<'}
        </button>

        <div className="character-card">
          <img
            className="character-image"
            src={current.img}
            alt={current.alt}
          />
          <span className="character-name">{current.name}</span>
        </div>

        <button
          type="button"
          className="character-arrow"
          onClick={handleNext}
          aria-label="Next character"
        >
          {'>'}
        </button>
      </div>

      {error && <p className="character-error">{error}</p>}

      <button
        type="button"
        className="character-save"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'SAVING...' : 'SELECT'}
      </button>
    </div>
  )
}

export default CharacterSelect