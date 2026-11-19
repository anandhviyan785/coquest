import { useEffect } from 'react'
import { configure, onVisibility, play, unlock } from './sfx'
import type { SoundName } from './sfx'
import type { SoundSettings } from './types'

const NAMED = new Set<string>(['tap', 'nav', 'open', 'select', 'chest', 'claim', 'complete', 'solve', 'correct', 'wrong', 'achievement', 'xp', 'gem', 'streak'])

/**
 * Click sounds for the whole app. An element can choose its sound with data-sfx="open" (or
 * data-sfx="none" when its own handler plays one). Links in navigation play "nav"; other
 * buttons and links play a quiet "tap".
 */
const soundFor = (target: EventTarget | null): SoundName | null => {
  if (!(target instanceof Element)) return null
  const el = target.closest('[data-sfx], button, a, [role="button"], [role="tab"]')
  if (!el || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return null
  const chosen = el.getAttribute('data-sfx')
  if (chosen === 'none') return null
  if (chosen && NAMED.has(chosen)) return chosen as SoundName
  if (el.closest('nav')) return 'nav'
  return 'tap'
}

/** Keeps the sound engine in step with the player's settings and wires up click sounds. */
export function useSoundSystem(settings: SoundSettings): void {
  useEffect(() => configure(settings), [settings])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      unlock()
      const name = soundFor(event.target)
      if (name) play(name)
    }
    const onKey = () => unlock()
    const onVis = () => onVisibility(document.hidden)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
}
