import { Code2, Eye, EyeOff, Flame, Lock, Mail, TerminalSquare, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { ChangeEvent, FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { LangLogo } from '../components/LangLogo'
import { Wordmark } from '../components/Wordmark'
import { Mascot } from '../components/Mascot'
import { Button, cx } from '../components/ui'
import { COURSES } from '../content'
import { googleConfigured } from '../lib/googleSignIn'
import { useSeo } from '../lib/useSeo'
import { MIN_PASSWORD, isEmail, legacyProfile } from '../lib/localAuth'
import { useApp } from '../state/AppContext'

const USERNAME = /^[A-Za-z0-9_]{3,20}$/
const RETURNING_KEY = 'pyquest:v1:returning'

type Mode = 'signup' | 'login'
interface Errors { username?: string; email?: string; login?: string; password?: string }

const wasHereBefore = (): boolean => {
  try {
    return localStorage.getItem(RETURNING_KEY) === '1'
  } catch {
    return false
  }
}

const rememberVisit = (): void => {
  try {
    localStorage.setItem(RETURNING_KEY, '1')
  } catch (err) {
    console.error('Could not remember this visit', err)
  }
}

const LAST_LOGIN_KEY = 'pyquest:v1:last-login'
const LOGIN_MAX = 254

/** The email or username this browser last logged in with (never a password). */
const lastLogin = (): string => {
  try {
    return (localStorage.getItem(LAST_LOGIN_KEY) ?? '').slice(0, LOGIN_MAX)
  } catch {
    return ''
  }
}

const rememberLogin = (login: string): void => {
  try {
    localStorage.setItem(LAST_LOGIN_KEY, login.slice(0, LOGIN_MAX))
  } catch (err) {
    console.error('Could not remember the login name', err)
  }
}

/** Password strength for the sign-up meter: how many of four simple habits it has. */
const strength = (password: string): { filled: number; label: string; color: string } => {
  if (password.length < MIN_PASSWORD) return { filled: 1, label: 'Too short', color: 'var(--color-bad)' }
  const habits = [/[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password) || password.length >= 14].filter(Boolean).length
  return [
    { filled: 1, label: 'Weak', color: 'var(--color-bad)' },
    { filled: 2, label: 'Okay', color: 'var(--color-flame)' },
    { filled: 3, label: 'Good', color: 'var(--color-gold)' },
    { filled: 4, label: 'Strong', color: 'var(--color-green)' },
  ][habits]
}

// ── Pieces ────────────────────────────────────────────────────────────────
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; icon: LucideIcon; error?: string; trailing?: ReactNode }

function Field({ label, icon: Icon, error, trailing, ...input }: FieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-mute">{label}</label>
      <div className={cx('flex h-[52px] items-center gap-3 rounded-xl border-2 px-4 transition-colors focus-within:border-blue-line focus-within:bg-card', error ? 'border-bad bg-bad-soft/40' : 'border-line bg-surface')}>
        <Icon size={19} strokeWidth={2.4} className="shrink-0 text-faint" aria-hidden="true" />
        <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="bare-focus h-full min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-faint" {...input} />
        {trailing}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-[13px] font-bold text-bad-dark" role="alert">{error}</p>}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
    </svg>
  )
}

const POINTS: Array<{ icon: LucideIcon; text: string }> = [
  { icon: TerminalSquare, text: 'Write and run real code in your browser from the very first lesson.' },
  { icon: Flame, text: 'Build streaks, earn XP and beat bosses that keep you coming back.' },
  { icon: Code2, text: 'Seven languages, one friendly guide to take you through them.' },
]

/** The brand half of the page, shown beside the form on wide screens. */
function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-blue-soft p-12 lg:flex">
      <span className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/60" aria-hidden="true" />
      <span className="absolute -bottom-16 -left-20 h-64 w-64 rounded-full bg-white/50" aria-hidden="true" />
      <div className="relative"><Wordmark size={32} /></div>
      <div className="relative">
        <Mascot expression="happy" motion="wave" size={220} />
        <h1 className="mt-6 max-w-md text-[34px] font-extrabold leading-[1.15] tracking-tight text-ink">The free, fun and effective way to learn to code.</h1>
        <ul className="mt-8 max-w-md space-y-4">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3.5 text-[16px] font-medium leading-snug text-body">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-blue"><Icon size={19} strokeWidth={2.4} /></span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative flex items-center gap-3">
        {COURSES.map((c) => <span key={c.id} className="flex h-11 w-11 items-center justify-center rounded-xl bg-card"><LangLogo lang={c.id} size={26} /></span>)}
      </div>
    </aside>
  )
}

// ── The page ──────────────────────────────────────────────────────────────
export function Auth() {
  const { cloud, signIn, signUp, signInWithGoogle, syncError } = useApp()
  const { search, pathname } = useLocation()
  useSeo({ title: 'Log in to CoQuest', description: 'Log in or create a free CoQuest account.', path: pathname, noindex: true })
  const legacy = useMemo(() => (cloud ? null : legacyProfile()), [cloud])
  const [mode, setMode] = useState<Mode>(() => (new URLSearchParams(search).has('signup') || !wasHereBefore() ? 'signup' : 'login'))
  const [username, setUsername] = useState(() => legacy?.username ?? '')
  const [email, setEmail] = useState('')
  // Players who signed out find their email or username already filled in.
  const [login, setLogin] = useState(lastLogin)
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signingUp = mode === 'signup'

  /** Updates a field and clears its error straight away, so a fixed mistake stops being flagged. */
  const edit = (key: keyof Errors, set: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    set(event.target.value)
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }
  const meter = signingUp && password ? strength(password) : null

  const go = (next: Mode) => {
    setMode(next)
    setPassword('')
    setShown(false)
    setErrors({})
    setFormError(null)
    setNotice(null)
  }

  const validate = (): Errors => {
    const found: Errors = {}
    if (signingUp) {
      if (!USERNAME.test(username.trim())) found.username = 'Use 3–20 letters, numbers or underscores.'
      if (!isEmail(email)) found.email = 'Enter a valid email address.'
      if (password.length < MIN_PASSWORD) found.password = `Use at least ${MIN_PASSWORD} characters.`
    } else {
      if (!login.trim()) found.login = cloud ? 'Enter your email.' : 'Enter your email or username.'
      else if (cloud && !isEmail(login)) found.login = 'Enter the email you signed up with.'
      if (!password) found.password = 'Enter your password.'
    }
    return found
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setNotice(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      rememberVisit()
      if (signingUp) {
        const outcome = await signUp(email.trim(), password, username.trim())
        rememberLogin(cloud ? email.trim() : username.trim())
        if (outcome === 'confirm') setNotice('Almost there. Check your email for a confirmation link, then log in.')
      } else {
        await signIn(login.trim(), password)
        rememberLogin(login.trim())
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setFormError(null)
    if (!cloud && !googleConfigured) {
      setFormError('Google sign-in is not switched on for this copy of CoQuest yet. Use your email for now.')
      return
    }
    setBusy(true)
    try {
      rememberVisit()
      await signInWithGoogle()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not reach Google. Try again.')
      setBusy(false)
    }
  }

  const passwordToggle = (
    <button type="button" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue hover:bg-blue-soft">
      {shown ? <EyeOff size={19} strokeWidth={2.4} /> : <Eye size={19} strokeWidth={2.4} />}
    </button>
  )

  return (
    <div className="grid min-h-full bg-card lg:grid-cols-[minmax(0,1fr)_minmax(480px,580px)]">
      <BrandPanel />

      <main className="flex flex-col justify-center bg-surface/60 px-5 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-[420px] rounded-3xl border-2 border-line bg-card p-6 shadow-[0_12px_40px_-16px_rgba(28,176,246,0.35)] sm:p-8">
          <div className="mb-6 flex flex-col items-center lg:hidden">
            <Wordmark size={30} />
            <Mascot expression="happy" motion="wave" size={104} className="mt-3" />
          </div>

          <h2 className="text-[28px] font-extrabold tracking-tight text-ink">{signingUp ? 'Create your account' : 'Welcome back'}</h2>
          <p className="mb-6 mt-1 text-[16px] text-mute">{signingUp ? 'It is free, and takes under a minute.' : 'Log in to keep your streak going.'}</p>

          <div role="tablist" aria-label="Sign up or log in" className="mb-6 grid grid-cols-2 rounded-xl bg-surface p-1">
            {(['signup', 'login'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => go(m)} className={cx('h-10 rounded-lg text-[14px] font-bold transition-colors', mode === m ? 'bg-card text-blue ring-2 ring-line' : 'text-mute hover:text-body')}>
                {m === 'signup' ? 'Sign up' : 'Log in'}
              </button>
            ))}
          </div>

          <Button size="lg" variant="secondary" className="w-full !text-body" onClick={() => void google()} disabled={busy}><GoogleMark />Continue with Google</Button>
          <div className="my-5 flex items-center gap-3 text-[12px] font-bold uppercase tracking-wider text-faint"><span className="h-0.5 flex-1 rounded-full bg-line" />or use email<span className="h-0.5 flex-1 rounded-full bg-line" /></div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {signingUp ? (
              <>
                <Field label="Email" icon={Mail} type="email" value={email} onChange={edit('email', setEmail)} placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email} autoFocus />
                <Field label="Username" icon={User} value={username} onChange={edit('username', setUsername)} placeholder="explorer_ada" autoComplete="username" maxLength={20} error={errors.username} />
              </>
            ) : (
              <Field label={cloud ? 'Email' : 'Email or username'} icon={cloud ? Mail : User} value={login} onChange={edit('login', setLogin)} placeholder={cloud ? 'you@example.com' : 'Email or username'} autoComplete="username" error={errors.login} autoFocus />
            )}

            <div>
              <Field label="Password" icon={Lock} type={shown ? 'text' : 'password'} value={password} onChange={edit('password', setPassword)} placeholder={signingUp ? `At least ${MIN_PASSWORD} characters` : 'Your password'} autoComplete={signingUp ? 'new-password' : 'current-password'} error={errors.password} trailing={passwordToggle} />
              {meter && (
                <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
                  <div className="flex flex-1 gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((n) => <span key={n} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: n <= meter.filled ? meter.color : 'var(--color-line)' }} />)}
                  </div>
                  <span className="w-16 text-right text-[12px] font-bold" style={{ color: meter.color }}>{meter.label}</span>
                </div>
              )}
            </div>

            {formError ?? syncError ? <p className="rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-bold text-bad-dark" role="alert">{formError ?? syncError}</p> : null}
            {notice && <p className="rounded-xl bg-green-soft px-4 py-3 text-[15px] font-bold text-ok" role="status">{notice}</p>}

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>{busy ? 'One moment…' : signingUp ? 'Create account' : 'Log in'}</Button>
          </form>

          <p className="mt-6 text-center text-[15px] text-mute">
            {signingUp ? 'Already have an account? ' : 'New to CoQuest? '}
            <button type="button" onClick={() => go(signingUp ? 'login' : 'signup')} className="font-bold text-blue hover:underline">{signingUp ? 'Log in' : 'Create an account'}</button>
          </p>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-faint">
            {cloud
              ? signingUp ? 'Your progress is saved to your account and follows you to any device.' : 'Your progress is saved to your account.'
              : 'Your account and progress are saved on this device only.'}
            {signingUp && legacy && <> Signing up as <span className="font-bold text-mute">{legacy.username}</span> keeps the progress already saved here.</>}
          </p>
        </div>
      </main>
    </div>
  )
}
