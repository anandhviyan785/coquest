import { COURSES } from '../content'
import { goalRun, totals } from './gamification'
import type { UserState } from './types'

export interface Achievement {
  id: string
  name: string
  description: string
  /** Progress toward the goal as [current, target]. */
  progress: (s: UserState) => [number, number]
}

const pythonUnitOne = COURSES.find((c) => c.id === 'python')?.units[0].lessons.map((l) => l.id) ?? []

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson.', progress: (s) => [Math.min(totals(s).lessons, 1), 1] },
  {
    id: 'python-pioneer',
    name: 'Python Pioneer',
    description: 'Finish every lesson in Python Fundamentals.',
    progress: (s) => [pythonUnitOne.filter((id) => s.lessons[id]).length, pythonUnitOne.length],
  },
  { id: 'debugging-expert', name: 'Debugging Expert', description: 'Defeat three unit bosses.', progress: (s) => [Math.min(totals(s).bosses, 3), 3] },
  { id: 'streak-7', name: '7-Day Streak', description: 'Learn seven days in a row.', progress: (s) => [Math.min(s.longestStreak, 7), 7] },
  { id: 'xp-1000', name: '1000 XP Club', description: 'Earn 1,000 XP in total.', progress: (s) => [Math.min(s.xp, 1000), 1000] },
  { id: 'coding-champion', name: 'Coding Champion', description: 'Win a coding duel.', progress: (s) => [Math.min(s.duels.won, 1), 1] },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Hit your daily goal seven days running.', progress: (s) => [Math.min(goalRun(s), 7), 7] },
]

export const achievementById = (id: string): Achievement | undefined => ACHIEVEMENTS.find((a) => a.id === id)

/** Awards any achievements whose goal is now met. Returns the new state and the ids just earned. */
export const awardAchievements = (s: UserState): { state: UserState; earned: string[] } => {
  const earned = ACHIEVEMENTS.filter((a) => {
    if (s.achievements[a.id]) return false
    const [current, target] = a.progress(s)
    return current >= target
  }).map((a) => a.id)
  if (earned.length === 0) return { state: s, earned }
  const stamp = new Date().toISOString()
  const achievements = earned.reduce((acc, id) => ({ ...acc, [id]: stamp }), s.achievements)
  return { state: { ...s, achievements }, earned }
}
