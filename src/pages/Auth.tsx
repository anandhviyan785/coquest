import { Flame, Swords, TerminalSquare } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Wordmark } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Button, cx } from '../components/ui'
import { useApp } from '../state/AppContext'

const USERNAME = /^[A-Za-z0-9_]{3,20}$/

const inputClass = 'h-11 w-full rounded-[10px] border border-line bg-bg px-3.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-sky'

const POINTS = [
  { icon: TerminalSquare, text: 'Write and run real code in your browser from the first lesson.' },
  { icon: Flame, text: 'Build a daily streak, earn XP and climb six leagues.' },
  { icon: Swords, text: 'Beat unit bosses and race a friend in live coding duels.' },
]

export function Auth() {
  const { cloud, startLocal, signIn, signUp, syncError } = useApp()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const needsUsername = !cloud || mode === 'signup'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    const name = username.trim()
    if (needsUsername && !USERNAME.test(name)) {
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
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else {
        const outcome = await signUp(email.trim(), password, name)
        if (outcome === 'confirm') setNotice('Almost there — check your email for a confirmation link, then sign in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      <section className="grad-premium relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Wordmark />
        <div>
          <Mascot expression="curious" size={210} float />
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-[1.1] tracking-tight">Learn to code like it&apos;s a game you can&apos;t put down.</h1>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex max-w-md items-start gap-3 text-[15px] text-[#cfe0ff]">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10"><Icon size={15} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-[#9fb6e6]">Python, JavaScript, C++, Java, HTML, CSS and SQL.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Wordmark /></div>
          <h2 className="text-2xl font-semibold tracking-tight">{!cloud ? 'Pick a name to begin' : mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="mt-1.5 text-sm text-mute">
            {!cloud ? 'Your progress is saved in this browser.' : mode === 'signup' ? 'Free, and your progress syncs everywhere.' : 'Sign in to pick up where you left off.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {needsUsername && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-mute">Username</span>
                <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="explorer_ada" autoComplete="username" autoFocus maxLength={20} />
              </label>
            )}
            {cloud && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-mute">Email</span>
                  <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-mute">Password</span>
                  <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
                </label>
              </>
            )}
            {(error ?? syncError) && <p className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-bad" role="alert">{error ?? syncError}</p>}
            {notice && <p className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-[13px] text-ok" role="status">{notice}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {!cloud ? 'Start learning' : busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {cloud ? (
            <p className="mt-6 text-center text-sm text-mute">
              {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
              <button className={cx('font-semibold text-ice hover:underline')} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); setNotice(null) }}>
                {mode === 'signup' ? 'Sign in' : 'Create one'}
              </button>
            </p>
          ) : (
            <p className="mt-6 rounded-xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed text-mute">
              Running in local mode. To add accounts, cloud sync, leaderboards and online duels, add your Supabase keys to <code className="font-mono text-ice">.env</code> — see the README.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
