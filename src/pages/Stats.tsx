import { useMemo } from 'react'
import { Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bar, LinkButton, PageHeader, Panel, PanelTitle, Stat } from '../components/ui'
import { Mascot } from '../components/Mascot'
import { COURSES, LANG_LABEL, courseProgress } from '../content'
import { addDays, dayKey, lastNDays, parseDay, shortDate, weekStartOf, weekdayShort } from '../lib/dates'
import { totals } from '../lib/gamification'
import type { LangId } from '../lib/types'
import { useApp } from '../state/AppContext'

const TOOLTIP = { contentStyle: { background: '#FFFFFF', border: '2px solid #E5E5E5', borderRadius: 10, fontSize: 13 }, labelStyle: { color: '#777777' }, cursor: { fill: 'rgba(148,163,184,0.08)' } }
const AXIS = { tickLine: false, axisLine: false, tick: { fill: '#AFAFAF', fontSize: 12 } }
const HEAT_WEEKS = 18
const HEAT = ['#E5E5E5', '#D7FFB8', '#A5ED6E', '#58CC02', '#58A700']

const minutes = (seconds: number): string => (seconds >= 3600 ? `${(seconds / 3600).toFixed(1)} h` : `${Math.round(seconds / 60)} min`)

function Heatmap({ xpByDay, goal }: { xpByDay: (key: string) => number; goal: number }) {
  const today = dayKey()
  const start = addDays(weekStartOf(today), -7 * (HEAT_WEEKS - 1))
  const weeks = Array.from({ length: HEAT_WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  const shade = (xp: number) => (xp <= 0 ? 0 : xp < goal * 0.5 ? 1 : xp < goal ? 2 : xp < goal * 2 ? 3 : 4)
  return (
    <div>
      <div className="flex gap-[5px] overflow-x-auto pb-1">
        <div className="mr-1 flex flex-col justify-between py-[2px] text-[10px] text-faint"><span>Mon</span><span>Thu</span><span>Sun</span></div>
        {weeks.map((week) => (
          <div key={week[0]} className="flex flex-col gap-[5px]">
            {week.map((key) => {
              const xp = xpByDay(key)
              const future = key > today
              return <span key={key} title={future ? undefined : `${shortDate(key)}: ${xp} XP`} className="h-[15px] w-[15px] rounded-[4px]" style={{ background: future ? 'transparent' : HEAT[shade(xp)], outline: key === today ? '2px solid #1CB0F6' : undefined }} />
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-faint">
        <span>{parseDay(start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – today</span>
        <span className="flex items-center gap-1.5">Less{HEAT.map((c) => <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />)}More</span>
      </div>
    </div>
  )
}

export function Stats() {
  const { state, weeklyXp } = useApp()
  const today = dayKey()
  const sum = totals(state)

  const week = useMemo(() => lastNDays(7, today).map((key) => ({ day: weekdayShort(key), minutes: Math.round((state.days[key]?.seconds ?? 0) / 60), xp: state.days[key]?.xp ?? 0 })), [state.days, today])
  const month = useMemo(() => lastNDays(30, today).map((key) => ({ date: shortDate(key), xp: state.days[key]?.xp ?? 0 })), [state.days, today])

  const weekSeconds = lastNDays(7, today).reduce((n, key) => n + (state.days[key]?.seconds ?? 0), 0)
  const active30 = lastNDays(30, today).filter((key) => (state.days[key]?.xp ?? 0) > 0).length
  const consistency = Math.round((active30 / 30) * 100)

  const langXp = useMemo(() => {
    const acc: Partial<Record<LangId, number>> = {}
    Object.values(state.days).forEach((d) => Object.entries(d.langs).forEach(([lang, xp]) => { acc[lang as LangId] = (acc[lang as LangId] ?? 0) + (xp ?? 0) }))
    return Object.entries(acc).map(([lang, xp]) => ({ lang: LANG_LABEL[lang as LangId], xp: xp ?? 0 })).filter((l) => l.xp > 0).sort((a, b) => b.xp - a.xp)
  }, [state.days])

  if (sum.activeDays === 0 && sum.seconds === 0) {
    return (
      <div>
        <PageHeader title="Statistics" subtitle="Your learning, measured." />
        <Panel className="flex flex-col items-center px-6 py-14 text-center">
          <Mascot expression="curious" size={120} />
          <p className="mt-4 text-lg font-semibold">Nothing to chart yet</p>
          <p className="mt-1 max-w-sm text-sm text-mute">Every number on this page comes from what you actually do. Finish your first lesson and it starts filling in.</p>
          <LinkButton to="/learn" className="mt-5">Start learning</LinkButton>
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Statistics" subtitle="Your learning, measured. Everything here is recorded from your own activity." />

      <Panel className="grid grid-cols-2 gap-6 p-6 lg:grid-cols-5">
        <Stat label="Learning time this week" value={minutes(weekSeconds)} hint={`${minutes(sum.seconds)} all time`} />
        <Stat label="XP this week" value={weeklyXp.toLocaleString()} hint={`${state.xp.toLocaleString()} all time`} />
        <Stat label="Lessons completed" value={sum.lessons} hint={`${sum.bosses} boss${sum.bosses === 1 ? '' : 'es'} defeated`} />
        <Stat label="Accuracy" value={sum.accuracy === null ? '—' : `${sum.accuracy}%`} hint={`${sum.correct} of ${sum.attempts} answers`} />
        <Stat label="Consistency" value={`${consistency}%`} hint={`${active30} of the last 30 days`} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-6">
          <PanelTitle>XP earned — last 30 days</PanelTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={month} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <defs><linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1CB0F6" stopOpacity={0.35} /><stop offset="100%" stopColor="#1CB0F6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#E5E5E5" vertical={false} />
                <XAxis dataKey="date" {...AXIS} interval={6} />
                <YAxis {...AXIS} allowDecimals={false} />
                <Tooltip {...TOOLTIP} cursor={{ stroke: '#E5E5E5' }} formatter={(v) => [`${v} XP`, 'Earned']} />
                <Area type="monotone" dataKey="xp" stroke="#1CB0F6" strokeWidth={2} fill="url(#xpFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-6">
          <PanelTitle>Learning time — this week</PanelTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#E5E5E5" vertical={false} />
                <XAxis dataKey="day" {...AXIS} />
                <YAxis {...AXIS} allowDecimals={false} />
                <Tooltip {...TOOLTIP} formatter={(v) => [`${v} min`, 'Time']} />
                <RBar dataKey="minutes" fill="#1CB0F6" radius={[6, 6, 2, 2]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-6">
          <PanelTitle>Daily activity</PanelTitle>
          <Heatmap xpByDay={(key) => state.days[key]?.xp ?? 0} goal={state.dailyGoal} />
        </Panel>

        <Panel className="p-6">
          <PanelTitle>Languages studied</PanelTitle>
          {langXp.length === 0 ? (
            <p className="text-sm text-mute">Earn XP in a course and it will show up here.</p>
          ) : (
            <ul className="space-y-3.5">
              {langXp.map((l) => (
                <li key={l.lang}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{l.lang}</span><span className="tnum text-mute">{l.xp.toLocaleString()} XP</span></div>
                  <Bar value={l.xp} max={langXp[0].xp} color="var(--color-sky)" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="p-6">
        <PanelTitle>Course completion</PanelTitle>
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {COURSES.map((course) => {
            const p = courseProgress(course, state.lessons)
            return (
              <li key={course.id}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{course.name}</span><span className="tnum text-mute">{p.completed}/{p.total} · {p.pct}%</span></div>
                <Bar value={p.completed} max={p.total} color={p.pct === 100 ? 'var(--color-ok)' : 'var(--color-cyan)'} />
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
