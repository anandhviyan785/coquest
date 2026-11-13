import { BookOpen, Check, Lock, Skull, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LangLogo } from '../components/LangLogo'
import { Mascot } from '../components/Mascot'
import { LinkButton, cx } from '../components/ui'
import { CODING_BASICS, DEV_TERMS, GLOSSARIES } from '../content/glossary'
import { COURSES, courseById, courseProgress, findBoss, findLesson, isUnlocked, nextStep, stepPath } from '../content'
import { XP } from '../lib/gamification'
import { COMPILER_HELP, compilerConfigured, needsCompiler } from '../lib/runner'
import type { Course, Unit } from '../lib/types'
import { useApp } from '../state/AppContext'

const NODE_GAP = 92
const NODE_W = 70
const NODE_H = 58
const OFFSETS = [0, -44, -70, -44, 0, 44, 70, 44]
const LAST_COURSE_KEY = 'pyquest:v1:course'

/** Banner and node colours, one per unit, cycling through the blue theme. */
const UNIT_COLORS = [
  { fill: '#1CB0F6', edge: '#1899D6' },
  { fill: '#2B70C9', edge: '#1F5AA6' },
  { fill: '#00B8D4', edge: '#0097AE' },
  { fill: '#4A62D8', edge: '#3A4EB4' },
  { fill: '#1CB0F6', edge: '#1899D6' },
  { fill: '#2B70C9', edge: '#1F5AA6' },
]

type NodeState = 'done' | 'current' | 'open' | 'locked'
interface PathNode { id: string; title: string; boss: boolean; state: NodeState; dx: number; position: number; count: number }

const buildNodes = (course: Course, unit: Unit, done: Record<string, unknown>, current: string | null): PathNode[] => {
  const steps = [...unit.lessons.map((l) => ({ id: l.id, title: l.title, boss: false })), ...(unit.boss ? [{ id: unit.boss.id, title: unit.boss.title, boss: true }] : [])]
  return steps.map((step, i) => ({
    ...step,
    state: done[step.id] ? 'done' : step.id === current ? 'current' : isUnlocked(course, step.id, done) ? 'open' : 'locked',
    dx: OFFSETS[i % OFFSETS.length],
    position: i + 1,
    count: steps.length,
  }))
}

function NodePopover({ node, color, onClose }: { node: PathNode; color: { fill: string; edge: string }; onClose: () => void }) {
  const { state } = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const boss = node.boss ? findBoss(node.id) : undefined
  const lesson = node.boss ? undefined : findLesson(node.id)
  const result = state.lessons[node.id]
  const locked = node.state === 'locked'
  const reward = boss ? boss.boss.stages.length * XP.bossStage + XP.bossClear : XP.lesson

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    // Registered on the next tick so the click that opened the popover does not close it.
    const timer = setTimeout(() => document.addEventListener('pointerdown', onPointer))
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div ref={ref} role="dialog" aria-label={node.title} className="animate-pop absolute left-1/2 top-full z-20 mt-4 w-[296px] -translate-x-1/2 rounded-2xl p-4 text-left" style={{ background: locked ? '#F7F7F7' : color.fill, border: locked ? '2px solid #E5E5E5' : undefined }}>
      <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px]" style={{ background: locked ? '#F7F7F7' : color.fill, borderLeft: locked ? '2px solid #E5E5E5' : undefined, borderTop: locked ? '2px solid #E5E5E5' : undefined }} />
      <p className={cx('text-[17px] font-bold', locked ? 'text-faint' : 'text-white')}>{node.title}</p>
      <p className={cx('mt-1 text-[15px]', locked ? 'text-faint' : 'text-white/90')}>
        {locked ? 'Complete all the steps above to unlock this.' : boss ? `${boss.boss.monster} · ${boss.boss.stages.length} stages` : lesson?.lesson.summary}
      </p>
      {!locked && result && <p className="mt-1 text-[13px] font-bold text-white/90">Best accuracy {result.accuracy}%{result.perfect ? ' · Perfect' : ''}</p>}
      {locked ? (
        <span className="label mt-4 flex h-11 items-center justify-center rounded-xl bg-line text-[13px] text-faint">Locked</span>
      ) : (
        <LinkButton to={stepPath(node.id)} variant="secondary" className="mt-4 w-full !border-0 !border-b-4 !border-black/15" >
          <span style={{ color: color.edge }}>{result ? 'Practise again +5 XP' : `${boss ? 'Fight' : 'Start'} +${reward} XP`}</span>
        </LinkButton>
      )}
    </div>
  )
}

function UnitSection({ course, unit, index, nodes, selected, onSelect }: { course: Course; unit: Unit; index: number; nodes: PathNode[]; selected: string | null; onSelect: (id: string | null) => void }) {
  const color = UNIT_COLORS[index % UNIT_COLORS.length]
  const done = nodes.filter((n) => n.state === 'done').length
  // QUEST stands beside the third step, on the side the path bends away from.
  const mascotAt = Math.min(2, nodes.length - 1)
  const unitDone = done === nodes.length

  return (
    <section aria-label={unit.title} className="mb-10">
      <header className="flex items-center justify-between gap-4 rounded-2xl border-b-4 px-5 py-4 text-white" style={{ background: color.fill, borderColor: color.edge }}>
        <div className="min-w-0">
          <p className="label text-[13px] text-white/80">{course.name} · Unit {index + 1}</p>
          <h2 className="mt-0.5 truncate text-xl font-bold">{unit.title}</h2>
        </div>
        <span className="label tnum shrink-0 rounded-xl border-2 border-b-4 border-black/15 px-3 py-2 text-[13px]">{done} / {nodes.length}</span>
      </header>

      <div className="relative mx-auto mt-8" style={{ height: nodes.length * NODE_GAP + 16 }}>
        {nodes.map((node, i) => {
          const isOpen = selected === node.id
          const coloured = node.state !== 'locked'
          return (
            <div key={node.id} className="absolute left-1/2" style={{ top: i * NODE_GAP, transform: `translateX(calc(-50% + ${node.dx}px))`, zIndex: isOpen ? 20 : 1 }}>
              {node.state === 'current' && (
                <span className="label animate-bob pointer-events-none absolute -top-11 left-1/2 z-10 -translate-x-1/2 rounded-xl border-2 border-line bg-white px-3 py-2 text-[13px]" style={{ color: color.fill }}>
                  Start
                  <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-white" />
                </span>
              )}
              <button
                onClick={() => onSelect(isOpen ? null : node.id)}
                aria-label={`${node.title}${node.state === 'locked' ? ' (locked)' : node.state === 'done' ? ' (completed)' : ''}`}
                aria-expanded={isOpen}
                className={cx('relative flex items-center justify-center rounded-[50%] transition-transform active:translate-y-2', node.state === 'current' && 'outline outline-[6px] outline-offset-[6px] outline-line')}
                style={{ width: NODE_W, height: NODE_H, background: coloured ? color.fill : '#E5E5E5', boxShadow: `0 8px 0 ${coloured ? color.edge : '#B7B7B7'}`, color: coloured ? '#fff' : '#AFAFAF' }}
              >
                {node.state === 'locked' ? (node.boss ? <Skull size={30} strokeWidth={2.4} /> : <Lock size={26} strokeWidth={3} />) : node.boss ? <Skull size={32} strokeWidth={2.4} /> : node.state === 'done' ? <Check size={32} strokeWidth={4} /> : <Star size={30} fill="currentColor" />}
              </button>
              {i === mascotAt && (
                <Mascot expression={unitDone ? 'happy' : nodes.some((n) => n.state === 'current') ? 'curious' : 'sleeping'} size={104} float={!unitDone} className={cx('pointer-events-none absolute top-1/2 hidden -translate-y-1/2 sm:block', node.dx <= 0 ? 'left-[150px]' : 'right-[150px]', !nodes.some((n) => n.state !== 'locked') && 'opacity-40 grayscale')} />
              )}
              {isOpen && <NodePopover node={node} color={color} onClose={() => onSelect(null)} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function Learn() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { state } = useApp()

  const remembered = (() => {
    try {
      return localStorage.getItem(LAST_COURSE_KEY) ?? ''
    } catch {
      return ''
    }
  })()
  const course = courseById(courseId ?? '') ?? courseById(remembered) ?? COURSES[0]
  const current = nextStep(course, state.lessons)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setSelected(null)
    try {
      localStorage.setItem(LAST_COURSE_KEY, course.id)
    } catch (err) {
      console.error('Could not remember the selected course', err)
    }
  }, [course.id])

  const units = useMemo(() => course.units.map((unit) => ({ unit, nodes: buildNodes(course, unit, state.lessons, current) })), [course, state.lessons, current])

  return (
    <div>
      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Courses">
        {COURSES.map((c) => {
          const active = c.id === course.id
          const pct = courseProgress(c, state.lessons).pct
          return (
            <button key={c.id} role="tab" aria-selected={active} onClick={() => navigate(`/learn/${c.id}`)} className={cx('flex shrink-0 items-center gap-2.5 rounded-xl border-2 border-b-4 px-3 py-2 transition-colors', active ? 'border-blue-line bg-blue-soft' : 'border-line bg-white hover:bg-surface')}>
              <LangLogo lang={c.id} size={30} />
              <span className="text-left">
                <span className={cx('block text-[15px] font-bold leading-tight', active ? 'text-blue' : 'text-body')}>{c.name}</span>
                <span className="tnum block text-[12px] font-bold text-faint">{pct}%</span>
              </span>
            </button>
          )
        })}
      </div>

      <Link to={`/learn/${course.id}/glossary`} className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-b-4 border-line px-5 py-4 transition-colors hover:bg-surface active:translate-y-0.5 active:border-b-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue"><BookOpen size={22} strokeWidth={2.4} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold text-body">{course.name} glossary</span>
          <span className="block text-[15px] text-mute">{GLOSSARIES[course.id].length + CODING_BASICS.length + DEV_TERMS.length} key terms explained in plain language</span>
        </span>
        <span className="label hidden text-[13px] text-blue sm:block">Open</span>
      </Link>

      {needsCompiler(course.id) && !compilerConfigured && (
        <p className="mb-6 rounded-2xl border-2 border-gold bg-[#FFF8DC] px-5 py-4 text-[15px] font-bold leading-relaxed text-body" role="note">{COMPILER_HELP} Until then you can read these lessons and answer the questions, but the coding exercises cannot be checked.</p>
      )}

      {units.map(({ unit, nodes }, i) => (
        <UnitSection key={unit.id} course={course} unit={unit} index={i} nodes={nodes} selected={selected} onSelect={setSelected} />
      ))}

      {!current && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-line p-8 text-center">
          <Mascot expression="victorious" size={130} />
          <p className="mt-3 text-xl font-bold text-ink">{course.name} complete!</p>
          <p className="mt-1 text-[15px] text-mute">Every lesson and boss in this course is done. Pick another language above.</p>
        </div>
      )}
    </div>
  )
}
