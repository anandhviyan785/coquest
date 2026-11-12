import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Duel messaging. With Supabase configured, players connect over a Realtime broadcast channel from anywhere.
 * Without it, a BroadcastChannel links two tabs of the same browser, which is enough to duel on one machine.
 */

export interface Player { name: string; avatar: string }

export interface Score { passed: number; total: number; checks: number; testsPassed: number; testsRun: number; finishedMs: number | null }

export type DuelMessage =
  | { t: 'join'; player: Player }
  | { t: 'start'; host: Player; problemId: string; startsInMs: number; durationMs: number }
  | { t: 'score'; score: Score }
  | { t: 'leave' }

export interface DuelLink { send: (msg: DuelMessage) => void; close: () => void; ready: Promise<void> }

export const DUEL_DURATION_MS = 5 * 60 * 1000
export const DUEL_COUNTDOWN_MS = 4000

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const newRoomCode = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

export const emptyScore = (): Score => ({ passed: 0, total: 0, checks: 0, testsPassed: 0, testsRun: 0, finishedMs: null })

export const accuracyOf = (s: Score): number | null => (s.testsRun > 0 ? Math.round((s.testsPassed / s.testsRun) * 100) : null)

export type Verdict = 'win' | 'loss' | 'draw'

/** Finishing first wins; otherwise most tests passed, then fewest checks. */
export const judge = (me: Score, them: Score): Verdict => {
  if (me.finishedMs !== null || them.finishedMs !== null) {
    if (them.finishedMs === null) return 'win'
    if (me.finishedMs === null) return 'loss'
    return me.finishedMs < them.finishedMs ? 'win' : me.finishedMs > them.finishedMs ? 'loss' : 'draw'
  }
  if (me.passed !== them.passed) return me.passed > them.passed ? 'win' : 'loss'
  if (me.passed > 0 && me.checks !== them.checks) return me.checks < them.checks ? 'win' : 'loss'
  return 'draw'
}

export const openDuelLink = (code: string, onMessage: (msg: DuelMessage) => void): DuelLink => {
  if (supabase) {
    const client = supabase
    const channel: RealtimeChannel = client.channel(`duel:${code}`, { config: { broadcast: { self: false } } })
    channel.on('broadcast', { event: 'duel' }, ({ payload }) => onMessage(payload as DuelMessage))
    const ready = new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error('Could not connect to the duel room.'))
      })
    })
    return {
      ready,
      send: (msg) => void channel.send({ type: 'broadcast', event: 'duel', payload: msg }),
      close: () => void client.removeChannel(channel),
    }
  }
  const channel = new BroadcastChannel(`pyquest-duel-${code}`)
  channel.onmessage = (event: MessageEvent<DuelMessage>) => onMessage(event.data)
  return { ready: Promise.resolve(), send: (msg) => channel.postMessage(msg), close: () => channel.close() }
}
