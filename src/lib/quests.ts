import { dayKey } from './dates'
import { addGems } from './gamification'
import type { UserState } from './types'

export interface Quest { id: string; title: string; target: number; reward: number; progress: (s: UserState, day: string) => number }

/** Daily quests. Progress is read from the day's activity log, so it resets at midnight. */
export const DAILY_QUESTS: Quest[] = [
  { id: 'xp', title: 'Earn 30 XP', target: 30, reward: 10, progress: (s, day) => s.days[day]?.xp ?? 0 },
  { id: 'lessons', title: 'Complete 2 lessons', target: 2, reward: 15, progress: (s, day) => s.days[day]?.lessons ?? 0 },
  { id: 'correct', title: 'Get 8 answers right', target: 8, reward: 15, progress: (s, day) => s.days[day]?.correct ?? 0 },
]

export interface QuestStatus { quest: Quest; current: number; done: boolean; claimed: boolean }

export const questStatus = (s: UserState, day: string = dayKey()): QuestStatus[] =>
  DAILY_QUESTS.map((quest) => {
    const current = Math.min(quest.progress(s, day), quest.target)
    return { quest, current, done: current >= quest.target, claimed: (s.questClaims[day] ?? []).includes(quest.id) }
  })

/** Collects a finished quest's gems. Returns the state unchanged if it is not claimable. */
export const claimQuest = (s: UserState, id: string, day: string = dayKey()): UserState => {
  const status = questStatus(s, day).find((q) => q.quest.id === id)
  if (!status || !status.done || status.claimed) return s
  return { ...addGems(s, status.quest.reward, `Daily quest: ${status.quest.title}`), questClaims: { [day]: [...(s.questClaims[day] ?? []), id] } }
}
