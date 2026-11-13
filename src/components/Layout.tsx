import { BarChart3, Bot, CalendarCheck, Settings as SettingsIcon, Skull, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { achievementById } from '../lib/achievements'
import { leagueFromXp, liveStreak, nextLeague } from '../lib/gamification'
import { questStatus } from '../lib/quests'
import { useApp } from '../state/AppContext'
import type { Toast } from '../state/AppContext'
import { Avatar } from './Avatar'
import { BoltIcon, ChestIcon, DuelIcon, FlameIcon, GemIcon, LeagueIcon, LearnIcon, MoreIcon, PracticeIcon, QuestsIcon, ShopIcon } from './icons'
import { Bar, cx } from './ui'

interface NavItem { to: string; label: string; icon: (props: { size?: number }) => ReactNode }

const NAV: NavItem[] = [
  { to: '/', label: 'Learn', icon: LearnIcon },
  { to: '/playground', label: 'Practice', icon: PracticeIcon },
  { to: '/leaderboard', label: 'Leaderboards', icon: LeagueIcon },
  { to: '/quests', label: 'Quests', icon: QuestsIcon },
  { to: '/duels', label: 'Duels', icon: DuelIcon },
  { to: '/shop', label: 'Shop', icon: ShopIcon },
]

const MORE: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/daily', label: 'Daily challenge', icon: CalendarCheck },
  { to: '/bosses', label: 'Boss battles', icon: Skull },
  { to: '/tutor', label: 'AI tutor', icon: Bot },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

/** Tabs shown in the phone tab bar, in the kit's order. */
const TABS: NavItem[] = [NAV[0], NAV[2], NAV[3], NAV[5]]

const navClass = (active: boolean) =>
  cx(
    'label flex h-[52px] items-center gap-5 rounded-xl border-2 px-3 text-[15px] transition-colors',
    active ? 'border-blue-line bg-blue-soft text-blue' : 'border-transparent text-mute hover:bg-surface',
  )

export function Wordmark({ size = 30 }: { size?: number }) {
  return <span className="font-extrabold lowercase leading-none tracking-tight text-green" style={{ fontSize: size }}>pyquest</span>
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

function MoreMenu({ placement }: { placement: 'side' | 'top' }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const ref = useDismiss(open, () => setOpen(false))
  const active = MORE.some((item) => location.pathname.startsWith(item.to))
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div ref={ref} className="relative">
      {placement === 'side' ? (
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" className={cx(navClass(active || open), 'w-full')}>
          <MoreIcon size={32} />More
        </button>
      ) : (
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-label="More" className={cx('flex h-12 w-12 items-center justify-center rounded-xl border-2', active || open ? 'border-blue-line bg-blue-soft' : 'border-transparent')}>
          <MoreIcon size={32} />
        </button>
      )}
      {open && (
        <div role="menu" className={cx('animate-rise absolute z-50 w-60 overflow-hidden rounded-2xl border-2 border-line bg-white py-2', placement === 'side' ? 'left-full top-0 ml-3' : 'bottom-full right-0 mb-3')}>
          {MORE.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} role="menuitem" className={({ isActive }) => cx('label flex items-center gap-3 px-5 py-3 text-[13px]', isActive ? 'bg-blue-soft text-blue' : 'text-mute hover:bg-surface')}>
              <Icon size={18} strokeWidth={2.4} />{label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

function Sidebar() {
  const { state } = useApp()
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-line px-4 lg:flex">
      <Link to="/" className="px-4 pb-6 pt-8" aria-label="PyQuest home"><Wordmark /></Link>
      <nav className="flex flex-col gap-2" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => navClass(isActive)}>
            <Icon size={32} />{label}
          </NavLink>
        ))}
        <NavLink to="/profile" className={({ isActive }) => navClass(isActive)}>
          <Avatar avatar={state.avatar} size={32} />Profile
        </NavLink>
        <MoreMenu placement="side" />
      </nav>
    </aside>
  )
}

/** The streak / gems / XP counters that sit top-right on the web layout and top on phones. */
export function StatBar({ className }: { className?: string }) {
  const { state } = useApp()
  const streak = liveStreak(state)
  return (
    <div className={cx('flex items-center justify-between gap-4', className)}>
      <Link to="/quests" className="tnum flex items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold hover:bg-surface" title={`${streak}-day streak`}>
        <FlameIcon size={26} muted={streak === 0} /><span className={streak > 0 ? 'text-flame' : 'text-faint'}>{streak}</span>
      </Link>
      <Link to="/shop" className="tnum flex items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold text-blue hover:bg-surface" title="Gems">
        <GemIcon size={26} />{state.gems.toLocaleString()}
      </Link>
      <Link to="/profile" className="tnum flex items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold text-gold-dark hover:bg-surface" title="Total XP">
        <BoltIcon size={26} />{state.xp.toLocaleString()}
      </Link>
    </div>
  )
}

function RailCard({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-line p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {link && <Link to={link.to} className="label text-[13px] text-blue hover:brightness-90">{link.label}</Link>}
      </div>
      {children}
    </section>
  )
}

function Rail() {
  const { state, cloud } = useApp()
  const league = leagueFromXp(state.xp)
  const upcoming = nextLeague(state.xp)
  const quests = questStatus(state)
  return (
    <aside className="sticky top-0 hidden h-screen w-[368px] shrink-0 flex-col gap-6 overflow-y-auto pb-8 pt-6 xl:flex">
      <StatBar className="px-2" />

      <RailCard title={`${league.name} League`} link={{ to: '/leaderboard', label: 'View league' }}>
        <div className="flex items-center gap-4">
          <LeagueIcon size={52} color={league.color} />
          <p className="text-[15px] leading-snug text-mute">
            {upcoming ? <>Earn <span className="tnum font-bold text-body">{(upcoming.minXp - state.xp).toLocaleString()} XP</span> more to reach the {upcoming.name} League.</> : 'You have reached the top league.'}
          </p>
        </div>
      </RailCard>

      <RailCard title="Daily Quests" link={{ to: '/quests', label: 'View all' }}>
        <ul className="space-y-4">
          {quests.map(({ quest, current, done }) => (
            <li key={quest.id} className="flex items-center gap-4">
              <BoltIcon size={34} />
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-[15px] font-bold text-body">{quest.title}</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Bar value={current} max={quest.target} className="h-5" />
                    <span className="tnum absolute inset-0 flex items-center justify-center text-[12px] font-bold text-body">{current} / {quest.target}</span>
                  </div>
                  <ChestIcon size={30} open={done} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </RailCard>

      {!cloud && (
        <RailCard title="Local profile">
          <p className="text-[15px] leading-relaxed text-mute">Your progress is saved in this browser. Connect a Supabase project to sync it and compete with others.</p>
        </RailCard>
      )}
    </aside>
  )
}

function TabBar() {
  const { state } = useApp()
  const tab = (active: boolean) => cx('flex h-12 w-12 items-center justify-center rounded-xl border-2', active ? 'border-blue-line bg-blue-soft' : 'border-transparent')
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t-2 border-line bg-white px-2 py-2 lg:hidden" aria-label="Main">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} aria-label={label} className={({ isActive }) => tab(isActive)}><Icon size={32} /></NavLink>
      ))}
      <NavLink to="/profile" aria-label="Profile" className={({ isActive }) => tab(isActive)}><Avatar avatar={state.avatar} size={32} /></NavLink>
      <MoreMenu placement="top" />
    </nav>
  )
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5500)
    return () => clearTimeout(timer)
  }, [onDone])
  const tone = toast.kind === 'error' ? 'border-bad' : toast.kind === 'achievement' ? 'border-gold' : 'border-blue-line'
  return (
    <div className={cx('animate-rise flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border-2 bg-white p-4', tone)} role="status">
      {toast.kind === 'achievement' && <QuestsIcon size={30} />}
      {toast.kind === 'level' && <BoltIcon size={28} />}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-[13px] text-mute">{toast.body}</p>}
      </div>
      <button onClick={onDone} className="text-faint hover:text-mute" aria-label="Dismiss"><X size={18} strokeWidth={3} /></button>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[60] flex flex-col gap-2 lg:bottom-4">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto"><ToastCard toast={t} onDone={() => dismissToast(t.id)} /></div>
      ))}
    </div>
  )
}

/** Turns an EarnResult into toasts. Shared by every flow that awards XP. */
export function useRewardToasts() {
  const { notify } = useApp()
  return (result: { achievements: string[]; leveledUp: number | null }) => {
    if (result.leveledUp) notify({ kind: 'level', title: `Level ${result.leveledUp} reached`, body: 'Keep going — the next one is already in sight.' })
    result.achievements.forEach((id) => {
      const a = achievementById(id)
      if (a) notify({ kind: 'achievement', title: `Achievement unlocked: ${a.name}`, body: a.description })
    })
  }
}

/**
 * The web shell from the kit: navigation on the left, a 592px content column and, when `rail`
 * is set, a 368px column of cards on the right. Below `lg` it becomes the phone layout with a
 * stat bar on top and a tab bar at the bottom. `wide` pages use the full content width instead.
 */
export function Layout({ rail = false }: { rail?: boolean }) {
  const { syncError } = useApp()
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 justify-center gap-12 px-4 lg:px-6">
        <div className={cx('w-full min-w-0 pb-28 lg:pb-12', rail ? 'max-w-[592px]' : 'max-w-[1008px]')}>
          <StatBar className={cx('sticky top-0 z-30 -mx-4 border-b-2 border-line bg-white px-4 py-2', rail ? 'xl:hidden' : '', 'lg:static lg:mx-0 lg:justify-end lg:gap-6 lg:border-b-0 lg:px-0 lg:pt-6')} />
          {syncError && <p className="mt-4 rounded-xl border-2 border-bad bg-bad-soft px-4 py-2.5 text-sm font-bold text-bad-dark" role="alert">Not saved — {syncError}</p>}
          <main className="pt-6">
            <Outlet />
          </main>
        </div>
        {rail && <Rail />}
      </div>
      <TabBar />
      <Toasts />
    </div>
  )
}
