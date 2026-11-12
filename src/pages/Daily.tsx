import { Check, Clock, Play, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRewardToasts } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Button, PageHeader, Panel, PanelTitle, Tag, cx } from '../components/ui'
import { Workbench } from '../components/Workbench'
import type { CheckSummary } from '../components/Workbench'
import { LANG_LABEL } from '../content'
import { challengeForDay } from '../content/challenges'
import { dayKey, formatClock, lastNDays, msUntilTomorrow, weekdayShort } from '../lib/dates'
import { XP } from '../lib/gamification'
import { fetchDailyBoard, submitDailyResult } from '../lib/repo'
import type { DailyRow } from '../lib/repo'
import { useApp } from '../state/AppContext'

const DIFFICULTY_COLOR = { Easy: '#22C55E', Medium: '#FBBF24', Hard: '#F97316' } as const

const useTick = (active: boolean): number => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [active])
  return now
}

export function Daily() {
  const { state, earn, cloud, userId, notify } = useApp()
  const reward = useRewardToasts()
  const today = dayKey()
  const challenge = challengeForDay(today)
  const done = state.daily[today]

  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [practising, setPractising] = useState(false)
  const [board, setBoard] = useState<DailyRow[]>([])
  const [boardError, setBoardError] = useState<string | null>(null)
  const attempts = useRef(0)
  const now = useTick(true)

  useEffect(() => {
    if (!cloud) return
    let cancelled = false
    fetchDailyBoard(today).then(
      (rows) => !cancelled && setBoard(rows),
      (err: unknown) => !cancelled && setBoardError(err instanceof Error ? err.message : 'Could not load the leaderboard'),
    )
    return () => {
      cancelled = true
    }
  }, [cloud, today, done])

  const onCheck = (check: CheckSummary) => {
    attempts.current += 1
    if (!check.passed || done || startedAt === null) return
    const ms = Date.now() - startedAt
    const result = earn(
      { xp: XP.daily[challenge.difficulty], kind: 'daily', title: `Daily: ${challenge.title}`, lang: challenge.lang, seconds: Math.min(ms / 1000, 3600), correct: 1, attempts: attempts.current },
      (s) => ({ ...s, daily: { ...s.daily, [today]: { ms } } }),
    )
    reward(result)
    if (cloud && userId) {
      submitDailyResult(userId, state.username, ms, today).catch((err: unknown) => notify({ kind: 'error', title: 'Could not post your time', body: err instanceof Error ? err.message : undefined }))
    }
  }

  const week = lastNDays(7, today)
  const solvedCount = Object.keys(state.daily).length
  const working = startedAt !== null && !done

  return (
    <div>
      <PageHeader title="Daily Challenge" subtitle="One problem a day, the same for everyone. Solve it for bonus XP." />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Panel className="p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <Tag color={DIFFICULTY_COLOR[challenge.difficulty]}>{challenge.difficulty}</Tag>
            <Tag color="var(--color-ice)">{LANG_LABEL[challenge.lang]}</Tag>
            <span className="tnum ml-auto flex items-center gap-1.5 text-sm font-semibold text-gold"><Zap size={15} fill="currentColor" />{XP.daily[challenge.difficulty]} XP</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{challenge.title}</h2>

          {done && !practising ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-ok/30 bg-ok/[0.06] p-8 text-center">
              <Mascot expression="happy" size={120} />
              <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-ok"><Check size={20} strokeWidth={3} />Solved in {formatClock(done.ms)}</p>
              <p className="mt-1 text-sm text-mute">A new challenge arrives in <span className="tnum font-semibold text-ink">{formatClock(msUntilTomorrow())}</span>.</p>
              <Button variant="secondary" className="mt-5" onClick={() => setPractising(true)}>Practise it again</Button>
            </div>
          ) : startedAt === null && !practising ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-line bg-surface p-8 text-center">
              <Mascot expression="determined" size={120} />
              <p className="mt-3 max-w-sm text-sm text-mute">The clock starts when you do. Your time is recorded when every test passes — hints are available, and there is no penalty for failed checks.</p>
              <Button size="lg" className="mt-5" onClick={() => setStartedAt(Date.now())}><Play size={16} fill="currentColor" />Start the clock</Button>
            </div>
          ) : (
            <div className="mt-5">
              {working && <p className="tnum mb-4 flex w-fit items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold"><Clock size={15} className="text-cyan" />{formatClock(now - (startedAt ?? now))}</p>}
              {practising && <p className="mb-4 text-sm text-mute">Practice mode — no XP or time is recorded.</p>}
              <Workbench lang={challenge.lang} exercise={challenge.exercise} onCheck={onCheck} />
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <PanelTitle>Next challenge</PanelTitle>
            <p className="tnum text-3xl font-semibold tracking-tight">{formatClock(msUntilTomorrow())}</p>
            <ol className="mt-5 flex justify-between border-t border-line pt-4">
              {week.map((key) => (
                <li key={key} className="flex flex-col items-center gap-1.5">
                  <span className={cx('flex h-7 w-7 items-center justify-center rounded-full border', state.daily[key] ? 'border-ok bg-ok/15 text-ok' : key === today ? 'border-sky' : 'border-line')}>{state.daily[key] && <Check size={14} strokeWidth={3} />}</span>
                  <span className={cx('text-[11px]', key === today ? 'font-semibold text-ink' : 'text-faint')}>{weekdayShort(key).slice(0, 2)}</span>
                </li>
              ))}
            </ol>
            <p className="tnum mt-4 text-xs text-mute">{solvedCount} daily challenge{solvedCount === 1 ? '' : 's'} solved in total</p>
          </Panel>

          <Panel className="p-5">
            <PanelTitle>Today&apos;s fastest</PanelTitle>
            {!cloud ? (
              <p className="text-sm leading-relaxed text-mute">The daily leaderboard ranks everyone&apos;s solve times. It needs a Supabase project — see the README to connect one.</p>
            ) : boardError ? (
              <p className="text-sm text-bad">{boardError}</p>
            ) : board.length === 0 ? (
              <p className="text-sm text-mute">Nobody has solved today&apos;s challenge yet. Be the first.</p>
            ) : (
              <ol className="space-y-2">
                {board.map((row, i) => (
                  <li key={row.user_id} className={cx('flex items-center gap-3 text-sm', row.user_id === userId && 'font-semibold text-ice')}>
                    <span className="tnum w-5 text-right text-mute">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{row.username}</span>
                    <span className="tnum">{formatClock(row.ms)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
