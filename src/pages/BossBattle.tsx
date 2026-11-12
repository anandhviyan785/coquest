import { ArrowRight, Heart, Swords, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Toasts, useRewardToasts } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Monster } from '../components/Monster'
import { Button, LinkButton, cx } from '../components/ui'
import { Workbench } from '../components/Workbench'
import type { CheckSummary } from '../components/Workbench'
import { findBoss, isUnlocked, nextStep, stepPath, stepTitle } from '../content'
import { XP } from '../lib/gamification'
import { useApp } from '../state/AppContext'

const HEARTS = 3
const REMATCH_XP = 10
const MAX_TRACKED_SECONDS = 45 * 60

type Phase = 'intro' | 'fight' | 'won' | 'lost'

export function BossBattle() {
  const { bossId = '' } = useParams()
  const { state, earn, logTime } = useApp()
  const reward = useRewardToasts()
  const ref = findBoss(decodeURIComponent(bossId))

  const [phase, setPhase] = useState<Phase>('intro')
  const [stage, setStage] = useState(0)
  const [hearts, setHearts] = useState(HEARTS)
  const [attempts, setAttempts] = useState(0)
  const [hurt, setHurt] = useState(false)
  const [stageCleared, setStageCleared] = useState(false)
  const [earned, setEarned] = useState(0)
  const startedAt = useRef(Date.now())
  const credited = useRef(false)

  useEffect(() => {
    const lang = ref?.course.id
    return () => {
      if (!credited.current && startedAt.current) logTime(Math.min((Date.now() - startedAt.current) / 1000, MAX_TRACKED_SECONDS), lang)
    }
  }, [bossId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ref) return <Navigate to="/bosses" replace />
  const { course, boss } = ref
  if (!isUnlocked(course, boss.id, state.lessons)) return <Navigate to="/bosses" replace />

  const begin = () => {
    startedAt.current = Date.now()
    credited.current = false
    setStage(0)
    setHearts(HEARTS)
    setAttempts(0)
    setStageCleared(false)
    setPhase('fight')
  }

  const win = (totalAttempts: number) => {
    credited.current = true
    const first = !state.lessons[boss.id]
    const xp = first ? boss.stages.length * XP.bossStage + XP.bossClear : REMATCH_XP
    const accuracy = Math.round((boss.stages.length / totalAttempts) * 100)
    const previous = state.lessons[boss.id]
    const result = earn(
      { xp, kind: 'boss', title: boss.title, lang: course.id, seconds: Math.min((Date.now() - startedAt.current) / 1000, MAX_TRACKED_SECONDS), correct: boss.stages.length, attempts: totalAttempts },
      (s) => ({ ...s, lessons: { ...s.lessons, [boss.id]: { at: new Date().toISOString(), accuracy: Math.max(accuracy, previous?.accuracy ?? 0), xp: (previous?.xp ?? 0) + xp, perfect: totalAttempts === boss.stages.length || Boolean(previous?.perfect) } } }),
    )
    reward(result)
    setEarned(result.xp)
    setPhase('won')
  }

  const onCheck = (check: CheckSummary) => {
    if (stageCleared) return
    const total = attempts + 1
    setAttempts(total)
    if (check.passed) {
      setHurt(true)
      setTimeout(() => setHurt(false), 400)
      setStageCleared(true)
      if (stage === boss.stages.length - 1) setTimeout(() => win(total), 700)
      return
    }
    const left = hearts - 1
    setHearts(left)
    if (left <= 0) setPhase('lost')
  }

  const advance = () => {
    setStage(stage + 1)
    setStageCleared(false)
  }

  const health = boss.stages.length - stage - (stageCleared ? 1 : 0)
  const upNext = nextStep(course, { ...state.lessons, [boss.id]: true })

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line px-5">
        <Link to="/bosses" aria-label="Leave battle" className="rounded-lg p-2 text-mute hover:bg-card hover:text-ink"><X size={20} /></Link>
        <span className="truncate text-sm font-semibold">{boss.title}</span>
        {phase === 'fight' && (
          <div className="ml-auto flex items-center gap-1" aria-label={`${hearts} of ${HEARTS} hearts left`}>
            {Array.from({ length: HEARTS }, (_, i) => <Heart key={i} size={20} className={i < hearts ? 'text-bad' : 'text-line'} fill="currentColor" />)}
          </div>
        )}
      </header>

      {phase === 'intro' && (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
          <div className="w-full max-w-lg text-center">
            <div className="flex items-end justify-center gap-6">
              <Mascot expression="determined" size={120} />
              <Swords size={28} className="mb-10 text-faint" />
              <Monster id={boss.id} size={150} />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-flame">{boss.monster}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{boss.title}</h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-mute">{boss.story}</p>
            <p className="mt-5 text-sm text-faint">{boss.stages.length} stages · {HEARTS} hearts · a failed check costs one heart</p>
            <Button size="lg" className="mt-7" onClick={begin}><Swords size={17} />Begin battle</Button>
          </div>
        </div>
      )}

      {phase === 'fight' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="border-b border-line bg-surface">
            <div className="mx-auto flex max-w-4xl items-center gap-5 px-5 py-4">
              <Monster id={boss.id} size={72} hurt={hurt} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{boss.monster}</span>
                  <span className="tnum text-mute">Stage {stage + 1} of {boss.stages.length}</span>
                </div>
                <div className="mt-2 flex gap-1.5" aria-label={`Boss health ${health} of ${boss.stages.length}`}>
                  {boss.stages.map((_, i) => <span key={i} className={cx('h-2.5 flex-1 rounded-full transition-colors duration-500', i < health ? 'bg-bad' : 'bg-card')} />)}
                </div>
              </div>
              <Mascot expression={stageCleared ? 'happy' : hearts === 1 ? 'thinking' : 'determined'} size={68} className="hidden sm:block" />
            </div>
          </div>
          <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-7">
            <Workbench key={stage} lang={course.id} exercise={boss.stages[stage]} onCheck={onCheck} disabled={stageCleared} />
          </div>
          {stageCleared && stage < boss.stages.length - 1 && (
            <footer className="border-t border-ok/40 bg-ok/[0.08] px-5 py-4">
              <div className="mx-auto flex max-w-4xl items-center gap-4">
                <p className="flex-1 font-semibold text-ok">Direct hit. {boss.monster} staggers.</p>
                <Button size="lg" variant="success" onClick={advance}>Next stage<ArrowRight size={17} /></Button>
              </div>
            </footer>
          )}
        </div>
      )}

      {phase === 'won' && (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
          <div className="animate-pop w-full max-w-md text-center">
            <div className="flex items-end justify-center gap-4">
              <Mascot expression="victorious" size={170} float />
              <Monster id={boss.id} size={90} defeated />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Boss defeated</h1>
            <p className="mt-1.5 text-mute">{boss.monster} is no match for you.</p>
            <p className="tnum mx-auto mt-6 flex w-fit items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-lg font-semibold text-gold"><Zap size={18} fill="currentColor" />+{earned} XP</p>
            <div className="mt-7 flex flex-col gap-2.5">
              {upNext && <LinkButton to={stepPath(upNext)} size="lg">Next: {stepTitle(upNext)}<ArrowRight size={17} /></LinkButton>}
              <LinkButton to={`/learn/${course.id}`} variant="secondary" size="lg">Back to the path</LinkButton>
            </div>
          </div>
        </div>
      )}

      {phase === 'lost' && (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
          <div className="animate-pop w-full max-w-md text-center">
            <div className="flex items-end justify-center gap-4">
              <Mascot expression="disappointed" size={150} />
              <Monster id={boss.id} size={110} />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Out of hearts</h1>
            <p className="mt-1.5 text-mute">{boss.monster} won this round — you reached stage {stage + 1} of {boss.stages.length}. Use Run to test your code before you Check.</p>
            <div className="mt-7 flex flex-col gap-2.5">
              <Button size="lg" onClick={begin}>Try again</Button>
              <LinkButton to={`/learn/${course.id}`} variant="secondary" size="lg">Review the unit</LinkButton>
            </div>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  )
}
