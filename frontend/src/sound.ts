// The player's sound settings, kept on this machine (lab PCs are shared, so
// these are per-player-browser, not server-side). Music and sound effects
// have their own volume, 0 to 100, like the client's Settings screen.

export type SoundKind = 'music' | 'sfx'

const KEYS: Record<SoundKind, string> = {
  music: 'ciepher.musicVolume',
  sfx: 'ciepher.sfxVolume',
}
// The older single setting, so players keep what they had.
const OLD_VOLUME_KEY = 'ciepher.soundVolume'
const OLD_ENABLED_KEY = 'ciepher.soundEnabled'
const DEFAULT_VOLUME = 70

const clamp = (value: number): number => Math.min(100, Math.max(0, value))

export function loadVolume(kind: SoundKind): number {
  try {
    const saved = localStorage.getItem(KEYS[kind])
    if (saved !== null) {
      const value = Number(saved)
      return Number.isFinite(value) ? clamp(value) : DEFAULT_VOLUME
    }
    if (localStorage.getItem(OLD_ENABLED_KEY) === '0') return 0
    const old = Number(localStorage.getItem(OLD_VOLUME_KEY))
    return Number.isFinite(old) && old > 0 ? clamp(old) : DEFAULT_VOLUME
  } catch {
    return DEFAULT_VOLUME
  }
}

export function saveVolume(kind: SoundKind, volume: number): void {
  try {
    localStorage.setItem(KEYS[kind], String(clamp(volume)))
  } catch {
    // Storage full or blocked: the setting just won't persist this time.
  }
}

// A tiny click, so moving the sound effects slider is heard right away. Made
// from Web Audio: no sound files needed.
export function playClick(volume = 1): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 660
    gain.gain.value = 0.04 * Math.min(1, Math.max(0, volume))
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
    osc.onended = () => {
      void ctx.close()
    }
  } catch {
    // No audio available: ignore.
  }
}
