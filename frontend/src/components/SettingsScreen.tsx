import { useState } from 'react'
import {
  loadSoundEnabled,
  playClick,
  saveSoundEnabled,
} from '../sound'
import './SettingsScreen.css'

interface SettingsScreenProps {
  onBack: () => void
  onLogout: () => void
}

function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const [sound, setSound] = useState<boolean>(loadSoundEnabled)

  const toggleSound = (): void => {
    const next = !sound
    setSound(next)
    saveSoundEnabled(next)
    if (next) playClick()
  }

  return (
    <div className="settings-screen">
      <button type="button" className="pixel-button settings-back" onClick={onBack}>
        BACK
      </button>

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

        <button type="button" className="settings-logout" onClick={onLogout}>
          LOG OUT
        </button>
      </div>
    </div>
  )
}

export default SettingsScreen