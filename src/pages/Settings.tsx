import { Download, LogOut, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Modal, PageHeader, Panel, cx } from '../components/ui'
import { DAILY_GOALS } from '../lib/gamification'
import { useApp } from '../state/AppContext'

const USERNAME = /^[A-Za-z0-9_]{3,20}$/
const GOAL_LABEL: Record<number, string> = { 20: 'Casual', 50: 'Regular', 100: 'Serious', 150: 'Intense' }

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5 last:border-b-0">
      <div className="min-w-0 max-w-md"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-[13px] text-mute">{hint}</p></div>
      {children}
    </div>
  )
}

export function Settings() {
  const { state, patch, cloud, signOut, resetProgress, notify, syncError } = useApp()
  const [name, setName] = useState(state.username)
  const [nameError, setNameError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'reset' | 'leave' | null>(null)

  const saveName = (event: FormEvent) => {
    event.preventDefault()
    const next = name.trim()
    if (!USERNAME.test(next)) {
      setNameError('Use 3–20 letters, numbers or underscores.')
      return
    }
    setNameError(null)
    patch({ username: next })
    notify({ kind: 'info', title: 'Username updated' })
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pyquest-progress-${state.username}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const leave = async () => {
    setConfirm(null)
    try {
      await signOut()
    } catch (err) {
      notify({ kind: 'error', title: 'Could not sign out', body: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />

      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">Account</h2>
      <Panel className="mb-7">
        <Row title="Username" hint="Shown on leaderboards and in duels.">
          <form onSubmit={saveName} className="flex items-start gap-2">
            <div>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} aria-label="Username" aria-invalid={nameError !== null} className="h-10 w-48 rounded-[10px] border border-line bg-bg px-3 text-sm outline-none focus:border-sky" />
              {nameError && <p className="mt-1 text-xs text-bad" role="alert">{nameError}</p>}
            </div>
            <Button type="submit" variant="secondary" disabled={name.trim() === state.username}>Save</Button>
          </form>
        </Row>
        <Row title="Storage" hint={cloud ? 'Your progress syncs to your account and is available on any device.' : 'Your progress is stored in this browser only. Clearing site data will erase it.'}>
          <span className={cx('rounded-md border px-2.5 py-1 text-xs font-semibold', syncError ? 'border-bad/40 text-bad' : 'border-line text-mute')}>{syncError ? 'Not saving' : cloud ? 'Cloud sync on' : 'Local profile'}</span>
        </Row>
      </Panel>

      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">Learning</h2>
      <Panel className="mb-7">
        <Row title="Daily goal" hint="How much XP you aim to earn each day. A lesson is worth 20–30 XP.">
          <div className="flex gap-1.5" role="radiogroup" aria-label="Daily goal">
            {DAILY_GOALS.map((goal) => (
              <button key={goal} role="radio" aria-checked={state.dailyGoal === goal} onClick={() => patch({ dailyGoal: goal })} className={cx('rounded-[10px] border px-3 py-1.5 text-center transition-colors', state.dailyGoal === goal ? 'border-sky bg-raised' : 'border-line hover:border-sky/50')}>
                <span className="tnum block text-sm font-semibold">{goal} XP</span>
                <span className="block text-[11px] text-mute">{GOAL_LABEL[goal]}</span>
              </button>
            ))}
          </div>
        </Row>
        <Row title="Streak freezes" hint="A freeze is used automatically to protect your streak when you miss a day. Earn more at 7, 30 and 100-day streaks.">
          <span className="tnum text-xl font-semibold">{state.freezes}</span>
        </Row>
      </Panel>

      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">Your data</h2>
      <Panel>
        <Row title="Export progress" hint="Download everything PyQuest has recorded about your learning as a JSON file.">
          <Button variant="secondary" onClick={exportData}><Download size={15} />Export</Button>
        </Row>
        <Row title="Reset progress" hint="Erase all XP, lessons, streaks and achievements and start again. This cannot be undone.">
          <Button variant="danger" onClick={() => setConfirm('reset')}><Trash2 size={15} />Reset</Button>
        </Row>
        <Row title={cloud ? 'Sign out' : 'Delete local profile'} hint={cloud ? 'Your progress stays saved in your account.' : 'Removes this profile and all of its progress from this browser.'}>
          <Button variant={cloud ? 'secondary' : 'danger'} onClick={() => (cloud ? void leave() : setConfirm('leave'))}><LogOut size={15} />{cloud ? 'Sign out' : 'Delete profile'}</Button>
        </Row>
      </Panel>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)}>
        <h2 className="text-lg font-semibold">{confirm === 'reset' ? 'Reset all progress?' : 'Delete this profile?'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {confirm === 'reset'
            ? `This erases ${state.xp.toLocaleString()} XP, every completed lesson, your streak and your achievements. It cannot be undone.`
            : 'This removes the profile and all of its progress from this browser. It cannot be undone — export first if you want a copy.'}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm === 'reset') { resetProgress(); setConfirm(null) } else void leave() }}>{confirm === 'reset' ? 'Yes, reset' : 'Yes, delete'}</Button>
        </div>
      </Modal>
    </div>
  )
}
