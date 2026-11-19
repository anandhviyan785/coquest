import { addDays, dayKey } from '../../lib/dates.ts'
import type { LangId, PuzzleResult, UserState } from '../../lib/types.ts'
import { cpp } from './cpp.ts'
import { java } from './java.ts'
import { javascript } from './javascript.ts'
import { python } from './python.ts'
import type { Difficulty, Puzzle, PuzzleBank } from './types.ts'
import { css, html, sql } from './web.ts'

export type { Difficulty, Puzzle } from './types.ts'
export { KIND_LABEL } from './types.ts'

export const PUZZLES: PuzzleBank = { python, javascript, cpp, java, html, css, sql }

/** Attempts allowed before the answer is revealed. */
export const MAX_ATTEMPTS = 3
export const PUZZLE_XP: Record<Difficulty, number> = { 1: 15, 2: 25, 3: 40 }
/** Hard puzzles also pay gems when solved. */
export const HARD_BONUS_GEMS = 15
/** XP for finishing a puzzle without solving it, so showing up still counts. */
export const PARTICIPATION_XP = 5

export const DIFFICULTY_NAME: Record<Difficulty, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }

/** Puzzles get harder as the player levels up. */
export const difficultyForLevel = (level: number): Difficulty => (level <= 3 ? 1 : level <= 8 ? 2 : 3)

const hash = (text: string): number => {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * Today's puzzle for a language: one at the player's difficulty that they have not seen yet,
 * chosen by the date so it stays the same all day. Falls back to any unseen puzzle, then any.
 */
export const puzzleForDay = (lang: LangId, level: number, seen: Set<string>, day: string = dayKey()): Puzzle => {
  const bank = PUZZLES[lang]
  const tier = difficultyForLevel(level)
  const unseen = bank.filter((p) => !seen.has(p.id))
  const atTier = unseen.filter((p) => p.difficulty === tier)
  const pool = atTier.length > 0 ? atTier : unseen.length > 0 ? unseen : bank
  return pool[hash(`${day}:${lang}`) % pool.length]
}

export const puzzleById = (id: string): Puzzle | undefined =>
  Object.values(PUZZLES).flat().find((p) => p.id === id)

/** Puzzle ids the player has already played, so today's pick is new to them. */
export const seenPuzzles = (s: UserState, today: string = dayKey()): Set<string> =>
  new Set(Object.entries(s.puzzles).filter(([day]) => day !== today).map(([, r]) => r.puzzleId))

/** The reward for a finished puzzle: full XP on the first try, less for each extra attempt. */
export const puzzleReward = (difficulty: Difficulty, solved: boolean, attempts: number): { xp: number; gems: number } => {
  if (!solved) return { xp: PARTICIPATION_XP, gems: 0 }
  const penalty = Math.max(0, attempts - 1) * 0.25
  return { xp: Math.max(PARTICIPATION_XP, Math.round(PUZZLE_XP[difficulty] * (1 - penalty))), gems: difficulty === 3 ? HARD_BONUS_GEMS : 0 }
}

/** Consecutive days, ending today or yesterday, on which the Daily Puzzle was played. */
export const puzzleStreak = (s: UserState, today: string = dayKey()): number => {
  let cursor = s.puzzles[today] ? today : addDays(today, -1)
  let run = 0
  while (s.puzzles[cursor]) {
    run += 1
    cursor = addDays(cursor, -1)
  }
  return run
}

/** Normalises a typed answer: no spaces, quotes unified, trailing semicolon dropped. */
export const normaliseTyped = (text: string): string => text.replace(/\s+/g, '').replace(/;$/, '').replace(/'/g, '"')

export const typedMatches = (typed: string, accepted: string[]): boolean =>
  accepted.some((a) => normaliseTyped(a) === normaliseTyped(typed))

export const recordPuzzle = (s: UserState, result: PuzzleResult, today: string = dayKey()): UserState =>
  s.puzzles[today] ? s : { ...s, puzzles: { ...s.puzzles, [today]: result } }
