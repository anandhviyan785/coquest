import { BarChart3, Bot, CalendarCheck, Flame, GraduationCap, LayoutDashboard, Medal, Menu, Settings as SettingsIcon, Skull, Swords, TerminalSquare, Trophy, User, X, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { achievementById } from '../lib/achievements'
import { levelProgress, liveStreak } from '../lib/gamification'
import { useApp } from '../state/AppContext'
import type { Toast } from '../state/AppContext'
import { Avatar } from './Avatar'
import { cx } from './ui'

interface NavItem { to: string; label: string; icon: LucideIcon }

const NAV: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: 'Learn',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/learn', label: 'Learn', icon: GraduationCap },
      { to: '/playground', label: 'Playground', icon: TerminalSquare },
      { to: '/tutor', label: 'AI Tutor', icon: Bot },
    ],
  },
  {
    heading: 'Compete',
    items: [
      { to: '/daily', label: 'Daily Challenges', icon: CalendarCheck },
      { to: '/bosses', label: 'Boss Battles', icon: Skull },
      { to: '/duels', label: 'Coding Duels', icon: Swords },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    heading: 'You',
    items: [
      { to: '/stats', label: 'Statistics', icon: BarChart3 },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-lg" />
      <span className="text-[17px] font-bold tracking-tight">
        <span className="text-ice">Py</span>Quest
      </span>
    </span>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useApp()
  const { level } = levelProgress(state.xp)
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Wordmark /></div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-3" aria-label="Main">
        {NAV.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">{group.heading}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                        isActive ? 'bg-raised text-ink shadow-[inset_2px_0_0_var(--color-cyan)]' : 'text-mute hover:bg-card hover:text-ink',
                      )
                    }
                  >
                    <Icon size={17} strokeWidth={1.9} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <NavLink to="/profile" onClick={onNavigate} className="m-3 flex items-center gap-3 rounded-xl border border-line bg-card p-2.5 transition-colors hover:border-sky/50">
        <Avatar avatar={state.avatar} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{state.username}</span>
          <span className="block text-xs text-mute">Level {level}</span>
        </span>
      </NavLink>
    </div>
  )
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { state, cloud, syncError } = useApp()
  const streak = liveStreak(state)
  const { level, into, span } = levelProgress(state.xp)
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur md:px-8">
      <button className="rounded-lg p-2 text-mute hover:bg-card hover:text-ink lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="lg:hidden"><Wordmark /></div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {syncError && <span className="hidden rounded-md border border-bad/40 bg-bad/10 px-2 py-1 text-xs text-bad sm:inline" title={syncError}>Not saved — {syncError}</span>}
        {!cloud && <span className="hidden rounded-md border border-line px-2 py-1 text-xs text-mute md:inline" title="Progress is saved in this browser. Add Supabase keys to sync and compete.">Local profile</span>}
        <span className="tnum flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-semibold" title={`${streak}-day streak`}>
          <Flame size={16} className={streak > 0 ? 'text-flame' : 'text-faint'} fill={streak > 0 ? 'currentColor' : 'none'} />
          {streak}
        </span>
        <span className="tnum flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-semibold" title="Total XP">
          <Zap size={16} className="text-gold" fill="currentColor" />
          {state.xp.toLocaleString()}
        </span>
        <span className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-semibold sm:flex" title={`${into} / ${span} XP to level ${level + 1}`}>
          <Medal size={16} className="text-ice" />
          Lv {level}
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-bg"><span className="block h-full rounded-full bg-cyan" style={{ width: `${(into / span) * 100}%` }} /></span>
        </span>
      </div>
    </header>
  )
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5500)
    return () => clearTimeout(timer)
  }, [onDone])
  const tone = toast.kind === 'error' ? 'border-bad/50' : toast.kind === 'achievement' ? 'border-gold/50' : 'border-sky/50'
  const Icon = toast.kind === 'achievement' ? Trophy : toast.kind === 'level' ? Medal : null
  return (
    <div className={cx('animate-rise flex w-80 items-start gap-3 rounded-xl border bg-raised p-3.5 shadow-xl shadow-black/40', tone)} role="status">
      {Icon && <Icon size={20} className={toast.kind === 'achievement' ? 'mt-0.5 text-gold' : 'mt-0.5 text-ice'} />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-[13px] text-mute">{toast.body}</p>}
      </div>
      <button onClick={onDone} className="text-faint hover:text-ink" aria-label="Dismiss"><X size={16} /></button>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
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

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <div className="flex h-full">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block"><Sidebar /></aside>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside className="animate-rise relative h-full w-64 border-r border-line bg-surface"><Sidebar onNavigate={() => setMenuOpen(false)} /></aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 md:px-8"><Outlet /></main>
      </div>
      <Toasts />
    </div>
  )
}
