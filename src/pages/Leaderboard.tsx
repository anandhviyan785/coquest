import { Flame, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Mascot } from '../components/Mascot'
import { Bar, PageHeader, Panel, PanelTitle, cx } from '../components/ui'
import { LEAGUES, leagueFromXp, liveStreak, nextLeague } from '../lib/gamification'
import { fetchAllTimeBoard, fetchWeeklyBoard } from '../lib/repo'
import type { BoardRow } from '../lib/repo'
import { useApp } from '../state/AppContext'

type Tab = 'weekly' | 'all'

export function Leaderboard() {
  const { state, weeklyXp, cloud, userId } = useApp()
  const league = leagueFromXp(state.xp)
  const upcoming = nextLeague(state.xp)
  const [tab, setTab] = useState<Tab>('weekly')
  const [rows, setRows] = useState<BoardRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cloud) return
    let cancelled = false
    setRows(null)
    setError(null)
    const load = tab === 'weekly' ? fetchWeeklyBoard(league.id) : fetchAllTimeBoard()
    load.then(
      (data) => !cancelled && setRows(data),
      (err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the leaderboard'),
    )
    return () => {
      cancelled = true
    }
  }, [cloud, tab, league.id])

  // In local mode the only real player is you, so that is all the board shows.
  const self: BoardRow = { id: userId ?? 'local', username: state.username, avatar: state.avatar, xp: state.xp, weekly_xp: weeklyXp, streak: liveStreak(state), league: league.id }
  const shown = cloud ? rows : [self]
  const myId = userId ?? 'local'

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Earn XP to climb your league. Weekly boards reset every Monday." />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex gap-1 rounded-lg bg-surface p-1" role="tablist">
              {([['weekly', `${league.name} league · this week`], ['all', 'All time']] as Array<[Tab, string]>).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx('h-8 rounded-md px-3 text-[13px] font-semibold transition-colors', tab === id ? 'bg-raised text-ink' : 'text-mute hover:text-ink')}>{label}</button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="p-6 text-sm text-bad" role="alert">{error}</p>
          ) : shown === null ? (
            <p className="p-6 text-sm text-mute">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="p-6 text-sm text-mute">Nobody in this league has earned XP this week yet. Finish a lesson to take first place.</p>
          ) : (
            <ol>
              {shown.map((row, i) => {
                const mine = row.id === myId
                const value = tab === 'weekly' ? row.weekly_xp : row.xp
                return (
                  <li key={row.id} className={cx('flex items-center gap-4 border-b border-line px-5 py-3 last:border-b-0', mine && 'bg-blue/10')}>
                    <span className={cx('tnum w-7 text-center text-sm font-bold', i === 0 ? 'text-gold' : i === 1 ? 'text-[#B6C2D2]' : i === 2 ? 'text-[#C98A5A]' : 'text-mute')}>{i + 1}</span>
                    <Avatar avatar={row.avatar} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{row.username}{mine && <span className="ml-2 text-xs font-normal text-ice">you</span>}</span>
                      <span className="tnum flex items-center gap-1 text-xs text-mute"><Flame size={12} className={row.streak > 0 ? 'text-flame' : ''} />{row.streak}-day streak</span>
                    </span>
                    <span className="tnum flex items-center gap-1 text-sm font-semibold"><Zap size={14} className="text-gold" fill="currentColor" />{value.toLocaleString()}</span>
                  </li>
                )
              })}
            </ol>
          )}

          {!cloud && (
            <div className="flex items-center gap-4 border-t border-line bg-surface p-5">
              <Mascot expression="thinking" size={64} className="shrink-0" />
              <p className="text-sm leading-relaxed text-mute">You are playing on a local profile, so this board only has you on it. Connect a Supabase project (see the README) and everyone who signs up competes here for real.</p>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <PanelTitle>Leagues</PanelTitle>
          <ol className="space-y-1">
            {[...LEAGUES].reverse().map((l) => {
              const current = l.id === league.id
              const reached = state.xp >= l.minXp
              return (
                <li key={l.id} className={cx('flex items-center gap-3 rounded-lg px-3 py-2', current && 'bg-raised')}>
                  <span className="h-3 w-3 rotate-45 rounded-[3px]" style={{ background: reached ? l.color : 'var(--color-line)' }} />
                  <span className={cx('flex-1 text-sm font-semibold', !reached && 'text-mute')}>{l.name}</span>
                  <span className="tnum text-xs text-mute">{l.minXp.toLocaleString()} XP</span>
                </li>
              )
            })}
          </ol>
          {upcoming && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="tnum mb-2 text-xs text-mute">{(upcoming.minXp - state.xp).toLocaleString()} XP to {upcoming.name}</p>
              <Bar value={state.xp - league.minXp} max={upcoming.minXp - league.minXp} className="h-1.5" color={upcoming.color} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
