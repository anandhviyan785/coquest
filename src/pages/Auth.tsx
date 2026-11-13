import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Wordmark } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui'
import { useApp } from '../state/AppContext'

const USERNAME = /^[A-Za-z0-9_]{3,20}$/

type Step = 'welcome' | 'signup' | 'signin'

const fieldClass = 'h-[50px] w-full rounded-xl border-2 border-line bg-surface px-4 text-[17px] text-ink outline-none placeholder:text-faint focus:border-blue-line'

export function Auth() {
  const { cloud, startLocal, signIn, signUp, syncError } = useApp()
  const [step, setStep] = useState<Step>('welcome')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const go = (next: Step) => {
    setStep(next)
    setError(null)
    setNotice(null)
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
    if (!cloud) {
      startLocal(name)
      return
    }
    if (password.length < 8) {
      setError('Passwords need at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      if (step === 'signin') {
        await signIn(email.trim(), password)
      } else {
        const outcome = await signUp(email.trim(), password, name)
        if (outcome === 'confirm') setNotice('Almost there — check your email for a confirmation link, then log in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

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
          {cloud && <Button size="lg" variant="secondary" className="w-full" onClick={() => go('signin')}>I already have an account</Button>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-4 pb-6 pt-6">
      <button onClick={() => go('welcome')} aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-xl text-faint hover:bg-surface hover:text-mute"><ArrowLeft size={24} strokeWidth={3} /></button>
      <h1 className="mt-2 text-center text-2xl font-bold text-ink">{step === 'signin' ? 'Log in' : 'Create your profile'}</h1>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-3" noValidate>
        {step === 'signup' && (
          <input className={fieldClass} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" aria-label="Username" autoComplete="username" autoFocus maxLength={20} />
        )}
        {step === 'signup' && !cloud && <p className="px-1 text-[13px] leading-relaxed text-mute">Your username is shown on your profile. Progress is saved in this browser.</p>}
        {cloud && (
          <>
            <input className={fieldClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" required />
            <input className={fieldClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" autoComplete={step === 'signup' ? 'new-password' : 'current-password'} required />
          </>
        )}
        {(error ?? syncError) && <p className="rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-bold text-bad-dark" role="alert">{error ?? syncError}</p>}
        {notice && <p className="rounded-xl bg-green-soft px-4 py-3 text-[15px] font-bold text-ok" role="status">{notice}</p>}
        <Button type="submit" variant="blue" size="lg" className="mt-2 w-full" disabled={busy}>
          {busy ? 'One moment…' : step === 'signin' ? 'Log in' : cloud ? 'Create account' : 'Start learning'}
        </Button>
      </form>

      {cloud && (
        <p className="mt-8 text-center text-[15px] font-bold text-body">
          {step === 'signup' ? 'Have an account?' : 'New to PyQuest?'}{' '}
          <button className="label text-[13px] text-blue hover:brightness-90" onClick={() => go(step === 'signup' ? 'signin' : 'signup')}>{step === 'signup' ? 'Log in' : 'Sign up'}</button>
        </p>
      )}
    </div>
  )
}
