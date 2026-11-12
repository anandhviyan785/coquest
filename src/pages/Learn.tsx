import { Check, Lock, Play, RotateCcw, Skull, Star, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Bar, LinkButton, PageHeader, cx } from '../components/ui'
import { COURSES, LANG_GLYPH, courseById, courseProgress, findBoss, findLesson, isUnlocked, nextStep, stepPath } from '../content'
import { XP } from '../lib/gamification'
import type { Course, Unit } from '../lib/types'
import { useApp } from '../state/AppContext'

const NODE_GAP = 104
const OFFSETS = [0, 62, 92, 62, 0, -62, -92, -62]
const PATH_WIDTH = 320

type NodeState = 'done' | 'current' | 'locked' | 'open'

interface PathNode { id: string; title: string; boss: boolean; state: NodeState; x: number; y: number }

const buildNodes = (course: Course, unit: Unit, done: Record<string, unknown>, current: string | null, startIndex: number): PathNode[] => {
  const ids = [...unit.lessons.map((l) => ({ id: l.id, title: l.title, boss: false })), ...(unit.boss ? [{ id: unit.boss.id, title: unit.boss.title, boss: true }] : [])]
  return ids.map((step, i) => ({
    ...step,
    state: done[step.id] ? 'done' : step.id === current ? 'current' : isUnlocked(course, step.id, done) ? 'open' : 'locked',
    x: PATH_WIDTH / 2 + OFFSETS[(startIndex + i) % OFFSETS.length],
    y: 44 + i * NODE_GAP,
  }))
}

const trail = (nodes: PathNode[]): string =>
  nodes.slice(1).reduce((d, n, i) => {
    const prev = nodes[i]
    const midY = (prev.y + n.y) / 2
    return `${d} C ${prev.x} ${midY}, ${n.x} ${midY}, ${n.x} ${n.y}`
  }, `M ${nodes[0].x} ${nodes[0].y}`)

function UnitPath({ nodes, selected, onSelect }: { nodes: PathNode[]; selected: string | null; onSelect: (id: string) => void }) {
  const height = 44 + (nodes.length - 1) * NODE_GAP + 60
  const doneCount = nodes.filter((n) => n.state === 'done').length
  const doneTrail = nodes.slice(0, Math.min(nodes.length, doneCount + 1))
  return (
    <div className="relative mx-auto" style={{ width: PATH_WIDTH, height }}>
      <svg width={PATH_WIDTH} height={height} className="absolute inset-0" aria-hidden="true">
        <path d={trail(nodes)} fill="none" stroke="#233354" strokeWidth="10" strokeLinecap="round" />
        {doneTrail.length > 1 && <path d={trail(doneTrail)} fill="none" stroke="#06B6D4" strokeWidth="10" strokeLinecap="round" />}
      </svg>
      {nodes.map((n) => {
        const size = n.boss ? 76 : 64
        const isSelected = selected === n.id
        return (
          <div key={n.id} className="absolute" style={{ left: n.x - size / 2, top: n.y - size / 2 }}>
            {n.state === 'current' && <Mascot expression="curious" size={58} className={cx('pointer-events-none absolute -top-2', n.x > PATH_WIDTH / 2 ? '-left-[62px]' : 'left-[70px]')} />}
            <button
              onClick={() => onSelect(n.id)}
              aria-label={`${n.title}${n.state === 'locked' ? ' (locked)' : n.state === 'done' ? ' (completed)' : ''}`}
              aria-pressed={isSelected}
              style={{ width: size, height: size }}
              className={cx(
                'relative flex items-center justify-center border-2 transition-transform hover:scale-105 active:scale-95',
                n.boss ? 'rounded-[22px]' : 'rounded-full',
                n.state === 'done' && 'border-cyan bg-cyan text-[#042f3a]',
                n.state === 'current' && 'border-sky bg-blue text-white shadow-[0_0_0_6px_rgb(37_99_235/0.22)]',
                n.state === 'open' && 'border-sky bg-raised text-ice',
                n.state === 'locked' && 'border-line bg-surface text-faint',
                isSelected && 'ring-2 ring-ice ring-offset-4 ring-offset-bg',
              )}
            >
              {n.state === 'locked' ? <Lock size={20} /> : n.boss ? <Skull size={28} /> : n.state === 'done' ? <Check size={26} strokeWidth={3} /> : <Star size={24} fill="currentColor" />}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function StepDetail({ course, id }: { course: Course; id: string }) {
  const { state } = useApp()
  const boss = id.startsWith('boss:') ? findBoss(id) : undefined
  const lesson = boss ? undefined : findLesson(id)
  const result = state.lessons[id]
  const unlocked = isUnlocked(course, id, state.lessons)
  if (!boss && !lesson) return null

  const title = boss ? boss.boss.title : lesson?.lesson.title
  const summary = boss ? boss.boss.story : lesson?.lesson.summary
  const reward = boss ? boss.boss.stages.length * XP.bossStage + XP.bossClear : XP.lesson
  const unitTitle = (boss ?? lesson)?.unit.title

  return (
    <div className="animate-rise rounded-2xl border border-line bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan">{boss ? 'Boss battle' : unitTitle}</p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-mute">{summary}</p>

      <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-mute">Reward</dt><dd className="tnum flex items-center gap-1 font-semibold"><Zap size={14} className="text-gold" fill="currentColor" />{reward} XP{!boss && <span className="font-normal text-faint"> +{XP.perfectBonus} if perfect</span>}</dd></div>
        {boss ? (
          <div className="flex justify-between"><dt className="text-mute">Stages</dt><dd className="tnum font-semibold">{boss.boss.stages.length}</dd></div>
        ) : (
          <div className="flex justify-between"><dt className="text-mute">Includes</dt><dd className="font-semibold">{lesson?.lesson.questions.length} questions · 1 coding exercise</dd></div>
        )}
        {result && <div className="flex justify-between"><dt className="text-mute">Best accuracy</dt><dd className="tnum font-semibold">{result.accuracy}%{result.perfect && <span className="ml-1.5 text-gold">Perfect</span>}</dd></div>}
      </dl>

      <div className="mt-6">
        {unlocked ? (
          <LinkButton to={stepPath(id)} size="lg" className="w-full">
            {result ? <><RotateCcw size={16} />Practise again</> : <><Play size={16} fill="currentColor" />{boss ? 'Enter battle' : 'Start lesson'}</>}
          </LinkButton>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-mute"><Lock size={15} />Finish the step before this one to unlock it.</p>
        )}
      </div>
    </div>
  )
}

export function Learn() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { state } = useApp()
  const course = courseById(courseId ?? '') ?? COURSES[0]
  const current = nextStep(course, state.lessons)
  const [selected, setSelected] = useState<string | null>(current)

  useEffect(() => setSelected(nextStep(course, state.lessons)), [course]) // eslint-disable-line react-hooks/exhaustive-deps

  const units = useMemo(() => {
    let offset = 0
    return course.units.map((unit) => {
      const nodes = buildNodes(course, unit, state.lessons, current, offset)
      offset += nodes.length
      return { unit, nodes }
    })
  }, [course, state.lessons, current])

  return (
    <div>
      <PageHeader title="Learn" subtitle="Seven languages, one path each. Finish a step to unlock the next." />

      <div className="-mx-1 mb-7 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Courses">
        {COURSES.map((c) => {
          const p = courseProgress(c, state.lessons)
          const active = c.id === course.id
          return (
            <button key={c.id} role="tab" aria-selected={active} onClick={() => navigate(`/learn/${c.id}`)} className={cx('flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors', active ? 'border-sky bg-raised' : 'border-line bg-card hover:border-sky/50')}>
              <span className={cx('flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[13px] font-bold', active ? 'bg-blue text-white' : 'bg-surface text-ice')}>{LANG_GLYPH[c.id]}</span>
              <span>
                <span className="block text-sm font-semibold">{c.name}</span>
                <span className="tnum block text-xs text-mute">{p.pct}% complete</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {units.map(({ unit, nodes }, i) => {
            const done = nodes.filter((n) => n.state === 'done').length
            return (
              <section key={unit.id} aria-label={unit.title}>
                <header className="mb-6 rounded-2xl border border-line bg-card px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan">Unit {i + 1}</p>
                      <h2 className="text-lg font-semibold tracking-tight">{unit.title}</h2>
                    </div>
                    <span className="tnum text-sm text-mute">{done} / {nodes.length}</span>
                  </div>
                  <Bar value={done} max={nodes.length} className="mt-3 h-1.5" color="var(--color-cyan)" />
                </header>
                <UnitPath nodes={nodes} selected={selected} onSelect={setSelected} />
              </section>
            )
          })}
          {!current && (
            <div className="flex flex-col items-center rounded-2xl border border-line bg-card p-8 text-center">
              <Mascot expression="victorious" size={120} />
              <p className="mt-3 text-lg font-semibold">{course.name} complete</p>
              <p className="mt-1 text-sm text-mute">Every lesson and boss in this course is done. Pick another language above.</p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {selected ? <StepDetail course={course} id={selected} /> : <p className="rounded-2xl border border-line bg-card p-6 text-sm text-mute">Select a step on the path to see what it covers.</p>}
          <p className="mt-4 px-1 text-xs leading-relaxed text-faint">{course.tagline}. {course.units.length} units, {course.units.reduce((n, u) => n + u.lessons.length, 0)} lessons.</p>
        </aside>
      </div>
    </div>
  )
}
