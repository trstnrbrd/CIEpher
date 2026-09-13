import { useState } from 'react'
import { loadSoundEnabled, playClick, saveSoundEnabled } from '../sound'
import './SettingsScreen.css'

interface SettingsScreenProps {
  onBack: () => void
  onChapter: () => void
  onLogout: () => void
}

function SettingsScreen({ onBack, onChapter, onLogout }: SettingsScreenProps) {
  const [sound, setSound] = useState<boolean>(loadSoundEnabled)

  const toggleSound = (): void => {
    const next = !sound
    setSound(next)
    saveSoundEnabled(next)
    if (next) playClick()
  }

  return (
    <div className="settings-screen">
      <h1 className="settings-title">SETTINGS</h1>

      <div className="settings-card">
        <div className="settings-row">
          <span className="settings-label">SOUND</span>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            className={`settings-toggle ${sound ? 'on' : ''}`}
            onClick={toggleSound}
          >
            <span className="settings-knob" />
          </button>
        </div>

        <button type="button" className="settings-chapter" onClick={onChapter}>
          CHAPTER
        </button>

        <button type="button" className="settings-logout" onClick={onLogout}>
          LOG OUT
        </button>
      </div>

      <button type="button" className="settings-close" onClick={onBack}>
        CLOSE
      </button>
    </div>
  )
}

export default SettingsScreen
