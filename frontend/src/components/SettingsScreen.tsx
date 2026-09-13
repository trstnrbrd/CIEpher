import { useState } from 'react'
import {
  loadSoundEnabled,
  loadSoundVolume,
  playClick,
  saveSoundEnabled,
  saveSoundVolume,
} from '../sound'
import './SettingsScreen.css'

interface SettingsScreenProps {
  onBack: () => void
  onChapter: () => void
  onLogout: () => void
}

function SettingsScreen({ onBack, onChapter, onLogout }: SettingsScreenProps) {
  const [sound, setSound] = useState<boolean>(loadSoundEnabled)
  const [volume, setVolume] = useState<number>(() =>
    loadSoundEnabled() ? loadSoundVolume() : 0,
  )
  const [volumeBeforeMute, setVolumeBeforeMute] = useState<number>(() => {
    const saved = loadSoundVolume()
    return saved > 0 ? saved : 70
  })

  const toggleMute = (): void => {
    if (sound) {
      const previous = volume > 0 ? volume : volumeBeforeMute
      setVolumeBeforeMute(previous)
      setVolume(0)
      saveSoundVolume(0)
      setSound(false)
      saveSoundEnabled(false)
      return
    }

    const restored = volumeBeforeMute > 0 ? volumeBeforeMute : 70
    setVolume(restored)
    saveSoundVolume(restored)
    setSound(true)
    saveSoundEnabled(true)
    playClick(restored / 100)
  }

  const changeVolume = (next: number): void => {
    setVolume(next)
    saveSoundVolume(next)
    if (next > 0) {
      setVolumeBeforeMute(next)
      if (!sound) {
        setSound(true)
        saveSoundEnabled(true)
      }
    } else if (sound) {
      setSound(false)
      saveSoundEnabled(false)
    }
    if (sound && next > 0) playClick(next / 100)
  }

  return (
    <div className="settings-screen">
      <h1 className="settings-title">SETTINGS</h1>

      <div className="settings-card">
        <div className="settings-row">
          <label className="settings-label" htmlFor="sound-volume">
            SOUND
          </label>
          <div className="settings-audio-controls">
            <input
              id="sound-volume"
              className="settings-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Sound volume"
            />
            <button
              type="button"
              className={`settings-mute ${sound ? '' : 'muted'}`}
              aria-pressed={!sound}
              onClick={toggleMute}
            >
              {sound ? 'MUTE' : 'UNMUTE'}
            </button>
          </div>
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
