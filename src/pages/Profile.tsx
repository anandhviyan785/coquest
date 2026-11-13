import { CalendarCheck, Check, Gift, GraduationCap, Lock, Pencil, Skull, Swords, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AVATAR_EXPRESSIONS, Avatar, fileToAvatar } from '../components/Avatar'
import { BoltIcon, FlameIcon, LeagueIcon, MedalIcon } from '../components/icons'
import { MascotAvatar } from '../components/Mascot'
import { Bar, Button, Modal, cx } from '../components/ui'
import { COURSES, courseProgress } from '../content'
import { ACHIEVEMENTS } from '../lib/achievements'
import { leagueFromXp, levelProgress, liveStreak, totals } from '../lib/gamification'
import type { HistoryKind } from '../lib/types'
import { useApp } from '../state/AppContext'

const HISTORY_ICON: Record<HistoryKind, LucideIcon> = { lesson: GraduationCap, boss: Skull, daily: CalendarCheck, duel: Swords, reward: Gift }
const BADGE_COLORS = ['#FF4B4B', '#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#00CD9C', '#FFC800']

const when = (iso: string): string => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

function Tile({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-line px-5 py-4">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="tnum truncate text-xl font-bold leading-tight text-body">{value}</p>
        <p className="text-[15px] text-faint">{label}</p>
      </div>
    </div>
  )
}

export function Profile() {
  const { state, patch, notify, cloud } = useApp()
  const [picking, setPicking] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const { level } = levelProgress(state.xp)
  const league = leagueFromXp(state.xp)
  const streak = liveStreak(state)
  const sum = totals(state)
  const courses = COURSES.map((c) => ({ course: c, progress: courseProgress(c, state.lessons) })).filter((c) => c.progress.completed > 0)
  // Earned first, then the ones closest to being earned.
  const achievements = [...ACHIEVEMENTS].sort((a, b) => {
    const ratio = (x: typeof a) => (state.achievements[x.id] ? 2 : x.progress(state)[0] / x.progress(state)[1])
    return ratio(b) - ratio(a)
  })

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      patch({ avatar: await fileToAvatar(file) })
      setPicking(false)
    } catch (err) {
      notify({ kind: 'error', title: 'Could not use that picture', body: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div>
      <div className="relative flex h-[228px] items-end justify-center overflow-hidden rounded-2xl bg-blue-soft">
        <button onClick={() => setPicking(true)} aria-label="Change profile picture" className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-b-4 border-line bg-card text-body hover:bg-surface active:translate-y-0.5 active:border-b-2">
          <Pencil size={20} strokeWidth={2.6} />
        </button>
        <button onClick={() => setPicking(true)} aria-label="Change profile picture" className="translate-y-6 rounded-full outline-dashed outline-[3px] outline-offset-4 outline-blue">
          <Avatar avatar={state.avatar} size={176} />
        </button>
      </div>

      <div className="border-b-2 border-line pb-6 pt-6">
        <h1 className="truncate text-[26px] font-bold leading-tight text-ink">{state.username}</h1>
        <p className="text-[15px] text-faint">Level {level}{!cloud && ' · local profile'}</p>
        <p className="mt-2 text-[17px] text-body">Joined {new Date(state.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        {courses.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {courses.map(({ course, progress }) => (
              <Link key={course.id} to={`/learn/${course.id}`} className="tnum text-[15px] font-bold text-blue hover:brightness-90">{course.name} {progress.pct}%</Link>
            ))}
          </p>
        )}
      </div>

      <h2 className="mb-4 mt-7 text-2xl font-bold text-ink">Statistics</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile icon={<FlameIcon size={28} muted={streak === 0} />} value={streak} label="Day streak" />
        <Tile icon={<BoltIcon size={28} />} value={state.xp.toLocaleString()} label="Total XP" />
        <Tile icon={<LeagueIcon size={28} color={league.color} />} value={league.name} label="Current league" />
        <Tile icon={<MedalIcon size={28} />} value={sum.lessons} label="Lessons completed" />
      </div>

      <div className="mb-4 mt-9 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink">Achievements</h2>
        <Link to="/quests" className="label text-[13px] text-blue hover:brightness-90">View all</Link>
      </div>
      <ul className="overflow-hidden rounded-2xl border-2 border-line">
        {achievements.slice(0, 3).map((a) => {
          const [current, target] = a.progress(state)
          const earned = Boolean(state.achievements[a.id])
          const color = BADGE_COLORS[ACHIEVEMENTS.indexOf(a) % BADGE_COLORS.length]
          return (
            <li key={a.id} className="flex items-center gap-5 border-b-2 border-line p-5 last:border-b-0">
              <span className="flex h-[88px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-b-4 border-black/15 text-white" style={{ background: earned ? color : '#E5E5E5' }}>
                {earned ? <Check size={30} strokeWidth={4} /> : <Lock size={24} strokeWidth={3} className="text-faint" />}
                <span className={cx('label text-[10px]', !earned && 'text-faint')}>{earned ? 'Earned' : 'Locked'}</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[17px] font-bold text-body">{a.name}</p>
                  <span className="tnum text-[15px] text-faint">{current.toLocaleString()}/{target.toLocaleString()}</span>
                </div>
                <Bar value={current} max={target} className="my-2" />
                <p className="text-[15px] text-mute">{a.description}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mb-4 mt-9 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink">Learning history</h2>
        <Link to="/stats" className="label text-[13px] text-blue hover:brightness-90">Statistics</Link>
      </div>
      {state.history.length === 0 ? (
        <p className="rounded-2xl border-2 border-line p-5 text-[15px] text-mute">Your completed lessons, battles and challenges will be listed here.</p>
      ) : (
        <ol className="overflow-hidden rounded-2xl border-2 border-line">
          {state.history.slice(0, 10).map((item, i) => {
            const Icon = HISTORY_ICON[item.kind]
            return (
              <li key={`${item.at}-${i}`} className="flex items-center gap-4 border-b-2 border-line px-5 py-3.5 last:border-b-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue"><Icon size={20} strokeWidth={2.4} /></span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-body">{item.title}</span>
                <span className="hidden text-[13px] text-faint sm:block">{when(item.at)}</span>
                {item.xp > 0 && <span className="tnum w-16 text-right text-[15px] font-bold text-gold-dark">+{item.xp} XP</span>}
              </li>
            )
          })}
        </ol>
      )}

      <Modal open={picking} onClose={() => setPicking(false)}>
        <h2 className="text-xl font-bold text-ink">Profile picture</h2>
        <p className="mt-1 text-[15px] text-mute">Pick a QUEST, or upload your own image.</p>
        <div className="mt-5 grid grid-cols-6 gap-2">
          {AVATAR_EXPRESSIONS.map((expression) => (
            <button key={expression} onClick={() => { patch({ avatar: expression }); setPicking(false) }} aria-label={`${expression} QUEST`} className={cx('rounded-full p-0.5 ring-[3px] transition-shadow', state.avatar === expression ? 'ring-blue' : 'ring-transparent hover:ring-line')}>
              <MascotAvatar expression={expression} size={52} />
            </button>
          ))}
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={() => fileInput.current?.click()}><Upload size={16} strokeWidth={3} />Upload image</Button>
          <Button variant="ghost" onClick={() => setPicking(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}
