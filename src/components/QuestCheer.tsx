import { dayKey } from '../lib/dates'
import { liveStreak } from '../lib/gamification'
import { useApp } from '../state/AppContext'
import { Mascot } from './Mascot'

const FRESH = ['Ready when you are. Let us learn something new!', 'Every expert started with a first lesson.', 'A little code a day goes a long way!']

/** A speech-bubble message from QUEST that reacts to today's progress and the current streak. */
export function QuestCheer() {
  const { state } = useApp()
  const today = dayKey()
  const xp = state.days[today]?.xp ?? 0
  const left = state.dailyGoal - xp
  const streak = liveStreak(state)

  const met = left <= 0
  const message = met
    ? streak > 1
      ? `Goal complete! ${streak} days in a row. You are unstoppable!`
      : 'Goal complete! Come back tomorrow to start a streak.'
    : xp > 0
      ? `Nice start! Only ${left} XP to today's goal.`
      : streak > 0
        ? `Keep your ${streak}-day streak alive. One lesson does it!`
        : FRESH[new Date().getDate() % FRESH.length]

  return (
    <div className="mb-6 flex items-center gap-4" role="status">
      <Mascot expression={met ? 'victorious' : 'happy'} motion={met ? 'jump' : 'sway'} size={72} />
      <p className="relative rounded-2xl border-2 border-line bg-white px-4 py-3 text-[16px] font-bold text-body before:absolute before:-left-[9px] before:top-1/2 before:h-4 before:w-4 before:-translate-y-1/2 before:rotate-45 before:border-b-2 before:border-l-2 before:border-line before:bg-white">{message}</p>
    </div>
  )
}
