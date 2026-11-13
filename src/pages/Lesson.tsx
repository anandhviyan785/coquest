import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BoltIcon, GemIcon } from '../components/icons'
import { Toasts, useRewardToasts } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Button, Code, LinkButton, Prose, ScreenFooter as LessonFooter, cx } from '../components/ui'
import { Workbench } from '../components/Workbench'
import type { CheckSummary } from '../components/Workbench'
import { findLesson, isUnlocked, nextStep, stepPath, stepTitle } from '../content'
import { XP, gemsForXp } from '../lib/gamification'
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
  const answerText = question.type === 'choice' ? question.options[question.answer] : question.answers[0]

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[600px] px-4 py-8">
          <div className="flex items-end gap-3">
            <Mascot expression={verdict === null ? 'thinking' : verdict ? 'happy' : 'disappointed'} size={96} className="shrink-0" />
            <h1 className="relative mb-3 rounded-2xl border-2 border-line px-4 py-3 text-[19px] font-bold leading-snug text-ink">{question.prompt}</h1>
          </div>

          {question.type === 'choice' ? (
            <>
              {question.code && <Code code={question.code} className="mt-6" />}
              <div className="mt-6 grid gap-3" role="radiogroup">
                {question.options.map((option, i) => {
                  const isAnswer = verdict !== null && i === question.answer
                  const isWrongPick = verdict === false && i === picked
                  const selected = picked === i
                  return (
                    <button
                      key={option}
                      role="radio"
                      aria-checked={selected}
                      disabled={verdict !== null}
                      onClick={() => setPicked(i)}
                      className={cx(
                        'flex min-h-[60px] items-center gap-4 rounded-xl border-2 border-b-4 px-4 py-3 text-left transition-colors enabled:active:translate-y-0.5 enabled:active:border-b-2',
                        isAnswer ? 'border-green bg-green-soft text-ok' : isWrongPick ? 'border-bad bg-bad-soft text-bad-dark' : selected ? 'border-blue-line bg-blue-soft text-blue' : 'border-line bg-card text-body enabled:hover:bg-surface',
                      )}
                    >
                      <span className={cx('tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-[15px] font-bold', isAnswer ? 'border-green' : isWrongPick ? 'border-bad' : selected ? 'border-blue-line' : 'border-line text-faint')}>{i + 1}</span>
                      <span className="whitespace-pre-wrap font-mono text-[15px] font-semibold">{option}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <pre className="mt-6 overflow-x-auto rounded-xl border-2 border-line bg-surface px-4 py-4 font-mono text-[15px] leading-loose text-ink">
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
                className={cx('mx-0.5 rounded-lg border-2 bg-card px-2 py-0.5 text-center font-mono font-bold outline-none', verdict === true ? 'border-green text-ok' : verdict === false ? 'border-bad text-bad-dark' : 'border-blue-line text-blue')}
              />
              {after}
            </pre>
          )}
        </div>
      </div>

      {verdict === null ? (
        <LessonFooter>
          <span />
          <Button size="lg" className="w-full sm:w-[150px]" onClick={submit} disabled={!ready}>Check</Button>
        </LessonFooter>
      ) : (
        <LessonFooter tone={verdict ? 'good' : 'bad'}>
          <div className="animate-rise min-w-0" role="status">
            <p className={cx('text-2xl font-bold', verdict ? 'text-ok' : 'text-bad-dark')}>{verdict ? 'Nice!' : 'Correct solution:'}</p>
            {!verdict && <p className="mt-1 font-mono text-[15px] font-semibold text-bad-dark">{answerText}</p>}
            <p className={cx('mt-1 text-[15px]', verdict ? 'text-ok' : 'text-bad-dark')}>{question.explain}</p>
          </div>
          <Button size="lg" variant={verdict ? 'primary' : 'danger'} className="w-full sm:w-[150px]" onClick={onNext}>Continue</Button>
        </LessonFooter>
      )}
    </>
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
  const startedAt = useRef(0)
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

  if (!ref) return <Navigate to="/" replace />
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
  const finished = step === totalSteps

  return (
    <div className="flex h-full flex-col bg-card">
      {!finished && (
        <header className="mx-auto flex w-full max-w-[1008px] shrink-0 items-center gap-4 px-4 pb-2 pt-6">
          <Link to={`/learn/${course.id}`} aria-label="Leave lesson" className="text-faint hover:text-mute"><X size={26} strokeWidth={3} /></Link>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={totalSteps}>
            <div className="relative h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${Math.max(4, (step / totalSteps) * 100)}%` }}>
              <span className="absolute inset-x-2 top-[22%] h-[22%] rounded-full bg-white/30" />
            </div>
          </div>
        </header>
      )}

      {step === 0 && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[600px] px-4 py-8">
              <div className="flex items-end gap-3">
                <Mascot expression="curious" size={96} className="shrink-0" />
                <div className="mb-3">
                  <p className="label text-[13px] text-blue">{course.name} · {ref.unit.title}</p>
                  <h1 className="mt-1 text-2xl font-bold text-ink">{lesson.title}</h1>
                </div>
              </div>
              <div className="mt-6 space-y-4">{lesson.explain.map((p) => <Prose key={p} text={p} />)}</div>
              <p className="label mb-2 mt-7 text-[13px] text-faint">Example</p>
              <Code code={lesson.example.code} />
              {lesson.example.output && (
                <>
                  <p className="label mb-2 mt-5 text-[13px] text-faint">Output</p>
                  <Code code={lesson.example.output} className="!border-green-soft !bg-green-soft/40 !text-ok" />
                </>
              )}
            </div>
          </div>
          <LessonFooter>
            <span />
            <Button size="lg" className="w-full sm:w-[150px]" onClick={() => setStep(1)}>Continue</Button>
          </LessonFooter>
        </>
      )}

      {step >= 1 && step < exerciseStep && <QuestionStep key={step} question={lesson.questions[step - 1]} onAnswered={record} onNext={() => setStep(step + 1)} />}

      {step === exerciseStep && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[860px] px-4 py-8">
              <p className="label mb-3 text-[13px] text-purple-dark">Your turn · coding exercise</p>
              <Workbench lang={course.id} exercise={lesson.exercise} onCheck={onCheck} />
            </div>
          </div>
          {solved && (
            <LessonFooter tone="good">
              <p className="animate-rise text-2xl font-bold text-ok" role="status">Excellent! Every test passed.</p>
              <Button size="lg" className="w-full sm:w-[150px]" onClick={() => setStep(totalSteps)}>Continue</Button>
            </LessonFooter>
          )}
        </>
      )}

      {finished && summary && (
        <>
          <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10">
            <div className="animate-pop w-full max-w-[420px] text-center">
              <Mascot expression={summary.perfect ? 'excited' : 'happy'} size={190} float className="mx-auto" />
              <h1 className="mt-4 text-[28px] font-bold text-gold-dark">{summary.first ? 'Lesson complete!' : 'Practice complete!'}</h1>
              <p className="mt-1 text-[17px] text-mute">{lesson.title}</p>
              <dl className="mt-7 grid grid-cols-3 gap-3">
                {[
                  { label: 'Total XP', value: <><BoltIcon size={22} />{summary.xp}</>, color: '#FFC800' },
                  { label: 'Gems', value: <><GemIcon size={22} />{gemsForXp(summary.xp)}</>, color: '#1CB0F6' },
                  { label: summary.perfect ? 'Perfect' : 'Accuracy', value: `${summary.accuracy}%`, color: '#2B70C9' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border-2 p-0.5" style={{ borderColor: item.color, background: item.color }}>
                    <dt className="label py-1 text-[11px] text-white">{item.label}</dt>
                    <dd className="tnum flex h-14 items-center justify-center gap-1.5 rounded-[13px] bg-card text-xl font-bold" style={{ color: item.color }}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <LessonFooter>
            <LinkButton to={`/learn/${course.id}`} variant="secondary" size="lg" className="w-full sm:w-auto">Back to the path</LinkButton>
            {upNext ? <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate(stepPath(upNext))}>Next: {stepTitle(upNext)}</Button> : <span />}
          </LessonFooter>
        </>
      )}
      <Toasts />
    </div>
  )
}
