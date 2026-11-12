import { ArrowRight, Check, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Toasts, useRewardToasts } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Button, Code, LinkButton, Prose, cx } from '../components/ui'
import { Workbench } from '../components/Workbench'
import type { CheckSummary } from '../components/Workbench'
import { findLesson, isUnlocked, nextStep, stepPath, stepTitle } from '../content'
import { XP } from '../lib/gamification'
import type { Question } from '../lib/types'
import { useApp } from '../state/AppContext'

const MAX_TRACKED_SECONDS = 30 * 60
const REPLAY_XP = 5

interface Tally { correct: number; attempts: number }

function QuestionStep({ question, onAnswered, onNext }: { question: Question; onAnswered: (correct: boolean) => void; onNext: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [verdict, setVerdict] = useState<boolean | null>(null)

  const ready = question.type === 'choice' ? picked !== null : typed.trim() !== ''

  const submit = () => {
    if (!ready || verdict !== null) return
    const correct = question.type === 'choice' ? picked === question.answer : question.answers.includes(typed.trim())
    setVerdict(correct)
    onAnswered(correct)
  }

  const [before, after] = question.type === 'fill' ? question.code.split('___') : ['', '']

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <h1 className="text-xl font-semibold tracking-tight">{question.prompt}</h1>

        {question.type === 'choice' ? (
          <>
            {question.code && <Code code={question.code} className="mt-5" />}
            <div className="mt-6 grid gap-2.5" role="radiogroup">
              {question.options.map((option, i) => {
                const isAnswer = verdict !== null && i === question.answer
                const isWrongPick = verdict === false && i === picked
                return (
                  <button
                    key={option}
                    role="radio"
                    aria-checked={picked === i}
                    disabled={verdict !== null}
                    onClick={() => setPicked(i)}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left font-mono text-sm transition-colors',
                      isAnswer ? 'border-ok bg-ok/10' : isWrongPick ? 'border-bad bg-bad/10' : picked === i ? 'border-sky bg-raised' : 'border-line bg-card hover:border-sky/50',
                    )}
                  >
                    <span className={cx('tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-sans text-xs font-semibold', picked === i && verdict === null ? 'border-sky text-ice' : 'border-line text-mute')}>{i + 1}</span>
                    <span className="whitespace-pre-wrap">{option}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <pre className="mt-5 overflow-x-auto rounded-xl border border-line bg-bg px-4 py-4 font-mono text-[14px] leading-loose text-[#cfe3ff]">
            {before}
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
              disabled={verdict !== null}
              autoFocus
              aria-label="Your answer"
              spellCheck={false}
              autoCapitalize="off"
              size={Math.max(6, typed.length + 1)}
              className={cx('mx-0.5 rounded-md border bg-card px-2 py-0.5 text-center font-mono text-ice outline-none', verdict === true ? 'border-ok' : verdict === false ? 'border-bad' : 'border-sky')}
            />
            {after}
          </pre>
        )}
      </div>

      <footer className={cx('border-t px-5 py-4', verdict === null ? 'border-line bg-surface' : verdict ? 'border-ok/40 bg-ok/[0.08]' : 'border-bad/40 bg-bad/[0.08]')}>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-4">
          {verdict === null ? (
            <Button size="lg" className="ml-auto" onClick={submit} disabled={!ready}>Check</Button>
          ) : (
            <>
              <Mascot expression={verdict ? 'happy' : 'disappointed'} size={64} className="hidden shrink-0 sm:block" />
              <div className="min-w-0 flex-1 animate-rise">
                <p className={cx('flex items-center gap-1.5 font-semibold', verdict ? 'text-ok' : 'text-bad')}>
                  {verdict ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                  {verdict ? 'Correct' : question.type === 'fill' ? `Not quite — the answer is ${question.answers[0]}` : 'Not quite'}
                </p>
                <p className="mt-0.5 text-sm text-[#d5deeb]">{question.explain}</p>
              </div>
              <Button size="lg" variant={verdict ? 'success' : 'primary'} onClick={onNext} autoFocus>Continue</Button>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { state, earn, logTime } = useApp()
  const reward = useRewardToasts()
  const ref = findLesson(lessonId)

  const [step, setStep] = useState(0)
  const [tally, setTally] = useState<Tally>({ correct: 0, attempts: 0 })
  const [solved, setSolved] = useState(false)
  const [summary, setSummary] = useState<{ xp: number; accuracy: number; perfect: boolean; first: boolean } | null>(null)
  const startedAt = useRef(Date.now())
  const credited = useRef(false)

  // Time spent on a lesson that is abandoned still counts as study time.
  useEffect(() => {
    startedAt.current = Date.now()
    credited.current = false
    setStep(0)
    setTally({ correct: 0, attempts: 0 })
    setSolved(false)
    setSummary(null)
    const lang = ref?.course.id
    return () => {
      if (!credited.current) logTime(Math.min((Date.now() - startedAt.current) / 1000, MAX_TRACKED_SECONDS), lang)
    }
  }, [lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ref) return <Navigate to="/learn" replace />
  const { course, lesson } = ref
  if (!isUnlocked(course, lesson.id, state.lessons)) return <Navigate to={`/learn/${course.id}`} replace />

  const exerciseStep = lesson.questions.length + 1
  const totalSteps = exerciseStep + 1
  const record = (correct: boolean) => setTally((t) => ({ correct: t.correct + (correct ? 1 : 0), attempts: t.attempts + 1 }))

  const onCheck = (check: CheckSummary) => {
    const next = { correct: tally.correct + (check.passed ? 1 : 0), attempts: tally.attempts + 1 }
    setTally(next)
    if (!check.passed || solved) return
    setSolved(true)
    credited.current = true
    const first = !state.lessons[lesson.id]
    const perfect = next.correct === next.attempts && check.hintsUsed === 0
    const accuracy = Math.round((next.correct / next.attempts) * 100)
    const xp = first ? XP.lesson + (perfect ? XP.perfectBonus : 0) : REPLAY_XP
    const seconds = Math.min((Date.now() - startedAt.current) / 1000, MAX_TRACKED_SECONDS)
    const previous = state.lessons[lesson.id]
    const result = earn(
      { xp, kind: 'lesson', title: lesson.title, lang: course.id, seconds, lessons: first ? 1 : 0, correct: next.correct, attempts: next.attempts },
      (s) => ({
        ...s,
        lessons: {
          ...s.lessons,
          [lesson.id]: { at: new Date().toISOString(), accuracy: Math.max(accuracy, previous?.accuracy ?? 0), xp: (previous?.xp ?? 0) + xp, perfect: perfect || Boolean(previous?.perfect) },
        },
      }),
    )
    reward(result)
    setSummary({ xp: result.xp, accuracy, perfect, first })
  }

  const upNext = nextStep(course, { ...state.lessons, [lesson.id]: true })

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line px-5">
        <Link to={`/learn/${course.id}`} aria-label="Leave lesson" className="rounded-lg p-2 text-mute hover:bg-card hover:text-ink"><X size={20} /></Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={totalSteps}>
          <div className="grad-primary h-full rounded-full transition-[width] duration-500" style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }} />
        </div>
        <span className="tnum hidden text-sm text-mute sm:block">{lesson.title}</span>
      </header>

      {step === 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
            <div className="flex items-end gap-4">
              <Mascot expression="curious" size={84} className="shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan">{course.name} · {ref.unit.title}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
              </div>
            </div>
            <div className="mt-7 space-y-4">{lesson.explain.map((p) => <Prose key={p} text={p} />)}</div>
            <p className="mb-2 mt-7 text-xs font-semibold uppercase tracking-[0.08em] text-mute">Example</p>
            <Code code={lesson.example.code} />
            {lesson.example.output && (
              <>
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-mute">Output</p>
                <Code code={lesson.example.output} className="!text-ok/90" />
              </>
            )}
          </div>
          <footer className="border-t border-line bg-surface px-5 py-4">
            <div className="mx-auto flex max-w-2xl justify-end"><Button size="lg" onClick={() => setStep(1)}>Got it<ArrowRight size={17} /></Button></div>
          </footer>
        </div>
      )}

      {step >= 1 && step < exerciseStep && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <QuestionStep key={step} question={lesson.questions[step - 1]} onAnswered={record} onNext={() => setStep(step + 1)} />
        </div>
      )}

      {step === exerciseStep && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-cyan">Your turn — coding exercise</p>
            <Workbench lang={course.id} exercise={lesson.exercise} onCheck={onCheck} />
          </div>
          {solved && (
            <footer className="border-t border-ok/40 bg-ok/[0.08] px-5 py-4">
              <div className="mx-auto flex max-w-4xl items-center gap-4">
                <Mascot expression="happy" size={60} className="hidden shrink-0 sm:block" />
                <p className="flex-1 font-semibold text-ok">Every test passed. Nicely done.</p>
                <Button size="lg" variant="success" onClick={() => setStep(totalSteps)}>Continue</Button>
              </div>
            </footer>
          )}
        </div>
      )}

      {step === totalSteps && summary && (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
          <div className="animate-pop w-full max-w-md text-center">
            <Mascot expression={summary.perfect ? 'excited' : 'happy'} size={170} float className="mx-auto" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">{summary.first ? 'Lesson complete' : 'Practice complete'}</h1>
            <p className="mt-1 text-sm text-mute">{lesson.title}</p>
            <dl className="mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-card text-left">
              <div className="border-r border-line p-4"><dt className="text-xs text-mute">XP earned</dt><dd className="tnum mt-1 flex items-center gap-1 text-xl font-semibold text-gold"><Zap size={16} fill="currentColor" />+{summary.xp}</dd></div>
              <div className="border-r border-line p-4"><dt className="text-xs text-mute">Accuracy</dt><dd className="tnum mt-1 text-xl font-semibold">{summary.accuracy}%</dd></div>
              <div className="p-4"><dt className="text-xs text-mute">Bonus</dt><dd className="mt-1 text-xl font-semibold">{summary.perfect && summary.first ? <span className="text-ok">Perfect</span> : <span className="text-faint">—</span>}</dd></div>
            </dl>
            <div className="mt-7 flex flex-col gap-2.5">
              {upNext ? (
                <Button size="lg" onClick={() => navigate(stepPath(upNext))}>Next: {stepTitle(upNext)}<ArrowRight size={17} /></Button>
              ) : null}
              <LinkButton to={`/learn/${course.id}`} variant="secondary" size="lg">Back to the path</LinkButton>
            </div>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  )
}
