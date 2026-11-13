/** Reminder wording. QUEST nudges, cheers and gently guilt-trips, in the spirit of a friendly owl. */

export interface Reminder { title: string; body: string }

interface Context { left: number; streak: number }

type Template = (c: Context) => Reminder

/** Evening nudges when the daily goal is still open. */
const NUDGES: Template[] = [
  ({ left }) => ({ title: 'QUEST misses you!', body: `Just ${left} XP to hit today's goal. A tiny lesson counts!` }),
  ({ left }) => ({ title: 'Ready for a quick win?', body: `${left} XP and you are done for the day. You have got this!` }),
  ({ left }) => ({ title: 'Your code is waiting', body: `Five minutes, ${left} XP. Future you will say thanks.` }),
  ({ left }) => ({ title: 'Psst... it is QUEST', body: `I saved your seat. ${left} XP to go, let's code!` }),
  ({ left }) => ({ title: 'Small steps, big skills', body: `${left} XP away from today's goal. Tap to learn something new.` }),
]

/** Used when the player has a running streak worth protecting. */
const STREAK_NUDGES: Template[] = [
  ({ streak, left }) => ({ title: `Your ${streak}-day streak is on the line!`, body: `${left} XP keeps it alive. Do not let it go!` }),
  ({ streak }) => ({ title: `${streak} days in a row. Do not stop now!`, body: 'One short lesson keeps the streak going.' }),
  ({ streak, left }) => ({ title: 'QUEST is worried...', body: `Your ${streak}-day streak needs ${left} more XP today.` }),
]

/** Late reminder, sent when a streak is about to break. */
const LAST_CHANCE: Template[] = [
  ({ streak }) => ({ title: `Last chance for your ${streak}-day streak!`, body: 'The day is almost over. One quick lesson saves it!' }),
  ({ streak }) => ({ title: 'QUEST is begging you', body: `Do not lose ${streak} days of progress. Just one lesson!` }),
]

const pick = (list: Template[], c: Context, seed: number): Reminder => list[seed % list.length](c)

/** Picks a message that depends on the day, so it changes daily but stays stable within a day. */
export const eveningReminder = (c: Context, seed: number): Reminder =>
  c.streak > 0 ? pick(STREAK_NUDGES, c, seed) : pick(NUDGES, c, seed)

export const lastChanceReminder = (c: Context, seed: number): Reminder => pick(LAST_CHANCE, c, seed)

const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365]

/** A celebration for reaching a streak milestone, or null when today is not one. */
export const streakMilestone = (streak: number): Reminder | null => {
  if (!MILESTONES.includes(streak)) return null
  return { title: `${streak}-day streak! 🔥`, body: `You are on fire. QUEST is so proud of you!` }
}

/** Encouragement shown when the player reaches their daily goal. */
export const goalReached = (streak: number): Reminder => ({
  title: 'Daily goal complete!',
  body: streak > 1 ? `${streak} days in a row. See you tomorrow, champion!` : 'Great work today. Come back tomorrow to start a streak!',
})
