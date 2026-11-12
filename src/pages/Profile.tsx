import { CalendarCheck, Check, Flame, Gift, GraduationCap, Lock, Skull, Swords, Trophy, Upload, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { AVATAR_EXPRESSIONS, Avatar, fileToAvatar } from '../components/Avatar'
import { MascotAvatar } from '../components/Mascot'
import { Bar, Button, Modal, PageHeader, Panel, PanelTitle, Stat, cx } from '../components/ui'
import { COURSES, courseProgress } from '../content'
import { ACHIEVEMENTS } from '../lib/achievements'
import { STREAK_REWARDS, leagueFromXp, levelProgress, liveStreak, totals } from '../lib/gamification'
import type { HistoryKind } from '../lib/types'
import { useApp } from '../state/AppContext'

const HISTORY_ICON: Record<HistoryKind, LucideIcon> = { lesson: GraduationCap, boss: Skull, daily: CalendarCheck, duel: Swords, reward: Gift }

const when = (iso: string): string => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function Profile() {
  const { state, patch, notify, cloud } = useApp()
  const [picking, setPicking] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const { level, into, span } = levelProgress(state.xp)
  const league = leagueFromXp(state.xp)
  const streak = liveStreak(state)
  const sum = totals(state)
  const finished = COURSES.filter((c) => courseProgress(c, state.lessons).pct === 100)
  const started = COURSES.filter((c) => { const p = courseProgress(c, state.lessons); return p.completed > 0 && p.pct < 100 })
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length

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
    <div className="space-y-5">
      <PageHeader title="Profile" />

      <Panel className="overflow-hidden">
        <div className="grad-premium h-20" />
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6">
          <button onClick={() => setPicking(true)} className="group relative -mt-10 rounded-full ring-4 ring-card" aria-label="Change profile picture">
            <Avatar avatar={state.avatar} size={96} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Change</span>
          </button>
          <div className="min-w-0 flex-1 pt-3">
            <h2 className="truncate text-2xl font-semibold tracking-tight">{state.username}</h2>
            <p className="text-sm text-mute">Exploring since {new Date(state.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}{!cloud && ' · local profile'}</p>
          </div>
          <div className="w-full max-w-xs pt-3">
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">Level {level}</span><span className="tnum text-mute">{into} / {span} XP</span></div>
            <Bar value={into} max={span} color="linear-gradient(90deg, #2563EB, #06B6D4)" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-line p-6 sm:grid-cols-4">
          <Stat label="Total XP" value={state.xp.toLocaleString()} icon={<Zap size={13} className="text-gold" fill="currentColor" />} />
          <Stat label="Streak" value={`${streak} day${streak === 1 ? '' : 's'}`} hint={`Longest: ${state.longestStreak}`} icon={<Flame size={13} className="text-flame" />} />
          <Stat label="League" value={<span className="flex items-center gap-2"><span className="h-3 w-3 rotate-45 rounded-[3px]" style={{ background: league.color }} />{league.name}</span>} />
          <Stat label="Achievements" value={`${unlocked} / ${ACHIEVEMENTS.length}`} icon={<Trophy size={13} className="text-gold" />} />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-6">
          <PanelTitle>Achievements</PanelTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const earnedAt = state.achievements[a.id]
              const [current, target] = a.progress(state)
              return (
                <li key={a.id} className={cx('flex gap-3 rounded-xl border p-3.5', earnedAt ? 'border-gold/30 bg-gold/[0.05]' : 'border-line')}>
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', earnedAt ? 'bg-gold/15 text-gold' : 'bg-surface text-faint')}>{earnedAt ? <Trophy size={18} /> : <Lock size={16} />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{a.name}</p>
                    <p className="text-xs text-mute">{a.description}</p>
                    {earnedAt ? (
                      <p className="mt-1.5 text-[11px] text-gold">Unlocked {new Date(earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2"><Bar value={current} max={target} className="h-1.5 flex-1" color="var(--color-sky)" /><span className="tnum text-[11px] text-mute">{current.toLocaleString()}/{target.toLocaleString()}</span></div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <h3 className="mb-3 mt-7 text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">Streak milestones</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {STREAK_REWARDS.map((r) => {
              const claimed = state.streakRewards.includes(r.days)
              return (
                <li key={r.days} className={cx('rounded-xl border p-3.5', claimed ? 'border-flame/40 bg-flame/[0.06]' : 'border-line')}>
                  <p className="flex items-center gap-1.5 text-sm font-semibold"><Flame size={15} className={claimed ? 'text-flame' : 'text-faint'} fill={claimed ? 'currentColor' : 'none'} />{r.days} days{claimed && <Check size={14} className="ml-auto text-ok" strokeWidth={3} />}</p>
                  <p className="mt-1 text-xs text-mute">+{r.xp} XP · {r.freezes} streak freeze{r.freezes === 1 ? '' : 's'}</p>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-6">
            <PanelTitle>Coding statistics</PanelTitle>
            <dl className="space-y-2.5 text-sm">
              {([
                ['Lessons completed', sum.lessons],
                ['Bosses defeated', sum.bosses],
                ['Daily challenges solved', Object.keys(state.daily).length],
                ['Duels won', `${state.duels.won} of ${state.duels.played}`],
                ['Answer accuracy', sum.accuracy === null ? '—' : `${sum.accuracy}%`],
                ['Days active', sum.activeDays],
              ] as Array<[string, string | number]>).map(([label, value]) => (
                <div key={label} className="flex justify-between"><dt className="text-mute">{label}</dt><dd className="tnum font-semibold">{value}</dd></div>
              ))}
            </dl>
          </Panel>

          <Panel className="p-6">
            <PanelTitle>Courses</PanelTitle>
            {finished.length === 0 && started.length === 0 ? (
              <p className="text-sm text-mute">No courses started yet.</p>
            ) : (
              <ul className="space-y-3">
                {[...finished, ...started].map((c) => {
                  const p = courseProgress(c, state.lessons)
                  return (
                    <li key={c.id}>
                      <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{c.name}</span><span className={cx('tnum', p.pct === 100 ? 'font-semibold text-ok' : 'text-mute')}>{p.pct === 100 ? 'Completed' : `${p.pct}%`}</span></div>
                      <Bar value={p.completed} max={p.total} className="h-1.5" color={p.pct === 100 ? 'var(--color-ok)' : 'var(--color-cyan)'} />
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel className="p-6">
        <PanelTitle>Learning history</PanelTitle>
        {state.history.length === 0 ? (
          <p className="text-sm text-mute">Your completed lessons, battles and challenges will be listed here.</p>
        ) : (
          <ol className="divide-y divide-line">
            {state.history.slice(0, 15).map((item, i) => {
              const Icon = HISTORY_ICON[item.kind]
              return (
                <li key={`${item.at}-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-cyan"><Icon size={15} /></span>
                  <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                  <span className="hidden text-xs text-faint sm:block">{when(item.at)}</span>
                  <span className="tnum w-16 text-right font-semibold text-gold">+{item.xp} XP</span>
                </li>
              )
            })}
          </ol>
        )}
      </Panel>

      <Modal open={picking} onClose={() => setPicking(false)}>
        <h2 className="text-lg font-semibold">Profile picture</h2>
        <p className="mt-1 text-sm text-mute">Pick a QUEST, or upload your own image.</p>
        <div className="mt-5 grid grid-cols-6 gap-2">
          {AVATAR_EXPRESSIONS.map((expression) => (
            <button key={expression} onClick={() => { patch({ avatar: expression }); setPicking(false) }} aria-label={`${expression} QUEST`} className={cx('rounded-full p-0.5 ring-2 transition-shadow', state.avatar === expression ? 'ring-ice' : 'ring-transparent hover:ring-line')}>
              <MascotAvatar expression={expression} size={52} />
            </button>
          ))}
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={() => fileInput.current?.click()}><Upload size={15} />Upload image</Button>
          <Button variant="ghost" onClick={() => setPicking(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}
