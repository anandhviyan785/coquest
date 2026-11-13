import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent, InputHTMLAttributes } from 'react'
import { Wordmark } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui'
import { MIN_PASSWORD, legacyProfile } from '../lib/localAuth'
import { useApp } from '../state/AppContext'

const USERNAME = /^[A-Za-z0-9_]{3,20}$/

type Step = 'welcome' | 'signup' | 'login'

const fieldClass = 'h-[50px] w-full rounded-xl border-2 border-line bg-surface px-4 text-[17px] text-ink outline-none placeholder:text-faint focus:border-blue-line'

/** The multicolour Google "G", drawn from Google's sign-in button guidelines. */
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

function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldClass} {...props} />
}

function PasswordField({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <input className={`${fieldClass} pr-12`} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Password" aria-label="Password" autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-blue hover:bg-blue-soft">
        {shown ? <EyeOff size={20} strokeWidth={2.4} /> : <Eye size={20} strokeWidth={2.4} />}
      </button>
    </div>
  )
}

export function Auth() {
  const { cloud, signIn, signUp, signInWithGoogle, syncError } = useApp()
  const legacy = useMemo(() => (cloud ? null : legacyProfile()), [cloud])
  const [step, setStep] = useState<Step>('welcome')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const go = (next: Step) => {
    setStep(next)
    setPassword('')
    setError(null)
    setNotice(null)
    if (next === 'signup' && legacy && !username) setUsername(legacy.username)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    const name = username.trim()
    if (step === 'signup' && !USERNAME.test(name)) {
      setError('Usernames are 3–20 characters: letters, numbers and underscores.')
      return
    }
    if (step === 'login' && !cloud && !name) {
      setError('Enter your username.')
      return
    }
    if (step === 'signup' && password.length < MIN_PASSWORD) {
      setError(`Passwords need at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }
    setBusy(true)
    try {
      if (step === 'login') {
        await signIn(cloud ? email.trim() : name, password)
      } else {
        const outcome = await signUp(email.trim(), password, name)
        if (outcome === 'confirm') setNotice('Almost there — check your email for a confirmation link, then log in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach Google. Try again.')
      setBusy(false)
    }
  }

  const googleButton = cloud && (
    <Button size="lg" variant="secondary" className="w-full !text-body" onClick={() => void google()} disabled={busy}>
      <GoogleMark />Continue with Google
    </Button>
  )

  if (step === 'welcome') {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-4 pb-6 pt-8">
        <div className="flex justify-center"><Wordmark size={32} /></div>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <Mascot expression="excited" size={210} float />
          <h1 className="mt-6 text-[26px] font-bold leading-snug text-ink">The free, fun, and effective way to learn to code!</h1>
        </div>
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => go('signup')}>Get started</Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => go('login')}>I already have an account</Button>
          {googleButton}
          {error && <p className="rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-bold text-bad-dark" role="alert">{error}</p>}
        </div>
      </div>
    )
  }

  const signingUp = step === 'signup'

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-4 pb-6 pt-6">
      <button onClick={() => go('welcome')} aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-xl text-faint hover:bg-surface hover:text-mute"><ArrowLeft size={24} strokeWidth={3} /></button>
      <h1 className="mt-2 text-center text-2xl font-bold text-ink">{signingUp ? 'Create your profile' : 'Log in'}</h1>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-3" noValidate>
        {(signingUp || !cloud) && (
          <Field value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" aria-label="Username" autoComplete="username" autoFocus maxLength={20} />
        )}
        {cloud && <Field type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" autoFocus={!signingUp} required />}
        <PasswordField value={password} onChange={setPassword} autoComplete={signingUp ? 'new-password' : 'current-password'} />

        {signingUp && (
          <p className="px-1 text-[13px] leading-relaxed text-mute">
            {cloud
              ? `Use at least ${MIN_PASSWORD} characters. Your progress syncs to your account.`
              : `Use at least ${MIN_PASSWORD} characters. Your account and progress are saved in this browser only.`}
            {legacy && !cloud && <> Signing up as <span className="font-bold text-body">{legacy.username}</span> keeps the progress already saved here.</>}
          </p>
        )}

        {(error ?? syncError) && <p className="rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-bold text-bad-dark" role="alert">{error ?? syncError}</p>}
        {notice && <p className="rounded-xl bg-green-soft px-4 py-3 text-[15px] font-bold text-ok" role="status">{notice}</p>}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
          {busy ? 'One moment…' : signingUp ? 'Create account' : 'Log in'}
        </Button>
      </form>

      {cloud && (
        <>
          <div className="my-5 flex items-center gap-3 text-[13px] font-bold uppercase text-faint"><span className="h-0.5 flex-1 bg-line" />or<span className="h-0.5 flex-1 bg-line" /></div>
          {googleButton}
        </>
      )}

      <p className="mt-8 text-center text-[15px] font-bold text-body">
        {signingUp ? 'Have an account?' : 'New to PyQuest?'}{' '}
        <button className="label text-[13px] text-blue hover:brightness-90" onClick={() => go(signingUp ? 'login' : 'signup')}>{signingUp ? 'Log in' : 'Sign up'}</button>
      </p>
    </div>
  )
}
