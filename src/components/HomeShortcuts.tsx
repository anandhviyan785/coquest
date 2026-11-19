import { Check, ChevronDown, Code2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DIFFICULTY_NAME, difficultyForLevel, puzzleStreak } from '../content/puzzles'
import { dayKey } from '../lib/dates'
import { frozenDays, levelFromXp, liveStreak } from '../lib/gamification'
import { CYCLE, RARITY, canClaimDaily, cycleDayFor } from '../lib/rewards'
import type { Course } from '../lib/types'
import { useApp } from '../state/AppContext'
import { Chest } from './Chest'
import { BookIcon, PuzzleIcon } from './icons'
import { LangLogo } from './LangLogo'
import { cx } from './ui'

/** Daily Rewards and Daily Puzzle: the two big tiles at the top of the Learn screen. */
export function FeatureTiles({ course }: { course: Course }) {
  const { state } = useApp()
  const today = dayKey()
  const claimable = canClaimDaily(state, today)
  const cycleDay = claimable ? cycleDayFor(state, today) : state.rewardClaims[today]?.cycleDay ?? 1
  const rarity = CYCLE[cycleDay - 1]
  const solvedToday = state.puzzles[today]
  const tier = difficultyForLevel(levelFromXp(state.xp))
  const puzzleRun = puzzleStreak(state, today)

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
      <Link to="/rewards" aria-label={claimable ? 'Daily Rewards: a chest is ready to claim' : 'Daily Rewards'} data-sfx="open" className="press grad-night glow-purple relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-[24px] p-4 text-white">
        {claimable && <span className="absolute right-3 top-3 h-3.5 w-3.5 rounded-full border-2 border-white bg-bad" aria-hidden="true"><span className="absolute inset-0 animate-ping rounded-full bg-bad" /></span>}
        <Chest rarity={rarity} size={84} idle={claimable} open={!claimable} className="-ml-1 -mt-1" />
        <span>
          <span className="block text-[18px] font-extrabold leading-tight">Daily Rewards</span>
          <span className="block text-[13px] font-bold text-white/80">{claimable ? `Day ${cycleDay}: ${RARITY[rarity].name} chest ready` : 'Claimed. Back tomorrow!'}</span>
        </span>
      </Link>

      <Link to="/puzzle" aria-label={solvedToday ? 'Daily Puzzle: done for today' : 'Daily Puzzle'} data-sfx="open" className="press grad-hero glow-purple relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-[24px] p-4 text-white">
        {solvedToday && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue"><Check size={16} strokeWidth={3.5} /></span>}
        <span className="relative flex h-[84px] w-[84px] items-center justify-center">
          <span className="animate-glow absolute inset-1 rounded-[22px] bg-white/35 blur-md" /><span className="absolute inset-2 rounded-[20px] bg-white shadow-lg" />
          <PuzzleIcon size={56} className={cx('relative', !solvedToday && 'piece-rock')} />
        </span>
        <span>
          <span className="block text-[18px] font-extrabold leading-tight">Daily Puzzle</span>
          <span className="block text-[13px] font-bold text-white/85">
            {solvedToday ? `Done${puzzleRun > 1 ? ` · ${puzzleRun}-day run` : ''}` : `${course.name} · ${DIFFICULTY_NAME[tier]}`}
          </span>
        </span>
      </Link>
    </div>
  )
}

/** The compact language box and the glossary book, side by side. */
export function CompactShortcuts({ course, onOpenLanguages }: { course: Course; onOpenLanguages: () => void }) {
  return (
    <div className="mb-6 flex gap-3">
      <button onClick={onOpenLanguages} data-sfx="open" aria-haspopup="dialog" aria-label={`Language: ${course.name}. Change language`} className="press soft-card flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2.5 text-left sm:gap-3 sm:px-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue sm:h-9 sm:w-9"><Code2 size={18} strokeWidth={2.6} /></span>
        <LangLogo lang={course.id} size={22} />
        <span className="min-w-0 flex-1">
          <span className="label block text-[10px] text-faint">Language</span>
          <span className="block truncate text-[15px] font-bold text-body">{course.name}</span>
        </span>
        <ChevronDown size={18} strokeWidth={3} className="shrink-0 text-faint" />
      </button>
      <Link to={`/learn/${course.id}/glossary`} data-sfx="open" aria-label={`${course.name} glossary`} className="press soft-card flex shrink-0 items-center gap-2 px-3 py-2.5 sm:px-3.5" style={{ perspective: 200 }}>
        <BookIcon size={30} className="book-flip" />
        <span className="text-[15px] font-bold text-body">Glossary</span>
      </Link>
    </div>
  )
}

/** Explains a streak saver that is protecting the streak right now. */
export function SaverNotice() {
  const { state } = useApp()
  const covered = frozenDays(state)
  if (covered.length === 0) return null
  const streak = liveStreak(state)
  return (
    <p className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-blue-line bg-blue-soft px-4 py-3 text-[14px] font-bold leading-relaxed text-body" role="note">
      <ShieldCheck size={22} strokeWidth={2.6} className="mt-0.5 shrink-0 text-blue" />
      <span>You missed {covered.length === 1 ? 'a day' : `${covered.length} days`}, so {covered.length === 1 ? 'a streak saver is' : `${covered.length} streak savers are`} protecting your {streak}-day streak. {covered.length === 1 ? 'It is' : 'They are'} used up automatically when you finish your next lesson, and your streak carries on.</span>
    </p>
  )
}
