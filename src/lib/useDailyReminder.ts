import { useEffect, useRef } from 'react'
import { eveningReminder, goalReached, lastChanceReminder, streakMilestone } from '../content/reminders'
import { useApp } from '../state/AppContext'
import { dayKey } from './dates'
import { liveStreak } from './gamification'
import { notificationPermission, showNotification } from './notify'

/** Local hour after which a reminder is shown if the daily goal is still unmet. */
export const REMINDER_HOUR = 18
/** Local hour after which a player with a streak gets one last warning. */
export const LAST_CHANCE_HOUR = 21
const CHECK_EVERY_MS = 60_000

type Kind = 'evening' | 'last-chance' | 'goal'
const keyFor = (kind: Kind): string => `pyquest:v1:reminded:${kind}`

const lastSent = (kind: Kind): string | null => {
  try {
    return localStorage.getItem(keyFor(kind))
  } catch {
    return null
  }
}

const markSent = (kind: Kind, day: string): void => {
  try {
    localStorage.setItem(keyFor(kind), day)
  } catch (err) {
    console.error('Could not remember a reminder', err)
  }
}

/** A number that changes each day, so the wording rotates. */
const daySeed = (day: string): number => Number(day.replace(/\D/g, '')) || 0

/**
 * Shows motivational notifications while CoQuest is open: an evening nudge, a last-chance warning
 * when a streak is about to break, and a cheer when the daily goal (or a streak milestone) is
 * reached. Reminders with the app closed would need a push server.
 */
export function useDailyReminder(): void {
  const { status, state } = useApp()
  const wasMet = useRef<boolean | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (status !== 'ready' || !state.onboarded || !state.profile.reminders) return
    const today = dayKey()
    const xp = state.days[today]?.xp ?? 0
    const left = state.dailyGoal - xp
    const streak = liveStreak(state)
    const met = left <= 0

    // Cheer the moment the goal is met (not on the first load of an already-finished day).
    if (wasMet.current === false && met && lastSent('goal') !== today && notificationPermission() === 'granted') {
      markSent('goal', today)
      const milestone = streakMilestone(streak)
      const message = milestone ?? goalReached(streak)
      void showNotification(message.title, message.body)
    }
    wasMet.current = met

    const check = () => {
      // Recompute from the latest state so a tab left open past midnight uses today's values.
      const now = stateRef.current
      const today = dayKey()
      const left = now.dailyGoal - (now.days[today]?.xp ?? 0)
      const streak = liveStreak(now)
      if (notificationPermission() !== 'granted' || left <= 0) return
      const hour = new Date().getHours()
      const context = { left, streak }
      if (streak > 0 && hour >= LAST_CHANCE_HOUR && lastSent('last-chance') !== today) {
        markSent('last-chance', today)
        markSent('evening', today)
        const message = lastChanceReminder(context, daySeed(today))
        void showNotification(message.title, message.body)
        return
      }
      if (hour >= REMINDER_HOUR && lastSent('evening') !== today) {
        markSent('evening', today)
        const message = eveningReminder(context, daySeed(today))
        void showNotification(message.title, message.body)
      }
    }
    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    return () => clearInterval(timer)
  }, [status, state])
}
