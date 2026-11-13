import { useEffect } from 'react'
import { useApp } from '../state/AppContext'
import { dayKey } from './dates'
import { liveStreak } from './gamification'
import { notificationPermission, showNotification } from './notify'

/** Local hour after which a reminder is shown if the daily goal is still unmet. */
export const REMINDER_HOUR = 18
const CHECK_EVERY_MS = 60_000
const REMINDED_KEY = 'pyquest:v1:reminded'

const lastReminded = (): string | null => {
  try {
    return localStorage.getItem(REMINDED_KEY)
  } catch {
    return null
  }
}

const markReminded = (day: string): void => {
  try {
    localStorage.setItem(REMINDED_KEY, day)
  } catch (err) {
    console.error("Could not remember today's reminder", err)
  }
}

/**
 * Shows one reminder a day, in the evening, if the player allowed them and has not yet reached
 * their daily goal. It runs while CoQuest is open (in a tab or on a phone); reminders when the
 * app is closed would need a push server.
 */
export function useDailyReminder(): void {
  const { status, state } = useApp()

  useEffect(() => {
    if (status !== 'ready' || !state.onboarded || !state.profile.reminders) return
    const check = () => {
      if (notificationPermission() !== 'granted') return
      if (new Date().getHours() < REMINDER_HOUR) return
      const today = dayKey()
      if (lastReminded() === today) return
      markReminded(today)
      const left = state.dailyGoal - (state.days[today]?.xp ?? 0)
      if (left <= 0) return
      const streak = liveStreak(state)
      void showNotification(
        'Time to practise',
        streak > 0 ? `${left} XP to today's goal. Keep your ${streak}-day streak alive!` : `${left} XP to today's goal. One short lesson is enough.`,
      )
    }
    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    return () => clearInterval(timer)
  }, [status, state])
}
