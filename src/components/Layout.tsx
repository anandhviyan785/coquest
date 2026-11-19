import { BarChart3, CalendarCheck, LogOut, Settings as SettingsIcon, Skull, Store, Swords, Target, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { achievementById } from '../lib/achievements'
import { dayKey } from '../lib/dates'
import { leagueFromXp, liveStreak, nextLeague } from '../lib/gamification'
import { questStatus } from '../lib/quests'
import { canClaimDaily } from '../lib/rewards'
import { useApp } from '../state/AppContext'
import type { Toast } from '../state/AppContext'
import { Avatar } from './Avatar'
import { CountUp } from './CountUp'
import { Wordmark } from './Wordmark'
import { BoltIcon, ChestIcon, FlameIcon, GemIcon, LeagueIcon, LearnIcon, MoreIcon, PracticeIcon, QuestsIcon, RewardsIcon } from './icons'
import { Bar, Ring, cx } from './ui'
import LiquidGlass from 'liquid-glass-react'

interface NavItem { to: string; label: string; icon: (props: { size?: number }) => ReactNode; match: string[] }

/** The main sections, in the same order on the phone tab bar and the desktop sidebar (Profile follows). */
const NAV: NavItem[] = [
  { to: '/', label: 'Learn', icon: LearnIcon, match: ['/', '/learn'] },
  { to: '/leaderboard', label: 'Leaderboard', icon: LeagueIcon, match: ['/leaderboard'] },
  { to: '/practice', label: 'Practice', icon: PracticeIcon, match: ['/practice', '/puzzle', '/playground', '/daily', '/duels', '/bosses'] },
  { to: '/rewards', label: 'Rewards', icon: RewardsIcon, match: ['/rewards', '/shop', '/quests'] },
]

const PROFILE_MATCH = ['/profile', '/settings', '/stats']

const MORE: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/quests', label: 'Quests and badges', icon: Target },
  { to: '/shop', label: 'Shop', icon: Store },
  { to: '/duels', label: 'Duels', icon: Swords },
  { to: '/daily', label: 'Daily challenge', icon: CalendarCheck },
  { to: '/bosses', label: 'Boss battles', icon: Skull },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

const isActive = (match: string[], path: string): boolean =>
  match.some((m) => (m === '/' ? path === '/' : path === m || path.startsWith(`${m}/`)))

const navClass = (active: boolean) =>
  cx(
    'label press flex h-[52px] items-center gap-5 rounded-2xl border-2 px-3 text-[15px] transition-colors',
    active ? 'border-blue-line bg-blue-soft text-blue glow-blue' : 'border-transparent text-mute hover:bg-surface',
  )

export { Wordmark }

function useDismiss(open: boolean, close: () => void, popupRef?: RefObject<HTMLDivElement | null>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && !popupRef?.current?.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close, popupRef])
  return ref
}

/** Desktop only: the less-used pages. On phones they are reached from Practice, Rewards and Profile. */
function MoreMenu() {
  const { signOut, notify } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const popupRef = useRef<HTMLDivElement>(null)
  const ref = useDismiss(open, () => setOpen(false), popupRef)
  const active = MORE.some((item) => location.pathname.startsWith(item.to))
  useEffect(() => setOpen(false), [location.pathname])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" className={cx(navClass(active || open), 'w-full')}>
        <MoreIcon size={32} />More
      </button>
      {open && (
        <div ref={popupRef} role="menu" className="animate-pop absolute bottom-0 left-full z-50 ml-3 w-60 overflow-hidden rounded-2xl border-2 border-line bg-card py-2 shadow-xl">
          {MORE.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} role="menuitem" className={({ isActive: on }) => cx('label flex items-center gap-3 px-5 py-3 text-[13px]', on ? 'bg-blue-soft text-blue' : 'text-mute hover:bg-surface')}>
              <Icon size={18} strokeWidth={2.4} />{label}
            </NavLink>
          ))}
          <button role="menuitem" onClick={() => signOut().catch((err: unknown) => notify({ kind: 'error', title: 'Could not sign out', body: err instanceof Error ? err.message : undefined }))} className="label flex w-full items-center gap-3 border-t-2 border-line px-5 py-3 text-[13px] text-mute hover:bg-surface">
            <LogOut size={18} strokeWidth={2.4} />Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/** A small dot that marks a section with something waiting, such as an unclaimed chest. */
function Dot({ className }: { className?: string }) {
  return <span className={cx('absolute h-3 w-3 rounded-full border-2 border-card bg-bad', className)} aria-hidden="true" />
}

/** True when today's chest is unclaimed or a bonus chest is waiting to be opened. */
export function useRewardWaiting(): boolean {
  const { state } = useApp()
  return canClaimDaily(state, dayKey()) || state.chests.length > 0
}

function Sidebar() {
  const { state } = useApp()
  const { pathname } = useLocation()
  const waiting = useRewardWaiting()
  const profileOn = isActive(PROFILE_MATCH, pathname)
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-line px-4 lg:flex">
      <Link to="/" className="px-4 pb-6 pt-8" aria-label="CoQuest home"><Wordmark /></Link>
      <nav className="flex flex-1 flex-col gap-2" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, match }) => {
          const on = isActive(match, pathname)
          return (
            <Link key={to} to={to} aria-current={on ? 'page' : undefined} className={navClass(on)}>
              <span className="relative">
                <Icon size={32} />
                {to === '/rewards' && waiting && <Dot className="-right-1 -top-1" />}
              </span>
              {label}
            </Link>
          )
        })}
        <Link to="/profile" aria-current={profileOn ? 'page' : undefined} className={navClass(profileOn)}>
          <Avatar avatar={state.avatar} size={32} />Profile
        </Link>
        <div className="mt-auto pb-6"><MoreMenu /></div>
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
      <Link to="/rewards" className="tnum flex items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold hover:bg-surface" title={`${streak}-day streak`}>
        <FlameIcon size={26} muted={streak === 0} className={streak > 0 ? 'animate-bob' : undefined} />
        <CountUp value={streak} showDelta={false} className={streak > 0 ? 'text-flame' : 'text-faint'} />
      </Link>
      <Link to="/rewards#gems" className="tnum flex items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold text-blue hover:bg-surface" title="Gems">
        <GemIcon size={26} /><CountUp value={state.gems} />
      </Link>
      <Link to="/profile" className="tnum flex items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold text-gold-dark hover:bg-surface" title="Total XP">
        <BoltIcon size={26} /><CountUp value={state.xp} />
      </Link>
    </div>
  )
}

function RailCard({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="soft-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {link && <Link to={link.to} className="label text-[13px] text-blue hover:brightness-90">{link.label}</Link>}
      </div>
      {children}
    </section>
  )
}

/** Today's XP toward the daily goal, as a ring. */
export function DailyGoalCard({ className }: { className?: string }) {
  const { state } = useApp()
  const xp = state.days[dayKey()]?.xp ?? 0
  const met = xp >= state.dailyGoal
  return (
    <section className={cx('soft-card flex items-center gap-5 p-5', className)}>
      <Ring value={xp} max={state.dailyGoal} size={72} stroke={9} color={met ? 'var(--color-gold)' : 'var(--color-blue)'}>
        <BoltIcon size={26} />
      </Ring>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-ink">Daily goal</h2>
        <p className="text-[15px] text-mute"><CountUp value={xp} showDelta={false} className="font-bold text-body" /> / {state.dailyGoal} XP{met ? ' · done!' : ''}</p>
      </div>
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

      <DailyGoalCard />

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
        <RailCard title="Saved on this device">
          <p className="text-[15px] leading-relaxed text-mute">Your progress is saved in this browser. Once CoQuest's cloud database is connected, it syncs to your account on every device.</p>
        </RailCard>
      )}
    </aside>
  )
}

function TabBar() {
  const { state } = useApp()
  const { pathname } = useLocation()
  const waiting = useRewardWaiting()
  const items: NavItem[] = [...NAV, { to: '/profile', label: 'Profile', icon: ({ size }) => <Avatar avatar={state.avatar} size={size ?? 24} />, match: PROFILE_MATCH }]
  // The glass library adds its border and shading layers next to (not inside) its element, so the
  // whole thing sits in a wrapper that hides on desktop, where the sidebar takes over.
  return (
    <div className="lg:hidden">
    <LiquidGlass
      className="z-40 w-fit px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-auto"
      displacementScale={24}
      blurAmount={0.12}
      saturation={145}
      aberrationIntensity={1}
      elasticity={0}
      cornerRadius={28}
      padding="6px"
      style={{ position: 'fixed', left: '50%', top: 'calc(100% - 58px)', bottom: 'auto', maxWidth: '100%' }}
    >
      <nav className="mobile-glass-nav relative flex w-[min(calc(100vw-1.5rem),28rem)] items-stretch gap-1 rounded-[24px] border-2 border-line/70 bg-card/80 p-1.5 shadow-[0_12px_32px_-12px_rgb(23_58_130/0.45)] backdrop-blur-xl" aria-label="Main">
        {items.map(({ to, label, icon: Icon, match }) => {
          const on = isActive(match, pathname)
          return (
            <Link key={to} to={to} aria-label={label} aria-current={on ? 'page' : undefined} className={cx('relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] py-2 text-[10px] font-bold leading-none transition-colors duration-200', on ? 'text-blue' : 'text-mute hover:bg-surface')}>
              {on && <span className="animate-pop absolute inset-0 rounded-[18px] bg-blue-soft" aria-hidden="true" />}
              <span key={on ? 'on' : 'off'} className={cx('relative', on ? 'animate-spring' : 'opacity-75')}>
                <Icon size={24} />
                {to === '/rewards' && waiting && <Dot className="-right-1.5 -top-1" />}
              </span>
              <span className="relative max-w-full truncate">{label}</span>
              {on && <span className="absolute bottom-0.5 h-1 w-5 rounded-full bg-blue" aria-hidden="true" />}
            </Link>
          )
        })}
      </nav>
    </LiquidGlass>
    </div>
  )
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  // Keep the latest callback in a ref so re-renders do not restart the timer.
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const timer = setTimeout(() => done.current(), 5500)
    return () => clearTimeout(timer)
  }, [toast.id])
  const tone = toast.kind === 'error' ? 'border-bad' : toast.kind === 'achievement' ? 'border-gold glow-gold' : 'border-blue-line glow-blue'
  return (
    <div className={cx('animate-spring flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border-2 bg-card p-4', tone)} role="status">
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
    <div className="pointer-events-none fixed bottom-28 right-4 z-[60] flex flex-col gap-2 lg:bottom-4">
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
    if (result.leveledUp) notify({ kind: 'level', title: `Level ${result.leveledUp} reached`, body: 'A Rare chest is waiting in Rewards.' })
    result.achievements.forEach((id) => {
      const a = achievementById(id)
      if (a) notify({ kind: 'achievement', title: `Achievement unlocked: ${a.name}`, body: `${a.description} An Epic chest is waiting in Rewards.` })
    })
  }
}

/**
 * The web shell: navigation on the left, a 592px content column and, when `rail` is set, a 368px
 * column of cards on the right. Below `lg` it becomes the phone layout with a stat bar on top
 * and a floating tab bar at the bottom. Other pages use the full content width instead.
 */
export function Layout({ rail = false }: { rail?: boolean }) {
  const { syncError } = useApp()
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 justify-center gap-12 px-4 lg:px-6">
        <div className={cx('w-full min-w-0 pb-32 lg:pb-12', rail ? 'max-w-[592px]' : 'max-w-[1008px]')}>
          <StatBar className={cx('sticky top-0 z-30 -mx-4 border-b-2 border-line bg-card/90 px-4 py-2 backdrop-blur-md', rail ? 'xl:hidden' : '', 'lg:static lg:mx-0 lg:justify-end lg:gap-6 lg:border-b-0 lg:bg-transparent lg:px-0 lg:pt-6 lg:backdrop-blur-none')} />
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
