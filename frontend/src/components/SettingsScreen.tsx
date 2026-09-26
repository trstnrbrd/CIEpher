import { useState, type CSSProperties } from 'react'
import {
  loadVolume,
  playClick,
  saveVolume,
  setMusicVolume,
  updateSfxVolume,
  type SoundKind,
} from '../sound'
import './SettingsScreen.css'

interface SettingsScreenProps {
  onBack: () => void
  onChapter: () => void
  onLogout: () => void
}

// The round blue buttons on the client's mockup: a music note for music, a
// speaker for sound effects.
function SoundIcon({ kind }: { kind: SoundKind }) {
  return (
    <span className="settings-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <circle className="settings-icon-shadow" cx="24" cy="26" r="21" />
        <circle className="settings-icon-face" cx="24" cy="23" r="21" />
        <ellipse
          className="settings-icon-shine"
          cx="16"
          cy="13"
          rx="4"
          ry="6"
        />
        {kind === 'music' ? (
          <g className="settings-icon-art">
            <path d="M31 10 L19 14 v17 a5 5 0 1 0 3 4.6 V19 l9-3 v9 a5 5 0 1 0 3 4.6 V10 z" />
          </g>
        ) : (
          <g className="settings-icon-art">
            <path d="M13 19 h6 l8-7 v24 l-8-7 h-6 z" />
            <path
              className="settings-icon-waves"
              d="M31 18 a8 8 0 0 1 0 12 M35 14 a13 13 0 0 1 0 20"
            />
          </g>
        )}
      </svg>
    </span>
  )
}

function VolumeRow({
  kind,
  label,
  volume,
  onChange,
}: {
  kind: SoundKind
  label: string
  volume: number
  onChange: (volume: number) => void
}) {
  return (
    <div className="settings-row">
      <SoundIcon kind={kind} />
      <input
        className="settings-slider"
        style={{ '--filled': `${volume}%` } as CSSProperties}
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </div>
  )
}

function SettingsScreen({ onBack, onChapter, onLogout }: SettingsScreenProps) {
  const [music, setMusic] = useState<number>(() => loadVolume('music'))
  const [sfx, setSfx] = useState<number>(() => loadVolume('sfx'))

  const changeMusic = (next: number): void => {
    setMusic(next)
    setMusicVolume(next)
  }

  // A click at the new level, so the player hears what they picked.
  const changeSfx = (next: number): void => {
    setSfx(next)
    saveVolume('sfx', next)
    updateSfxVolume()
    if (next > 0) playClick(next / 100)
  }

  return (
    <div className="settings-screen">
      <div className="settings-card">
        <VolumeRow
          kind="music"
          label="Music volume"
          volume={music}
          onChange={changeMusic}
        />
        <VolumeRow
          kind="sfx"
          label="Sound effects volume"
          volume={sfx}
          onChange={changeSfx}
        />

        <div className="settings-actions">
          <button type="button" className="settings-btn" onClick={onBack}>
            BACK
          </button>
          <button type="button" className="settings-btn" onClick={onChapter}>
            CHAPTER
          </button>
          <button type="button" className="settings-btn" onClick={onLogout}>
            EXIT
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsScreen
