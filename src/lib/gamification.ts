import { addDays, dayKey, daysBetween, weekStartOf } from './dates.ts'
import type { DayLog, HistoryItem, LangId, UserState } from './types.ts'

export const XP = {
  lesson: 20,
  perfectBonus: 10,
  bossStage: 25,
  bossClear: 50,
  daily: { Easy: 30, Medium: 45, Hard: 60 },
  duelWin: 40,
  duelPlay: 10,
} as const

export const GOAL_PRESETS = [
  { xp: 20, label: 'Casual', time: 'about 5 minutes a day' },
  { xp: 50, label: 'Regular', time: 'about 10 minutes a day' },
  { xp: 100, label: 'Serious', time: 'about 20 minutes a day' },
  { xp: 150, label: 'Intense', time: 'about 30 minutes a day' },
] as const

/** Bounds for a custom daily goal, in XP. */
export const MIN_GOAL = 10
export const MAX_GOAL = 500

/** Gems are earned with XP: one gem for every four XP. */
export const gemsForXp = (xp: number): number => Math.round(xp / 4)

export const SHOP = {
  freeze: { cost: 200, max: 2 },
  wager: { cost: 50, days: 7, payout: 100 },
} as const
const HISTORY_LIMIT = 60
const GEM_LOG_LIMIT = 100

/** Adds (or, when negative, spends) gems and records why in the gem history. */
export const addGems = (s: UserState, amount: number, reason: string): UserState =>
  amount === 0
    ? s
    : {
        ...s,
        gems: Math.max(0, s.gems + amount),
        gemLog: [{ at: new Date().toISOString(), amount, reason }, ...(s.gemLog ?? [])].slice(0, GEM_LOG_LIMIT),
      }

// ── Levels ────────────────────────────────────────────────────────────────
/** Total XP needed to reach a level. Level 1 = 0, 2 = 100, 3 = 300, 4 = 600 … */
export const xpForLevel = (level: number): number => 50 * level * (level - 1)

export const levelFromXp = (xp: number): number => {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level += 1
  return level
}

export const levelProgress = (xp: number) => {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  return { level, into: xp - floor, span: ceil - floor, toNext: ceil - xp }
}

// ── Leagues ───────────────────────────────────────────────────────────────
export const LEAGUES = [
  { id: 'bronze', name: 'Bronze', minXp: 0, color: '#C98A5A' },
  { id: 'silver', name: 'Silver', minXp: 400, color: '#B6C2D2' },
  { id: 'gold', name: 'Gold', minXp: 1200, color: '#FBBF24' },
  { id: 'platinum', name: 'Platinum', minXp: 3000, color: '#67E8F9' },
  { id: 'diamond', name: 'Diamond', minXp: 6000, color: '#3B82F6' },
  { id: 'master', name: 'Master', minXp: 10000, color: '#F97316' },
] as const

export type League = (typeof LEAGUES)[number]

export const leagueFromXp = (xp: number): League =>
  [...LEAGUES].reverse().find((l) => xp >= l.minXp) ?? LEAGUES[0]

export const nextLeague = (xp: number): League | null =>
  LEAGUES.find((l) => l.minXp > xp) ?? null

// ── Streaks ───────────────────────────────────────────────────────────────
export const STREAK_REWARDS = [
  { days: 7, xp: 50, freezes: 1 },
  { days: 30, xp: 200, freezes: 2 },
  { days: 100, xp: 1000, freezes: 3 },
] as const

/** The streak as it stands today, before any new activity is recorded. */
export const liveStreak = (s: UserState, today: string = dayKey()): number => {
  if (!s.lastActive) return 0
  const missed = daysBetween(s.lastActive, today) - 1
  return missed <= s.freezes ? s.streak : 0
}

/** Days in the gap between lastActive and today that a freeze is covering. */
export const frozenDays = (s: UserState, today: string = dayKey()): string[] => {
  if (!s.lastActive) return []
  const missed = daysBetween(s.lastActive, today) - 1
  if (missed <= 0 || missed > s.freezes) return []
  return Array.from({ length: missed }, (_, i) => addDays(s.lastActive as string, i + 1))
}

const touchStreak = (s: UserState, today: string): UserState => {
  if (s.lastActive === today) return s
  const missed = s.lastActive ? daysBetween(s.lastActive, today) - 1 : Infinity
  const kept = missed <= 0 || missed <= s.freezes
  const streak = kept ? s.streak + 1 : 1
  const freezes = kept && missed > 0 ? s.freezes - missed : s.freezes
  return { ...s, streak, freezes, lastActive: today, longestStreak: Math.max(s.longestStreak, streak) }
}

// ── Activity ──────────────────────────────────────────────────────────────
const emptyDay = (): DayLog => ({ xp: 0, seconds: 0, lessons: 0, correct: 0, attempts: 0, langs: {} })

export interface Activity {
  xp: number
  title: string
  kind: HistoryItem['kind']
  lang?: LangId
  seconds?: number
  lessons?: number
  correct?: number
  attempts?: number
}

const rollWeek = (s: UserState, today: string): UserState => {
  const week = weekStartOf(today)
  return s.weekStart === week ? s : { ...s, weekStart: week, weeklyXp: 0 }
}

const grantStreakRewards = (s: UserState): UserState =>
  STREAK_REWARDS.filter((r) => s.streak >= r.days && !s.streakRewards.includes(r.days)).reduce<UserState>(
    (acc, r) => ({
      ...acc,
      xp: acc.xp + r.xp,
      weeklyXp: acc.weeklyXp + r.xp,
      freezes: acc.freezes + r.freezes,
      streakRewards: [...acc.streakRewards, r.days],
      history: [
        { at: new Date().toISOString(), kind: 'reward' as const, title: `${r.days}-day streak reward`, xp: r.xp },
        ...acc.history,
      ].slice(0, HISTORY_LIMIT),
    }),
    s,
  )

/** Applies an XP-earning activity: XP, weekly XP, day log, streak, rewards, history. */
export const applyActivity = (state: UserState, a: Activity, today: string = dayKey()): UserState => {
  const rolled = touchStreak(rollWeek(state, today), today)
  const prev = rolled.days[today] ?? emptyDay()
  const day: DayLog = {
    xp: prev.xp + a.xp,
    seconds: prev.seconds + (a.seconds ?? 0),
    lessons: prev.lessons + (a.lessons ?? 0),
    correct: prev.correct + (a.correct ?? 0),
    attempts: prev.attempts + (a.attempts ?? 0),
    langs: a.lang ? { ...prev.langs, [a.lang]: (prev.langs[a.lang] ?? 0) + a.xp } : prev.langs,
  }
  const next: UserState = {
    ...addGems(rolled, gemsForXp(a.xp), a.title),
    xp: rolled.xp + a.xp,
    weeklyXp: rolled.weeklyXp + a.xp,
    days: { ...rolled.days, [today]: day },
    history: [{ at: new Date().toISOString(), kind: a.kind, title: a.title, xp: a.xp }, ...rolled.history].slice(
      0,
      HISTORY_LIMIT,
    ),
  }
  return settleWager(grantStreakRewards(next), state.lastActive !== today)
}

// ── Shop ──────────────────────────────────────────────────────────────────
const note = (s: UserState, title: string): UserState => ({
  ...s,
  history: [{ at: new Date().toISOString(), kind: 'reward' as const, title, xp: 0 }, ...s.history].slice(0, HISTORY_LIMIT),
})

/** Pays out a won wager, or clears one whose streak was broken. */
const settleWager = (s: UserState, newDay: boolean): UserState => {
  if (!s.wager) return s
  if (s.streak >= s.wager.target) return note({ ...addGems(s, SHOP.wager.payout, 'Double or Nothing won'), wager: null }, `Double or Nothing won: +${SHOP.wager.payout} gems`)
  if (newDay && s.streak <= s.wager.base) return note({ ...s, wager: null }, 'Double or Nothing lost: streak broken')
  return s
}

export const canBuyFreeze = (s: UserState): boolean => s.gems >= SHOP.freeze.cost && s.freezes < SHOP.freeze.max

export const buyFreeze = (s: UserState): UserState =>
  canBuyFreeze(s) ? note({ ...addGems(s, -SHOP.freeze.cost, 'Bought a Streak Freeze'), freezes: s.freezes + 1 }, 'Bought a Streak Freeze') : s

export const canPlaceWager = (s: UserState): boolean => s.gems >= SHOP.wager.cost && s.wager === null

export const placeWager = (s: UserState, today: string = dayKey()): UserState => {
  if (!canPlaceWager(s)) return s
  const base = liveStreak(s, today)
  return note({ ...addGems(s, -SHOP.wager.cost, 'Placed a Double or Nothing wager'), wager: { base, target: base + SHOP.wager.days } }, 'Placed a Double or Nothing wager')
}

/** Consecutive days, ending today or yesterday, on which the daily goal was met. */
export const goalRun = (s: UserState, today: string = dayKey()): number => {
  const met = (k: string) => (s.days[k]?.xp ?? 0) >= s.dailyGoal
  let cursor = met(today) ? today : addDays(today, -1)
  let run = 0
  while (met(cursor)) {
    run += 1
    cursor = addDays(cursor, -1)
  }
  return run
}

// ── Totals ────────────────────────────────────────────────────────────────
export const totals = (s: UserState) => {
  const days = Object.values(s.days)
  const sum = (pick: (d: DayLog) => number) => days.reduce((n, d) => n + pick(d), 0)
  const attempts = sum((d) => d.attempts)
  const correct = sum((d) => d.correct)
  return {
    seconds: sum((d) => d.seconds),
    lessons: Object.keys(s.lessons).filter((id) => !id.startsWith('boss:')).length,
    bosses: Object.keys(s.lessons).filter((id) => id.startsWith('boss:')).length,
    attempts,
    correct,
    accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
    activeDays: days.filter((d) => d.xp > 0).length,
  }
}

export const newUserState = (username: string): UserState => ({
  username,
  avatar: 'curious',
  onboarded: false,
  profile: { language: null, reason: null, level: null, reminders: false },
  xp: 0,
  streak: 0,
  longestStreak: 0,
  lastActive: null,
  freezes: 1,
  dailyGoal: 50,
  weekStart: weekStartOf(),
  weeklyXp: 0,
  lessons: {},
  days: {},
  achievements: {},
  daily: {},
  streakRewards: [],
  duels: { played: 0, won: 0 },
  gems: 0,
  questClaims: {},
  wager: null,
  history: [],
  createdAt: new Date().toISOString(),
  settings: { sfx: true, music: false, volume: 0.7 },
  rewardClaims: {},
  chests: [],
  puzzles: {},
  gemLog: [],
})
