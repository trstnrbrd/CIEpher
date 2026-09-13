// The player's sound preference, kept on this machine (lab PCs are shared,
// so a sound setting is per-player-browser, not server-side).

const KEY = 'ciepher.soundEnabled'
const VOLUME_KEY = 'ciepher.soundVolume'

export function loadSoundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEY, enabled ? '1' : '0')
  } catch {
    // Storage full or blocked: the setting just won't persist this time.
  }
}

export function loadSoundVolume(): number {
  try {
    const value = Number(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 70
  } catch {
    return 70
  }
}

export function saveSoundVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume))
  } catch {
    // Storage full or blocked: the setting just won't persist this time.
  }
}

// A tiny click, so toggling sound on gives instant feedback. Made from
// Web Audio — no sound files needed.
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
