import { ArrowLeft, Bell, Briefcase, Code2, Gamepad2, Globe, Rocket } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Confetti } from '../components/Confetti'
import { GoalPicker } from '../components/GoalPicker'
import { LangLogo } from '../components/LangLogo'
import { Mascot } from '../components/Mascot'
import type { Motion } from '../components/Mascot'
import { OptionButton } from '../components/OptionButton'
import { Button, ScreenFooter, cx } from '../components/ui'
import { COURSES, courseById } from '../content'
import { GENERAL_BENEFITS, LEVELS, REASONS, WITH_CODE } from '../content/onboarding'
import { requestNotifications, showNotification } from '../lib/notify'
import type { Expression, LangId } from '../lib/types'
import { useApp } from '../state/AppContext'

/**
 * The welcome flow for new players. QUEST asks a question per screen and reacts with an animation
 * that suits it: waving hello, bouncing with excitement, tilting its head, thinking, cheering.
 */
const STEPS = ['hi', 'excited', 'language', 'why', 'wow', 'level', 'achieve', 'goal', 'remind', 'done'] as const
type Step = (typeof STEPS)[number]

const DEFAULT_GOAL = 50

interface Answers { language: LangId | null; reason: string | null; level: string | null; goal: number | null; reminders: boolean }

// ── Pieces ────────────────────────────────────────────────────────────────
function Bubble({ children, tail, className }: { children: ReactNode; tail: 'left' | 'bottom'; className?: string }) {
  return (
    <div className={cx('animate-pop relative rounded-2xl border-2 border-line bg-card px-5 py-3.5 text-[19px] font-bold leading-snug text-ink', className)}>
      {children}
      <span aria-hidden="true" className={cx('absolute h-4 w-4 rotate-45 border-line bg-card', tail === 'left' ? '-left-[9px] bottom-6 border-b-2 border-l-2' : '-bottom-[9px] left-1/2 -ml-2 border-b-2 border-r-2')} />
    </div>
  )
}

interface SceneProps { expression: Expression; motion: Motion; size?: number; layout: 'row' | 'center'; extras?: ReactNode; children: ReactNode }

/** QUEST and a speech bubble. `row` puts them side by side above a list of answers; `center` stacks them. */
function Scene({ expression, motion, size = 110, layout, extras, children }: SceneProps) {
  const mascot = (
    <div className="relative shrink-0">
      <Mascot expression={expression} motion={motion} size={size} />
      {extras}
    </div>
  )
  if (layout === 'row') {
    return (
      <div className="flex items-end gap-3">
        {mascot}
        <Bubble tail="left" className="mb-4 min-w-0 flex-1">{children}</Bubble>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <Bubble tail="bottom" className="mb-6 max-w-[460px]">{children}</Bubble>
      {mascot}
    </div>
  )
}

function Bars({ level }: { level: number }) {
  return (
    <span className="flex h-6 items-end gap-[3px]" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className="w-[5px] rounded-sm" style={{ height: 6 + n * 4, background: n <= level ? '#2470E8' : 'var(--color-line)' }} />
      ))}
    </span>
  )
}

const FLOATERS = [
  { icon: Rocket, style: { left: '-14%', top: '8%' }, delay: 0 },
  { icon: Gamepad2, style: { right: '-14%', top: '2%' }, delay: 500 },
  { icon: Globe, style: { left: '-18%', top: '58%' }, delay: 1000 },
  { icon: Briefcase, style: { right: '-16%', top: '54%' }, delay: 1500 },
]

/** Icons bobbing around QUEST while it dreams about what code can do. */
function Dreams() {
  return (
    <>
      {FLOATERS.map(({ icon: Icon, style, delay }, i) => (
        <span key={i} className="animate-bob absolute flex h-11 w-11 items-center justify-center rounded-full border-2 border-line bg-card text-blue" style={{ ...style, animationDelay: `${delay}ms` }} aria-hidden="true">
          <Icon size={22} strokeWidth={2.4} />
        </span>
      ))}
    </>
  )
}

const BellBadge = (
  <span className="absolute -right-4 top-1 flex h-14 w-14 items-center justify-center rounded-full border-2 border-line bg-card" aria-hidden="true">
    <Bell className="bell-ring text-gold-dark" size={28} strokeWidth={2.4} fill="currentColor" />
  </span>
)

// ── The flow ──────────────────────────────────────────────────────────────
export function Onboarding() {
  const { patch } = useApp()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({ language: null, reason: null, level: null, goal: DEFAULT_GOAL, reminders: false })
  const [reminderNote, setReminderNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const step: Step = STEPS[index]
  const course = answers.language ? courseById(answers.language) : undefined
  const reason = REASONS.find((r) => r.id === answers.reason)

  const next = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const back = () => setIndex((i) => Math.max(i - 1, 0))
  const set = (change: Partial<Answers>) => setAnswers((a) => ({ ...a, ...change }))

  const canContinue = step === 'language' ? answers.language !== null : step === 'why' ? answers.reason !== null : step === 'level' ? answers.level !== null : step === 'goal' ? answers.goal !== null : true

  const allow = async () => {
    setBusy(true)
    const result = await requestNotifications()
    setBusy(false)
    if (result === 'granted') {
      set({ reminders: true })
      void showNotification('You are all set!', 'I will remind you to practise. See you soon.')
      next()
      return
    }
    setReminderNote(result === 'unsupported' ? 'This browser cannot show notifications.' : 'Notifications are blocked for this site in your browser settings.')
  }

  const finish = () => {
    const language = answers.language ?? 'python'
    patch({ onboarded: true, dailyGoal: answers.goal ?? DEFAULT_GOAL, profile: { language, reason: answers.reason, level: answers.level, reminders: answers.reminders } })
    navigate(`/learn/${language}`, { replace: true })
  }

  const content = ((): ReactNode => {
    switch (step) {
      case 'hi':
        return (
          <Scene layout="center" expression="happy" motion="wave" size={210}>
            <span className="text-[28px]">Hi, I am Quest!</span>
          </Scene>
        )
      case 'excited':
        return (
          <Scene layout="center" expression="excited" motion="jump" size={210} extras={<Confetti />}>
            I am excited to teach you how to code!
          </Scene>
        )
      case 'language':
        return (
          <>
            <Scene layout="row" expression="curious" motion="tilt">What coding language do you want to learn?</Scene>
            <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Coding language">
              {COURSES.map((c) => (
                <OptionButton key={c.id} selected={answers.language === c.id} onClick={() => set({ language: c.id })} icon={<LangLogo lang={c.id} size={32} />} title={c.name} hint={c.tagline} />
              ))}
            </div>
          </>
        )
      case 'why':
        return (
          <>
            <Scene layout="row" expression="thinking" motion="sway">Why are you learning how to code?</Scene>
            <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Reason for learning">
              {REASONS.map((r) => (
                <OptionButton key={r.id} selected={answers.reason === r.id} onClick={() => set({ reason: r.id })} icon={<r.icon size={26} strokeWidth={2.4} />} title={r.label} />
              ))}
            </div>
          </>
        )
      case 'wow':
        return (
          <Scene layout="center" expression="excited" motion="jump" size={190} extras={<Confetti />}>
            <span className="block text-[30px]">Wow!</span>
            <span className="mt-1 block text-[17px] font-semibold text-body">{reason?.wow ?? 'That is a great reason to start.'}</span>
          </Scene>
        )
      case 'level':
        return (
          <>
            <Scene layout="row" expression="curious" motion="nod">How much coding do you know?</Scene>
            <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Coding level">
              {LEVELS.map((l) => (
                <OptionButton key={l.id} selected={answers.level === l.id} onClick={() => set({ level: l.id })} icon={<Bars level={l.bars} />} title={l.label} />
              ))}
            </div>
          </>
        )
      case 'achieve': {
        const rows = [{ icon: Code2, title: `With ${course?.name ?? 'code'} you can…`, body: answers.language ? WITH_CODE[answers.language] : 'Make computers do what you imagine.' }, ...GENERAL_BENEFITS]
        return (
          <>
            <Scene layout="center" expression="happy" motion="float" size={150} extras={<Dreams />}>Here is what you can do with code</Scene>
            <ul className="mt-2 grid gap-3">
              {rows.map((r) => (
                <li key={r.title} className="flex items-center gap-4 rounded-xl border-2 border-line p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue"><r.icon size={26} strokeWidth={2.4} /></span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-bold text-body">{r.title}</span>
                    <span className="block text-[15px] text-mute">{r.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )
      }
      case 'goal':
        return (
          <>
            <Scene layout="row" expression="determined" motion="pump">What is your daily learning goal?</Scene>
            <div className="mt-6"><GoalPicker value={answers.goal} onChange={(goal) => set({ goal })} /></div>
          </>
        )
      case 'remind':
        return (
          <>
            <Scene layout="center" expression="excited" motion="jump" size={190} extras={BellBadge}>
              <span className="block">I will remind you to practise!</span>
              <span className="mt-1 block text-[16px] font-semibold text-mute">A friendly nudge each evening when you have not reached your daily goal.</span>
            </Scene>
            {reminderNote ? (
              <p className="animate-rise mt-2 rounded-xl bg-surface px-4 py-3 text-center text-[15px] font-bold text-body" role="status">{reminderNote} You can turn reminders on later in Settings.</p>
            ) : (
              <p className="mt-2 px-2 text-center text-[13px] text-faint">Reminders appear while CoQuest is open in a browser tab. You can change this any time in Settings.</p>
            )}
          </>
        )
      case 'done':
        return (
          <Scene layout="center" expression="victorious" motion="jump" size={210} extras={<Confetti loop />}>
            <span className="block text-[28px]">That is all!</span>
            <span className="mt-1 block text-[17px] font-semibold text-body">Your first {course?.name ?? 'coding'} lesson is ready.</span>
          </Scene>
        )
    }
  })()

  const wide = 'w-full sm:w-[240px]'

  return (
    <div className="flex h-full flex-col bg-card">
      <header className="mx-auto flex w-full max-w-[1008px] shrink-0 items-center gap-4 px-4 pb-2 pt-6">
        <button onClick={back} aria-label="Back" className={cx('text-faint hover:text-mute', (index === 0 || step === 'done') && 'invisible')}><ArrowLeft size={26} strokeWidth={3} /></button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Welcome progress">
          <div className="relative h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}>
            <span className="absolute inset-x-2 top-[22%] h-[22%] rounded-full bg-white/30" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div key={step} className="animate-rise mx-auto w-full max-w-[600px] px-4 py-6">{content}</div>
      </div>

      <ScreenFooter>
        {step === 'remind' && !reminderNote ? (
          <>
            <Button size="lg" variant="ghost" className="order-2 w-full sm:order-1 sm:w-auto" onClick={next} disabled={busy}>Not now</Button>
            <Button size="lg" className={cx('order-1 sm:order-2 sm:w-[280px]', 'w-full')} onClick={() => void allow()} disabled={busy}>Allow notifications</Button>
          </>
        ) : (
          <>
            <span />
            <Button size="lg" className={wide} onClick={step === 'done' ? finish : next} disabled={!canContinue}>{step === 'done' ? 'Start learning' : 'Continue'}</Button>
          </>
        )}
      </ScreenFooter>
    </div>
  )
}
