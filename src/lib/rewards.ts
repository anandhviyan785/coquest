import { addDays, dayKey } from './dates.ts'
import { addGems, levelFromXp } from './gamification.ts'
import type { ChestItem, Loot, Rarity, RewardClaim, UserState } from './types.ts'

/** Daily Rewards run on a seven-day cycle; the last day is always a Legendary chest. */
export const CYCLE_DAYS = 7
/** Most streak savers a player can hold at once. */
export const MAX_SAVERS = 5
const MAX_CHESTS = 30
const HISTORY_LIMIT = 60

/** The chest each day of the cycle gives. */
export const CYCLE: Rarity[] = ['rare', 'rare', 'epic', 'rare', 'epic', 'epic', 'legendary']

interface RarityRule { xp: [number, number]; gems: [number, number]; saverChance: number; bonusChance: number }

/** Reward ranges per rarity. Higher rarities give more and have better odds of streak savers and bonus chests. */
export const RARITY: Record<Rarity, RarityRule & { name: string; color: string; glow: string }> = {
  rare: { name: 'Rare', color: '#3B82F6', glow: '#93C5FD', xp: [10, 20], gems: [5, 15], saverChance: 0, bonusChance: 0 },
  epic: { name: 'Epic', color: '#8A4DFF', glow: '#C9A8FF', xp: [25, 40], gems: [20, 35], saverChance: 0.3, bonusChance: 0.1 },
  legendary: { name: 'Legendary', color: '#F5A400', glow: '#FFE27A', xp: [60, 90], gems: [50, 80], saverChance: 0.6, bonusChance: 0.5 },
}

/** A small, fast, seeded random generator so a chest's contents cannot be re-rolled by reloading. */
export const seeded = (seed: string): (() => number) => {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

const between = (rand: () => number, [lo, hi]: [number, number]): number => lo + Math.floor(rand() * (hi - lo + 1))

/** Rolls a chest's contents. The same seed always gives the same loot. */
export const rollLoot = (rarity: Rarity, seed: string): Loot => {
  const rand = seeded(`${seed}:${rarity}`)
  const rule = RARITY[rarity]
  const xp = between(rand, rule.xp)
  const gems = between(rand, rule.gems)
  const savers = rand() < rule.saverChance ? 1 : 0
  const bonusChest: Rarity | null = rand() < rule.bonusChance ? (rarity === 'legendary' ? 'epic' : 'rare') : null
  return { rarity, xp, gems, savers, bonusChest }
}

/** The cycle day today's claim will be: consecutive daily claims advance it, a missed day starts again at 1. */
export const cycleDayFor = (s: UserState, today: string = dayKey()): number => {
  const yesterday = s.rewardClaims[addDays(today, -1)]
  if (!yesterday) return 1
  return (yesterday.cycleDay % CYCLE_DAYS) + 1
}

export type DayState = 'claimed' | 'available' | 'locked' | 'missed'

export interface CycleSlot { day: number; rarity: Rarity; state: DayState; claim?: RewardClaim }

/** The seven slots of the current cycle, for the Daily Rewards track. */
export const cycleSlots = (s: UserState, today: string = dayKey()): CycleSlot[] => {
  const claimedToday = s.rewardClaims[today]
  const position = claimedToday ? claimedToday.cycleDay : cycleDayFor(s, today)
  const cycleStart = addDays(today, -(position - 1))
  return CYCLE.map((rarity, i) => {
    const key = addDays(cycleStart, i)
    const claim = s.rewardClaims[key]
    const day = i + 1
    const state: DayState = claim && claim.cycleDay === day ? 'claimed' : day === position && !claimedToday ? 'available' : day < position ? 'missed' : 'locked'
    return { day, rarity, state, claim: state === 'claimed' ? claim : undefined }
  })
}

export const canClaimDaily = (s: UserState, today: string = dayKey()): boolean => !s.rewardClaims[today]

const note = (s: UserState, title: string, xp: number): UserState => ({
  ...s,
  history: [{ at: new Date().toISOString(), kind: 'reward' as const, title, xp }, ...s.history].slice(0, HISTORY_LIMIT),
})

export const newChest = (rarity: Rarity, source: string, salt: string): ChestItem => ({
  id: `${Date.now().toString(36)}-${salt}`,
  rarity,
  source,
  at: new Date().toISOString(),
})

const addChest = (s: UserState, chest: ChestItem): UserState => ({ ...s, chests: [...s.chests, chest].slice(-MAX_CHESTS) })

/**
 * Adds a chest's loot to the player: XP (counted toward today's goal and the week, but it does
 * not extend the streak), gems with a gem-history entry, streak savers and any bonus chest.
 */
export const grantLoot = (s: UserState, loot: Loot, title: string, today: string = dayKey()): UserState => {
  const day = s.days[today] ?? { xp: 0, seconds: 0, lessons: 0, correct: 0, attempts: 0, langs: {} }
  const withXp: UserState = {
    ...addGems(s, loot.gems, title),
    xp: s.xp + loot.xp,
    weeklyXp: s.weeklyXp + loot.xp,
    freezes: Math.min(MAX_SAVERS, s.freezes + loot.savers),
    days: { ...s.days, [today]: { ...day, xp: day.xp + loot.xp } },
  }
  const withBonus = loot.bonusChest ? addChest(withXp, newChest(loot.bonusChest, `Bonus from ${title}`, 'bonus')) : withXp
  return note(withBonus, title, loot.xp)
}

/** Claims today's Daily Rewards chest. Returns the state unchanged (and no claim) if it was already claimed. */
export const claimDaily = (s: UserState, seed: string, today: string = dayKey(), serverLoot?: Loot & { cycleDay: number }): { state: UserState; claim: RewardClaim | null } => {
  if (!canClaimDaily(s, today)) return { state: s, claim: null }
  const cycleDay = serverLoot?.cycleDay ?? cycleDayFor(s, today)
  const loot = serverLoot ?? rollLoot(CYCLE[cycleDay - 1], `${seed}:${today}`)
  const claim: RewardClaim = { ...loot, cycleDay, at: new Date().toISOString() }
  const granted = grantLoot(s, loot, `Daily Rewards day ${cycleDay}: ${RARITY[loot.rarity].name} chest`, today)
  return { state: { ...granted, rewardClaims: { ...granted.rewardClaims, [today]: claim } }, claim }
}

/** Opens a bonus chest from the inventory. Unknown ids (already opened) change nothing. */
export const openChest = (s: UserState, chestId: string, seed: string): { state: UserState; loot: Loot | null } => {
  const chest = s.chests.find((c) => c.id === chestId)
  if (!chest) return { state: s, loot: null }
  const loot = rollLoot(chest.rarity, `${seed}:${chest.id}`)
  const remaining = { ...s, chests: s.chests.filter((c) => c.id !== chestId) }
  return { state: grantLoot(remaining, loot, `${RARITY[chest.rarity].name} chest (${chest.source})`), loot }
}

/**
 * Chests earned by milestones in one XP-earning step: an Epic chest per new achievement,
 * a Legendary chest per streak milestone, and a Rare chest per level gained.
 */
export const milestoneChests = (before: UserState, after: UserState, achievements: string[]): UserState => {
  const chests: ChestItem[] = [
    ...achievements.map((id) => newChest('epic', 'achievement', id)),
    ...after.streakRewards.filter((d) => !before.streakRewards.includes(d)).map((d) => newChest('legendary', `${d}-day streak`, `streak${d}`)),
    ...Array.from({ length: Math.max(0, levelFromXp(after.xp) - levelFromXp(before.xp)) }, (_, i) => newChest('rare', 'level up', `lvl${i}`)),
  ]
  return chests.reduce(addChest, after)
}
