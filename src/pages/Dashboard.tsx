import { ArrowRight, CalendarCheck, Check, Flame, Snowflake, Target, Trophy, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar as RBar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Mascot } from '../components/Mascot'
import { Bar, LinkButton, Panel, PanelTitle, Ring, Tag } from '../components/ui'
import { COURSES, LANG_LABEL, courseProgress, findBoss, findLesson, nextStep, stepPath, stepTitle } from '../content'
import { challengeForDay } from '../content/challenges'
import { ACHIEVEMENTS, achievementById } from '../lib/achievements'
import { dayKey, daysBetween, formatClock, lastNDays, msUntilTomorrow, weekdayShort } from '../lib/dates'
import { frozenDays, leagueFromXp, levelProgress, liveStreak, nextLeague, totals } from '../lib/gamification'
import { fetchWeeklyBoard } from '../lib/repo'
import type { Course, Expression, UserState } from '../lib/types'
import { useApp } from '../state/AppContext'

const greeting = (): string => {
  const h = new Date().getHours()
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/** QUEST's mood and line, based on what the learner has actually done. */
const mood = (s: UserState, todayXp: number, streak: number): { expression: Expression; line: string } => {
  const today = dayKey()
  if (!s.lastActive) return { expression: 'curious', line: 'I found the start of the trail. Shall we take the first step?' }
  const away = daysBetween(s.lastActive, today)
  if (away >= 3) return { expression: 'sleeping', line: `I dozed off waiting… it has been ${away} days. Wake me with a lesson?` }
  if (todayXp >= s.dailyGoal) return { expression: 'happy', line: 'Daily goal smashed. Anything more today is pure bonus.' }
  if (todayXp > 0) return { expression: 'determined', line: `${s.dailyGoal - todayXp} XP to today's goal. We are close.` }
  if (streak > 0) return { expression: 'determined', line: `Your ${streak}-day streak is waiting on today's lesson.` }
  return { expression: 'curious', line: 'A fresh streak starts with one lesson. Ready?' }
}

/** The course the learner touched most recently, or Python for a brand-new learner. */
const activeCourse = (s: UserState): Course => {
  const latest = Object.entries(s.lessons).sort((a, b) => b[1].at.localeCompare(a[1].at))[0]?.[0]
  const ref = latest ? (latest.startsWith('boss:') ? findBoss(latest) : findLesson(latest)) : undefined
  const current = ref?.course ?? COURSES[0]
  return nextStep(current, s.lessons) ? current : COURSES.find((c) => nextStep(c, s.lessons)) ?? current
}

function Countdown() {
  const [ms, setMs] = useState(msUntilTomorrow())
  useEffect(() => {
    const timer = setInterval(() => setMs(msUntilTomorrow()), 1000)
    return () => clearInterval(timer)
  }, [])
  return <span className="tnum">{formatClock(ms)}</span>
}

export function Dashboard() {
  const { state, weeklyXp, cloud, userId } = useApp()
  const today = dayKey()
  const todayXp = state.days[today]?.xp ?? 0
  const streak = liveStreak(state)
  const { level, into, span, toNext } = levelProgress(state.xp)
  const league = leagueFromXp(state.xp)
  const upcoming = nextLeague(state.xp)
  const sum = totals(state)
  const { expression, line } = mood(state, todayXp, streak)

  const course = activeCourse(state)
  const progress = courseProgress(course, state.lessons)
  const next = nextStep(course, state.lessons)

  const week = useMemo(() => lastNDays(7, today).map((key) => ({ key, day: weekdayShort(key), xp: state.days[key]?.xp ?? 0 })), [state.days, today])
  const frozen = frozenDays(state)
  const daily = challengeForDay(today)
  const dailyDone = Boolean(state.daily[today])

  const [rank, setRank] = useState<number | null>(null)
  useEffect(() => {
    if (!cloud || !userId) return
    let cancelled = false
    fetchWeeklyBoard(league.id).then(
      (rows) => {
        if (cancelled) return
        const at = rows.findIndex((r) => r.id === userId)
        setRank(at >= 0 ? at + 1 : null)
      },
      (err) => console.error('Could not load leaderboard position', err),
    )
    return () => {
      cancelled = true
    }
  }, [cloud, userId, league.id, state.xp])

  const earned = Object.entries(state.achievements).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 3)
  const closest = ACHIEVEMENTS.filter((a) => !state.achievements[a.id])
    .map((a) => ({ a, ratio: a.progress(state)[0] / a.progress(state)[1] }))
    .sort((x, y) => y.ratio - x.ratio)[0]

  return (
    <div className="space-y-5">
      {/* Welcome + continue learning */}
      <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-start gap-2 p-6 pb-0 sm:p-7 sm:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-mute">{greeting()},</p>
              <h1 className="mt-0.5 truncate text-[28px] font-semibold tracking-tight">{state.username}</h1>
              <p className="mt-3 max-w-sm rounded-2xl rounded-bl-sm border border-line bg-raised px-4 py-2.5 text-sm leading-relaxed text-[#d5deeb]">{line}</p>
            </div>
            <Mascot expression={expression} size={132} float={expression !== 'sleeping'} className="-mt-1 shrink-0" />
          </div>

          <div className="m-4 mt-5 rounded-xl border border-line bg-surface p-5 sm:m-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan">{next ? 'Continue learning' : 'Course complete'}</p>
                <p className="mt-1 truncate text-lg font-semibold">{next ? stepTitle(next) : `${course.name} finished`}</p>
                <p className="text-sm text-mute">{LANG_LABEL[course.id]} · {progress.completed} of {progress.total} steps</p>
              </div>
              {next ? (
                <LinkButton to={stepPath(next)} size="lg">{progress.completed === 0 ? 'Start' : 'Continue'}<ArrowRight size={17} /></LinkButton>
              ) : (
                <LinkButton to="/learn" size="lg" variant="secondary">Pick another course<ArrowRight size={17} /></LinkButton>
              )}
            </div>
            <Bar value={progress.completed} max={progress.total} className="mt-4" color="linear-gradient(90deg, #2563EB, #06B6D4)" />
          </div>
        </div>

        {/* Daily goal + streak */}
        <Panel className="flex flex-col p-6">
          <PanelTitle>Today</PanelTitle>
          <div className="flex items-center gap-5">
            <Ring value={todayXp} max={state.dailyGoal} size={104} stroke={9} color={todayXp >= state.dailyGoal ? 'var(--color-ok)' : 'var(--color-cyan)'}>
              {todayXp >= state.dailyGoal ? <Check size={30} className="text-ok" strokeWidth={3} /> : <Target size={26} className="text-cyan" />}
            </Ring>
            <div>
              <p className="tnum text-3xl font-semibold tracking-tight">{todayXp}<span className="text-base font-medium text-mute"> / {state.dailyGoal} XP</span></p>
              <p className="mt-1 text-sm text-mute">{todayXp >= state.dailyGoal ? 'Daily goal reached' : 'Daily goal'}</p>
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-semibold"><Flame size={17} className={streak > 0 ? 'text-flame' : 'text-faint'} fill={streak > 0 ? 'currentColor' : 'none'} />{streak}-day streak</span>
              <span className="flex items-center gap-1 text-xs text-mute" title="A streak freeze protects your streak for one missed day"><Snowflake size={13} className="text-ice" />{state.freezes} freeze{state.freezes === 1 ? '' : 's'}</span>
            </div>
            <ol className="flex justify-between">
              {week.map((d) => {
                const active = d.xp > 0
                const isFrozen = frozen.includes(d.key)
                return (
                  <li key={d.key} className="flex flex-col items-center gap-1.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${active ? 'border-flame bg-flame/15 text-flame' : isFrozen ? 'border-ice/50 bg-ice/10 text-ice' : d.key === today ? 'border-sky text-mute' : 'border-line text-faint'}`}>
                      {active ? <Flame size={14} fill="currentColor" /> : isFrozen ? <Snowflake size={13} /> : null}
                    </span>
                    <span className={`text-[11px] ${d.key === today ? 'font-semibold text-ink' : 'text-faint'}`}>{d.day.slice(0, 2)}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        </Panel>
      </section>

      {/* Standing */}
      <Panel className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <div className="p-5">
          <p className="flex items-center gap-1.5 text-xs text-mute"><Zap size={13} className="text-gold" fill="currentColor" />Total XP</p>
          <p className="tnum mt-1 text-2xl font-semibold tracking-tight">{state.xp.toLocaleString()}</p>
          <p className="tnum mt-0.5 text-xs text-faint">{weeklyXp.toLocaleString()} this week</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-mute">Level</p>
          <p className="tnum mt-1 text-2xl font-semibold tracking-tight">{level}</p>
          <Bar value={into} max={span} className="mt-2 h-1.5" color="var(--color-cyan)" />
          <p className="tnum mt-1.5 text-xs text-faint">{toNext} XP to level {level + 1}</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-mute">League</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight"><span className="h-3 w-3 rotate-45 rounded-[3px]" style={{ background: league.color }} />{league.name}</p>
          <p className="tnum mt-0.5 text-xs text-faint">{upcoming ? `${(upcoming.minXp - state.xp).toLocaleString()} XP to ${upcoming.name}` : 'Top league reached'}</p>
        </div>
        <Link to="/leaderboard" className="group p-5 transition-colors hover:bg-raised/40">
          <p className="flex items-center gap-1.5 text-xs text-mute"><Trophy size={13} />Leaderboard</p>
          <p className="tnum mt-1 text-2xl font-semibold tracking-tight">{cloud ? (rank ? `#${rank}` : 'Unranked') : '—'}</p>
          <p className="mt-0.5 text-xs text-faint group-hover:text-mute">{cloud ? (rank ? `in ${league.name} this week` : 'Earn XP this week to place') : 'Connect Supabase to compete'}</p>
        </Link>
      </Panel>

      <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        {/* Weekly progress */}
        <Panel className="p-6">
          <PanelTitle action={<Link to="/stats" className="text-xs font-medium text-ice hover:underline">All statistics</Link>}>Weekly progress</PanelTitle>
          {week.some((d) => d.xp > 0) ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} contentStyle={{ background: '#1B2942', border: '1px solid #233354', borderRadius: 10, fontSize: 13 }} labelStyle={{ color: '#94A3B8' }} formatter={(value) => [`${value} XP`, 'Earned']} />
                  <ReferenceLine y={state.dailyGoal} stroke="#67E8F9" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <RBar dataKey="xp" radius={[6, 6, 2, 2]} maxBarSize={38}>
                    {week.map((d) => <Cell key={d.key} fill={d.xp >= state.dailyGoal ? '#06B6D4' : '#2563EB'} />)}
                  </RBar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-mute">Your XP for each day of the week will chart here once you finish a lesson.</p>
          )}
          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
            <div><dt className="text-xs text-mute">Lessons done</dt><dd className="tnum mt-0.5 font-semibold">{sum.lessons}</dd></div>
            <div><dt className="text-xs text-mute">Accuracy</dt><dd className="tnum mt-0.5 font-semibold">{sum.accuracy === null ? '—' : `${sum.accuracy}%`}</dd></div>
            <div><dt className="text-xs text-mute">Time learning</dt><dd className="tnum mt-0.5 font-semibold">{sum.seconds >= 3600 ? `${(sum.seconds / 3600).toFixed(1)} h` : `${Math.round(sum.seconds / 60)} min`}</dd></div>
          </dl>
        </Panel>

        <div className="space-y-5">
          {/* Daily challenge */}
          <Link to="/daily" className="grad-premium block rounded-2xl border border-sky/30 p-6 transition-[filter] hover:brightness-110">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ice"><CalendarCheck size={15} />Daily challenge</span>
              <Tag color={daily.difficulty === 'Easy' ? '#22C55E' : daily.difficulty === 'Medium' ? '#FBBF24' : '#F97316'}>{daily.difficulty}</Tag>
            </div>
            <p className="mt-3 text-lg font-semibold">{daily.title}</p>
            <p className="mt-1 text-sm text-[#b9cdf5]">{dailyDone ? <>Solved. Next challenge in <Countdown /></> : <>Ends in <Countdown /></>}</p>
          </Link>

          {/* Achievements */}
          <Panel className="p-6">
            <PanelTitle action={<Link to="/profile" className="text-xs font-medium text-ice hover:underline">View all</Link>}>Recent achievements</PanelTitle>
            {earned.length > 0 ? (
              <ul className="space-y-3">
                {earned.map(([id]) => {
                  const a = achievementById(id)
                  return a ? (
                    <li key={id} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold"><Trophy size={17} /></span>
                      <span className="min-w-0"><span className="block truncate text-sm font-semibold">{a.name}</span><span className="block truncate text-xs text-mute">{a.description}</span></span>
                    </li>
                  ) : null
                })}
              </ul>
            ) : closest ? (
              <div>
                <p className="text-sm text-mute">Nothing unlocked yet. Closest:</p>
                <p className="mt-2 text-sm font-semibold">{closest.a.name}</p>
                <p className="text-xs text-mute">{closest.a.description}</p>
                <Bar value={closest.a.progress(state)[0]} max={closest.a.progress(state)[1]} className="mt-3 h-1.5" color="var(--color-gold)" />
              </div>
            ) : null}
          </Panel>
        </div>
      </section>
    </div>
  )
}
