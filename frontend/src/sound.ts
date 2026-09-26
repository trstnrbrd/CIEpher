// The player's sound settings, kept on this machine (lab PCs are shared, so
// these are per-player-browser, not server-side). Music and sound effects
// have their own volume, 0 to 100, like the client's Settings screen.

import bgmAudio from './music/vintage-memories-157897.mp3'
import talkingAudio from './music/talking.mp3'
import errorAudio from './music/Error - Sound Effect Non copyright sound effects TCW-SoundEffects.mp3'

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

// =========================================================================
// Wait for the player's first tap, click or key press.
//
// The music and the typing sound together are about 6 MB. Fetching them the
// moment the app opens competes with the game's own code and the login
// screen for bandwidth on a slow connection, for no benefit: browsers
// already refuse to play audio before a user gesture, so nothing plays
// until one happens anyway. This lines the network fetch up with that same
// first gesture instead of doing it earlier for nothing.
// =========================================================================

let firstInteractionDone = false
let firstInteractionArmed = false
const firstInteractionWaiters: Array<() => void> = []

function onFirstInteraction(run: () => void): void {
  if (typeof window === 'undefined') return
  if (firstInteractionDone) {
    run()
    return
  }
  firstInteractionWaiters.push(run)
  if (firstInteractionArmed) return
  firstInteractionArmed = true
  const fire = (): void => {
    window.removeEventListener('pointerdown', fire)
    window.removeEventListener('keydown', fire)
    window.removeEventListener('click', fire)
    firstInteractionDone = true
    const waiting = firstInteractionWaiters.splice(0)
    for (const w of waiting) w()
  }
  // pointerdown/keydown for real taps and key presses; click too, so a
  // button activated by other means (e.g. an assistive tool) still counts.
  window.addEventListener('pointerdown', fire, { once: true })
  window.addEventListener('keydown', fire, { once: true })
  window.addEventListener('click', fire, { once: true })
}

// =========================================================================
// Background Music (BGM): Loops continuously across gameplay
// =========================================================================

let bgmInstance: HTMLAudioElement | null = null
let bgmUserInteractionBound = false

// Creates the <audio> element (this is the moment the browser actually
// requests the file) if it doesn't exist yet. Safe to call from anywhere
// that already knows a gesture has happened - a button click, a dragged
// slider - since playing it is allowed by then.
function ensureBgmInstance(): HTMLAudioElement {
  if (!bgmInstance) {
    bgmInstance = new Audio(bgmAudio)
    bgmInstance.loop = true
  }
  return bgmInstance
}

function startBackgroundMusicNow(): void {
  const audio = ensureBgmInstance()
  const vol = loadVolume('music') / 100
  audio.volume = vol

  if (vol > 0 && audio.paused) {
    const playPromise = audio.play()
    if (playPromise) {
      playPromise.catch(() => {
        // Should be rare now that we already waited for a gesture, but keep
        // the fallback in case the browser still refuses this once.
        if (!bgmUserInteractionBound) {
          bgmUserInteractionBound = true
          const unlock = () => {
            const currentVol = loadVolume('music') / 100
            audio.volume = currentVol
            if (currentVol > 0) {
              void audio.play().catch(() => {})
            }
            window.removeEventListener('pointerdown', unlock)
            window.removeEventListener('keydown', unlock)
            bgmUserInteractionBound = false
          }
          window.addEventListener('pointerdown', unlock, { once: true })
          window.addEventListener('keydown', unlock, { once: true })
        }
      })
    }
  }
}

// Called once when the app starts. Doesn't touch the network itself: it
// just waits for the player's first interaction, then starts the music.
export function initBackgroundMusic(): void {
  if (typeof window === 'undefined') return
  onFirstInteraction(startBackgroundMusicNow)
}

let bgmFadeTimer: number | null = null

export function setMusicVolume(volume: number): void {
  saveVolume('music', volume)
  if (bgmFadeTimer !== null) {
    window.clearInterval(bgmFadeTimer)
    bgmFadeTimer = null
  }
  // Moving the slider is itself a gesture, so it's always fine to load the
  // file now if it hasn't started yet.
  const audio = ensureBgmInstance()
  const normalized = clamp(volume) / 100
  audio.volume = normalized
  if (normalized > 0) {
    if (audio.paused) {
      void audio.play().catch(() => {})
    }
  } else {
    // If volume reaches 0, mute
    audio.volume = 0
  }
}

export function fadeBgmOut(durationMs = 700): void {
  if (typeof window === 'undefined') return
  if (bgmFadeTimer !== null) {
    window.clearInterval(bgmFadeTimer)
    bgmFadeTimer = null
  }
  if (!bgmInstance) return

  const startVolume = bgmInstance.volume
  if (startVolume <= 0) return

  const startTime = performance.now()
  const interval = 25
  bgmFadeTimer = window.setInterval(() => {
    if (!bgmInstance) {
      if (bgmFadeTimer !== null) window.clearInterval(bgmFadeTimer)
      bgmFadeTimer = null
      return
    }
    const elapsed = performance.now() - startTime
    const progress = Math.min(1, elapsed / durationMs)
    bgmInstance.volume = Math.max(0, startVolume * (1 - progress))
    if (progress >= 1) {
      if (bgmFadeTimer !== null) window.clearInterval(bgmFadeTimer)
      bgmFadeTimer = null
      bgmInstance.volume = 0
    }
  }, interval)
}

export function fadeBgmIn(durationMs = 1000): void {
  if (typeof window === 'undefined') return
  // This is called from mid-game (SakayAnimation), well after the player's
  // first interaction, so it's always fine to load the file now.
  const bgmInstance = ensureBgmInstance()

  if (bgmFadeTimer !== null) {
    window.clearInterval(bgmFadeTimer)
    bgmFadeTimer = null
  }

  const targetVolume = loadVolume('music') / 100
  if (targetVolume <= 0) {
    bgmInstance.volume = 0
    return
  }

  if (bgmInstance.paused) {
    void bgmInstance.play().catch(() => {})
  }

  const startVolume = bgmInstance.volume
  const startTime = performance.now()
  const interval = 25
  bgmFadeTimer = window.setInterval(() => {
    if (!bgmInstance) {
      if (bgmFadeTimer !== null) window.clearInterval(bgmFadeTimer)
      bgmFadeTimer = null
      return
    }
    const elapsed = performance.now() - startTime
    const progress = Math.min(1, elapsed / durationMs)
    const current = startVolume + (targetVolume - startVolume) * progress
    bgmInstance.volume = Math.min(targetVolume, Math.max(0, current))
    if (progress >= 1) {
      if (bgmFadeTimer !== null) window.clearInterval(bgmFadeTimer)
      bgmFadeTimer = null
      bgmInstance.volume = targetVolume
    }
  }, interval)
}

// =========================================================================
// Typewriter Chatter Sound (talking.mp3): Plays during text typing
// =========================================================================

let sharedAudioContext: AudioContext | null = null
let typingBuffer: AudioBuffer | null = null
let typingBufferLoading = false
let typingSourceNode: AudioBufferSourceNode | null = null
let typingGainNode: GainNode | null = null
let typingAudio: HTMLAudioElement | null = null
let typingActive = false
let sfxUserInteractionBound = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedAudioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (Ctor) {
      sharedAudioContext = new Ctor()
    }
  }
  return sharedAudioContext
}

export function preloadTypingSound(): void {
  if (typeof window === 'undefined' || typingBuffer || typingBufferLoading) return
  // Waits for the same first interaction as the music, so this ~300 KB file
  // isn't fetched before the player has done anything either.
  onFirstInteraction(() => {
    if (typingBuffer || typingBufferLoading) return
    const ctx = getAudioContext()
    if (!ctx) return
    typingBufferLoading = true
    fetch(talkingAudio)
      .then((res) => res.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        typingBuffer = decoded
        typingBufferLoading = false
        if (typingActive && !typingSourceNode) {
          startTypingSound()
        }
      })
      .catch(() => {
        typingBufferLoading = false
      })
  })
}

function getTypingAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!typingAudio) {
    typingAudio = new Audio(talkingAudio)
    typingAudio.loop = true
    typingAudio.preload = 'auto'
    try {
      typingAudio.load()
    } catch {
      // Ignore if load fails
    }
  }
  return typingAudio
}

export function startTypingSound(): void {
  if (typeof window === 'undefined') return
  const sfxVol = loadVolume('sfx') / 100
  if (sfxVol <= 0) return

  typingActive = true
  const ctx = getAudioContext()

  // Ensure AudioContext is resumed on user gesture if suspended by browser autoplay policy
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume().catch(() => {})
    if (!sfxUserInteractionBound) {
      sfxUserInteractionBound = true
      const unlockAudio = () => {
        if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
          void sharedAudioContext.resume().catch(() => {})
        }
        window.removeEventListener('pointerdown', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
        sfxUserInteractionBound = false
      }
      window.addEventListener('pointerdown', unlockAudio, { once: true })
      window.addEventListener('keydown', unlockAudio, { once: true })
    }
  }

  // 1. Preferred engine: Web Audio API (zero latency, instantaneous start, no promise aborts)
  if (ctx && typingBuffer) {
    if (typingSourceNode) return // Already running
    try {
      const source = ctx.createBufferSource()
      source.buffer = typingBuffer
      source.loop = true
      const gain = ctx.createGain()
      gain.gain.value = sfxVol
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
      typingSourceNode = source
      typingGainNode = gain
      return
    } catch {
      // Fall through to HTMLAudioElement fallback
    }
  } else {
    preloadTypingSound()
  }

  // 2. Fallback engine: HTMLAudioElement
  const audio = getTypingAudio()
  if (!audio) return

  audio.volume = sfxVol
  if (!audio.paused) return

  audio.currentTime = 0
  const playPromise = audio.play()
  if (playPromise) {
    playPromise
      .then(() => {
        if (!typingActive && !audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      .catch(() => {})
  }
}

export function stopTypingSound(): void {
  typingActive = false

  if (typingSourceNode) {
    try {
      typingSourceNode.stop()
      typingSourceNode.disconnect()
    } catch {
      // Ignore
    }
    typingSourceNode = null
  }
  if (typingGainNode) {
    try {
      typingGainNode.disconnect()
    } catch {
      // Ignore
    }
    typingGainNode = null
  }

  if (typingAudio && !typingAudio.paused) {
    typingAudio.pause()
    typingAudio.currentTime = 0
  }
}

export function updateSfxVolume(): void {
  const vol = loadVolume('sfx') / 100
  if (typingGainNode) {
    typingGainNode.gain.value = vol
  }
  if (typingAudio) {
    typingAudio.volume = vol
  }
}

// =========================================================================
// Error SFX: Plays when code question answer is wrong
// =========================================================================

let errorInstance: HTMLAudioElement | null = null

export function playErrorSound(): void {
  if (typeof window === 'undefined') return
  const sfxVol = loadVolume('sfx') / 100
  if (sfxVol <= 0) return

  if (!errorInstance) {
    errorInstance = new Audio(errorAudio)
  }
  errorInstance.volume = sfxVol
  errorInstance.currentTime = 0
  const promise = errorInstance.play()
  if (promise) {
    promise.catch(() => {})
  }
}
