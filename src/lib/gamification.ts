import { addDays, dayKey, daysBetween, weekStartOf } from './dates'
import type { DayLog, HistoryItem, LangId, UserState } from './types'

export const XP = {
  lesson: 20,
  perfectBonus: 10,
  bossStage: 25,
  bossClear: 50,
  daily: { Easy: 30, Medium: 45, Hard: 60 },
  duelWin: 40,
  duelPlay: 10,
} as const

export const DAILY_GOALS = [20, 50, 100, 150] as const
const HISTORY_LIMIT = 60

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
    ...rolled,
    xp: rolled.xp + a.xp,
    weeklyXp: rolled.weeklyXp + a.xp,
    days: { ...rolled.days, [today]: day },
    history: [{ at: new Date().toISOString(), kind: a.kind, title: a.title, xp: a.xp }, ...rolled.history].slice(
      0,
      HISTORY_LIMIT,
    ),
  }
  return grantStreakRewards(next)
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
  history: [],
  createdAt: new Date().toISOString(),
})
