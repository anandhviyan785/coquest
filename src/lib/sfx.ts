/**
 * CoQuest's sounds, synthesised in the browser with the Web Audio API. Nothing is downloaded and
 * every sound is original. Audio starts only after the player's first tap or key press (browsers
 * block it before that), short repeats of one sound are dropped, and only a few sounds play at once.
 */
import type { SoundSettings } from './types'

export type SoundName =
  | 'tap' | 'nav' | 'open' | 'select' | 'chest' | 'claim' | 'complete' | 'solve'
  | 'correct' | 'wrong' | 'achievement' | 'xp' | 'gem' | 'streak'

interface Note { freq: number; at: number; len: number; type?: OscillatorType; gain?: number; slide?: number }

const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.5, G4 = 392, A4 = 440

const SOUNDS: Record<SoundName, Note[]> = {
  tap: [{ freq: 900, at: 0, len: 0.04, type: 'triangle', gain: 0.12 }],
  nav: [{ freq: 660, at: 0, len: 0.06, type: 'sine', gain: 0.18, slide: 880 }],
  open: [{ freq: 440, at: 0, len: 0.12, type: 'sine', gain: 0.2, slide: 880 }],
  select: [{ freq: E5, at: 0, len: 0.07, type: 'triangle' }, { freq: A5, at: 0.06, len: 0.1, type: 'triangle' }],
  chest: [
    { freq: 140, at: 0, len: 0.18, type: 'square', gain: 0.08, slide: 90 },
    { freq: 300, at: 0.12, len: 0.25, type: 'sawtooth', gain: 0.05, slide: 1200 },
    { freq: C6, at: 0.32, len: 0.3, type: 'sine', gain: 0.18 },
    { freq: E6, at: 0.4, len: 0.35, type: 'sine', gain: 0.14 },
  ],
  claim: [{ freq: C5, at: 0, len: 0.1 }, { freq: E5, at: 0.08, len: 0.1 }, { freq: G5, at: 0.16, len: 0.1 }, { freq: C6, at: 0.24, len: 0.25 }],
  complete: [{ freq: G4, at: 0, len: 0.12 }, { freq: C5, at: 0.1, len: 0.12 }, { freq: E5, at: 0.2, len: 0.12 }, { freq: G5, at: 0.3, len: 0.35 }],
  solve: [{ freq: E5, at: 0, len: 0.09, type: 'square', gain: 0.07 }, { freq: G5, at: 0.08, len: 0.09, type: 'square', gain: 0.07 }, { freq: C6, at: 0.16, len: 0.3, type: 'triangle' }],
  correct: [{ freq: C5, at: 0, len: 0.09, type: 'triangle' }, { freq: G5, at: 0.08, len: 0.16, type: 'triangle' }],
  wrong: [{ freq: 220, at: 0, len: 0.14, type: 'sawtooth', gain: 0.07 }, { freq: 165, at: 0.12, len: 0.22, type: 'sawtooth', gain: 0.07 }],
  achievement: [{ freq: C5, at: 0, len: 0.12 }, { freq: E5, at: 0.1, len: 0.12 }, { freq: G5, at: 0.2, len: 0.12 }, { freq: C6, at: 0.3, len: 0.18 }, { freq: E6, at: 0.42, len: 0.4, gain: 0.14 }],
  xp: [{ freq: A5, at: 0, len: 0.05, type: 'square', gain: 0.05 }, { freq: C6, at: 0.05, len: 0.08, type: 'square', gain: 0.05 }],
  gem: [{ freq: E6, at: 0, len: 0.06, type: 'sine', gain: 0.12 }, { freq: 1760, at: 0.05, len: 0.12, type: 'sine', gain: 0.1 }],
  streak: [{ freq: A4, at: 0, len: 0.1, type: 'sawtooth', gain: 0.06, slide: 880 }, { freq: D5, at: 0.12, len: 0.12 }, { freq: A5, at: 0.22, len: 0.3 }],
}

const MIN_GAP_MS = 70
const MAX_VOICES = 3

let ctx: AudioContext | null = null
let master: GainNode | null = null
let settings: SoundSettings = { sfx: true, music: false, volume: 0.7 }
let unlocked = false
let voices = 0
const lastPlayed = new Map<SoundName, number>()

const audio = (): AudioContext | null => {
  if (!unlocked || typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = settings.volume
      master.connect(ctx.destination)
    } catch (err) {
      console.error('Audio is not available', err)
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch((err: unknown) => console.error('Could not resume audio', err))
  return ctx
}

const playNote = (ac: AudioContext, out: AudioNode, n: Note, start: number) => {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = n.type ?? 'sine'
  osc.frequency.setValueAtTime(n.freq, start + n.at)
  if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, start + n.at + n.len)
  const peak = n.gain ?? 0.16
  gain.gain.setValueAtTime(0.0001, start + n.at)
  gain.gain.exponentialRampToValueAtTime(peak, start + n.at + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + n.at + n.len)
  osc.connect(gain).connect(out)
  osc.start(start + n.at)
  osc.stop(start + n.at + n.len + 0.05)
}

/** Plays a named sound effect if sound effects are on. */
export const play = (name: SoundName): void => {
  if (!settings.sfx || settings.volume <= 0) return
  const now = performance.now()
  if (now - (lastPlayed.get(name) ?? 0) < MIN_GAP_MS || voices >= MAX_VOICES) return
  const ac = audio()
  if (!ac || !master) return
  lastPlayed.set(name, now)
  const notes = SOUNDS[name]
  const length = Math.max(...notes.map((n) => n.at + n.len))
  voices += 1
  setTimeout(() => { voices -= 1 }, length * 1000 + 60)
  const start = ac.currentTime + 0.01
  notes.forEach((n) => playNote(ac, master as GainNode, n, start))
}

// ── Music: a soft, slow arpeggio loop, generated note by note ─────────────
const MUSIC_STEPS = [C5, E5, G5, E5, A4, C5, E5, C5, G4, D5, G5, D5, A4, C5, E5, G5]
const STEP_SECONDS = 0.42
const MUSIC_GAIN = 0.05
let musicTimer: ReturnType<typeof setInterval> | null = null
let musicStep = 0

const tickMusic = () => {
  const ac = audio()
  if (!ac || !master) return
  const freq = MUSIC_STEPS[musicStep % MUSIC_STEPS.length]
  playNote(ac, master, { freq: freq / 2, at: 0, len: STEP_SECONDS * 1.8, type: 'sine', gain: MUSIC_GAIN }, ac.currentTime + 0.02)
  if (musicStep % 4 === 0) playNote(ac, master, { freq: freq / 4, at: 0, len: STEP_SECONDS * 4, type: 'triangle', gain: MUSIC_GAIN * 0.8 }, ac.currentTime + 0.02)
  musicStep += 1
}

const syncMusic = () => {
  const want = settings.music && settings.volume > 0 && unlocked
  if (want && !musicTimer) musicTimer = setInterval(tickMusic, STEP_SECONDS * 1000)
  if (!want && musicTimer) {
    clearInterval(musicTimer)
    musicTimer = null
  }
}

/** Applies the player's saved sound settings. */
export const configure = (next: SoundSettings): void => {
  settings = next
  if (master && ctx) master.gain.setTargetAtTime(next.volume, ctx.currentTime, 0.05)
  syncMusic()
}

/** Allows audio after the first user gesture, as browsers require. Safe to call many times. */
export const unlock = (): void => {
  if (unlocked) return
  unlocked = true
  audio()
  syncMusic()
}

/** Stops music while the tab is hidden and resumes it when the player comes back. */
export const onVisibility = (hidden: boolean): void => {
  if (hidden && musicTimer) {
    clearInterval(musicTimer)
    musicTimer = null
  } else if (!hidden) syncMusic()
}
