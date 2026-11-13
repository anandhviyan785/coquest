import { useEffect, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { LeagueIcon } from '../components/icons'
import { LinkButton, Tabs, cx } from '../components/ui'
import { COURSES, nextStep, stepPath } from '../content'
import { LEAGUES, leagueFromXp, liveStreak, nextLeague, totals } from '../lib/gamification'
import { fetchAllTimeBoard, fetchWeeklyBoard } from '../lib/repo'
import type { BoardRow } from '../lib/repo'
import { useApp } from '../state/AppContext'

type Tab = 'weekly' | 'all'

/** Leaderboards open once a learner has finished this many lessons, as in the kit. */
const LESSONS_TO_UNLOCK = 3

function Shields({ current }: { current?: string }) {
  return (
    <div className="flex items-end justify-center gap-1">
      {LEAGUES.map((l) => {
        const active = l.id === current
        return <LeagueIcon key={l.id} size={active ? 84 : 44} color={current === undefined || active ? l.color : 'var(--color-line)'} />
      })}
    </div>
  )
}

function LockedBoard({ remaining, startPath }: { remaining: number; startPath: string }) {
  return (
    <div className="pt-4 text-center">
      <div className="flex items-end justify-center">
        <LeagueIcon size={88} color="#D9A57C" className="-mr-5 -rotate-12" />
        <LeagueIcon size={112} color="#FFC800" className="relative z-10" />
        <LeagueIcon size={88} color="#C9D6E4" className="-ml-5 rotate-12" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-ink">Unlock Leaderboards!</h1>
      <p className="mx-auto mt-3 max-w-xs text-[17px] text-mute">Complete {remaining} more lesson{remaining === 1 ? '' : 's'} to start competing</p>
      <LinkButton to={startPath} variant="secondary" size="lg" className="mt-5 w-full max-w-[280px]">Start a lesson</LinkButton>
      <ul className="mx-auto mt-10 max-w-md space-y-7" aria-hidden="true">
        {[56, 90, 46, 122, 68, 144].map((width, i) => (
          <li key={i} className="flex items-center gap-5 px-4">
            <span className="h-4 w-4 rounded-full bg-line" />
            <span className="h-[52px] w-[52px] rounded-full bg-line" />
            <span className="h-3.5 rounded-full bg-line" style={{ width }} />
            <span className="ml-auto h-3.5 w-[52px] rounded-full bg-line" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Leaderboard() {
  const { state, weeklyXp, cloud, userId } = useApp()
  const league = leagueFromXp(state.xp)
  const upcoming = nextLeague(state.xp)
  const lessons = totals(state).lessons
  const [tab, setTab] = useState<Tab>('weekly')
  const [rows, setRows] = useState<BoardRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const unlocked = lessons >= LESSONS_TO_UNLOCK

  useEffect(() => {
    if (!cloud || !unlocked) return
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
  }, [cloud, unlocked, tab, league.id])

  if (!unlocked) {
    const course = COURSES.find((c) => nextStep(c, state.lessons)) ?? COURSES[0]
    const next = nextStep(course, state.lessons)
    return <LockedBoard remaining={LESSONS_TO_UNLOCK - lessons} startPath={next ? stepPath(next) : '/'} />
  }

  // On a local profile the only real player is you, so that is all the board shows.
  const myId = userId ?? 'local'
  const self: BoardRow = { id: myId, username: state.username, avatar: state.avatar, xp: state.xp, weekly_xp: weeklyXp, streak: liveStreak(state), league: league.id }
  const shown = cloud ? rows : [self]

  return (
    <div>
      <div className="pt-2 text-center">
        <Shields current={league.id} />
        <h1 className="mt-4 text-2xl font-bold text-ink">{league.name} League</h1>
        <p className="mt-1 text-[17px] text-mute">
          {upcoming ? <>Earn <span className="tnum font-bold text-body">{(upcoming.minXp - state.xp).toLocaleString()} XP</span> to reach {upcoming.name}</> : 'You are in the top league'}
        </p>
      </div>

      <Tabs tabs={[{ id: 'weekly', label: 'This week' }, { id: 'all', label: 'All time' }]} value={tab} onChange={setTab} className="mt-6" />

      {error ? (
        <p className="py-8 text-center text-[15px] font-bold text-bad-dark" role="alert">{error}</p>
      ) : shown === null ? (
        <p className="py-8 text-center text-[15px] text-mute">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-mute">Nobody in this league has earned XP this week yet. Finish a lesson to take first place.</p>
      ) : (
        <ol className="py-2">
          {shown.map((row, i) => {
            const mine = row.id === myId
            const value = tab === 'weekly' ? row.weekly_xp : row.xp
            return (
              <li key={row.id} className={cx('flex items-center gap-5 rounded-xl px-4 py-3', mine && 'bg-blue-soft')}>
                <span className={cx('tnum w-6 text-center text-[17px] font-bold', i === 0 ? 'text-gold-dark' : i === 1 ? 'text-faint' : i === 2 ? 'text-[#C98A5A]' : 'text-blue')}>{i + 1}</span>
                <Avatar avatar={row.avatar} size={52} />
                <span className="min-w-0 flex-1 truncate text-[17px] font-bold text-body">{row.username}</span>
                <span className="tnum text-[17px] text-mute">{value.toLocaleString()} XP</span>
              </li>
            )
          })}
        </ol>
      )}

      {!cloud && (
        <p className="mt-2 rounded-2xl border-2 border-line p-5 text-[15px] leading-relaxed text-mute">
          You are on a local profile, so this board only has you on it. Connect a Supabase project (see the README) and everyone who signs up competes here.
        </p>
      )}
    </div>
  )
}
