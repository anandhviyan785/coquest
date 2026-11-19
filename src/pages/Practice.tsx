import { CalendarCheck, Check, ChevronRight, Code2, Skull, Swords } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { PuzzleIcon } from '../components/icons'
import { cx } from '../components/ui'
import { LANG_LABEL, allBosses } from '../content'
import { challengeForDay } from '../content/challenges'
import { DIFFICULTY_NAME, difficultyForLevel, puzzleStreak } from '../content/puzzles'
import { dayKey } from '../lib/dates'
import { levelFromXp } from '../lib/gamification'
import { useApp } from '../state/AppContext'

function Card({ to, icon: Icon, title, body, done, tone }: { to: string; icon: LucideIcon; title: string; body: string; done?: boolean; tone: string }) {
  return (
    <Link to={to} data-sfx="open" className="press soft-card flex items-center gap-4 p-4">
      <span className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white', tone)}><Icon size={24} strokeWidth={2.4} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-body">{title}</span>
        <span className="block text-[14px] text-mute">{body}</span>
      </span>
      {done ? <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ok text-white"><Check size={16} strokeWidth={3.5} /></span> : <ChevronRight size={20} className="text-faint" />}
    </Link>
  )
}

/** The Practice tab: everything beyond the lesson path, with the Daily Puzzle first. */
export function Practice() {
  const { state } = useApp()
  const today = dayKey()
  const lang = state.profile.language ?? 'python'
  const solved = Boolean(state.puzzles[today])
  const challenge = challengeForDay(today)
  const bosses = allBosses()
  const beaten = bosses.filter((b) => state.lessons[b.boss.id]).length
  const run = puzzleStreak(state, today)

  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <Mascot expression="determined" motion="nod" size={64} />
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Practice</h1>
          <p className="text-[15px] text-mute">Sharpen your skills between lessons.</p>
        </div>
      </header>

      <Link to="/puzzle" data-sfx="open" className="press grad-hero glow-blue relative mb-4 flex items-center gap-4 overflow-hidden rounded-[24px] p-5 text-white">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-white shadow-lg"><PuzzleIcon size={46} className={solved ? undefined : 'piece-rock'} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-extrabold">Daily Puzzle</span>
          <span className="block text-[14px] font-bold text-white/85">{solved ? `Done for today${run > 1 ? ` · ${run}-day run` : ''}` : `${LANG_LABEL[lang]} · ${DIFFICULTY_NAME[difficultyForLevel(levelFromXp(state.xp))]} · new every day`}</span>
        </span>
        {solved ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue"><Check size={18} strokeWidth={3.5} /></span> : <ChevronRight size={24} />}
      </Link>

      <div className="grid gap-3">
        <Card to="/daily" icon={CalendarCheck} title="Daily coding challenge" body={`${challenge.title} · ${challenge.difficulty} · write and run real code`} done={Boolean(state.daily[today])} tone="bg-[#1D5FD1]" />
        <Card to="/playground" icon={Code2} title="Playground" body="Write and run code freely in any language" tone="bg-[#2470E8]" />
        <Card to="/bosses" icon={Skull} title="Boss battles" body={`${beaten} of ${bosses.length} bosses defeated`} tone="bg-[#0EA5E9]" />
        <Card to="/duels" icon={Swords} title="Duels" body="Race another coder to solve the same problem" tone="bg-[#19B8F0]" />
      </div>
    </div>
  )
}
