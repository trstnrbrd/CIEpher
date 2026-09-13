// The player's sound preference, kept on this machine (lab PCs are shared,
// so a sound setting is per-player-browser, not server-side).

const KEY = 'ciepher.soundEnabled'

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

// A tiny click, so toggling sound on gives instant feedback. Made from
// Web Audio — no sound files needed.
export function playClick(): void {
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
    gain.gain.value = 0.04
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
    osc.onended = () => {
      void ctx.close()
    }
  } catch {
    // No audio available: ignore.
  }
}