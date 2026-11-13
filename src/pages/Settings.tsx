import { Download, LogOut, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { GoalPicker } from '../components/GoalPicker'
import { Button, Modal, PageHeader, Panel, cx } from '../components/ui'
import { ThemePicker } from '../components/ThemePicker'
import { notificationPermission, requestNotifications, showNotification } from '../lib/notify'
import type { Permission } from '../lib/notify'
import { fetchReminderPref, setReminderPref, signedInEmail } from '../lib/repo'
import { REMINDER_HOUR } from '../lib/useDailyReminder'
import { useApp } from '../state/AppContext'

const USERNAME = /^[A-Za-z0-9_]{3,20}$/

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-line px-6 py-5 last:border-b-0">
      <div className="min-w-0 max-w-md"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-[13px] text-mute">{hint}</p></div>
      {children}
    </div>
  )
}

export function Settings() {
  const { state, patch, rename, cloud, userId, signOut, deleteLocalAccount, resetProgress, notify, syncError } = useApp()
  const [name, setName] = useState(state.username)
  const [nameError, setNameError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'reset' | 'leave' | null>(null)
  const [reminders, setReminders] = useState<boolean | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [permission, setPermission] = useState<Permission>(notificationPermission)
  const practiceReminders = state.profile.reminders && permission === 'granted'

  const enablePracticeReminders = async () => {
    const result = await requestNotifications()
    setPermission(result)
    if (result !== 'granted') return
    patch({ profile: { ...state.profile, reminders: true } })
    void showNotification('Reminders are on', 'I will nudge you to practise in the evening if you have not reached your goal.')
  }

  useEffect(() => {
    if (!cloud || !userId) return
    let cancelled = false
    Promise.all([fetchReminderPref(userId), signedInEmail()]).then(
      ([on, address]) => {
        if (cancelled) return
        setReminders(on)
        setEmail(address)
      },
      (err: unknown) => notify({ kind: 'error', title: 'Could not load reminder settings', body: err instanceof Error ? err.message : undefined }),
    )
    return () => {
      cancelled = true
    }
  }, [cloud, userId, notify])

  const toggleReminders = async () => {
    if (!userId || reminders === null) return
    const next = !reminders
    setReminders(next)
    try {
      await setReminderPref(userId, next)
    } catch (err) {
      setReminders(!next)
      notify({ kind: 'error', title: 'Could not change reminders', body: err instanceof Error ? err.message : undefined })
    }
  }

  const saveName = (event: FormEvent) => {
    event.preventDefault()
    const next = name.trim()
    if (!USERNAME.test(next)) {
      setNameError('Use 3–20 letters, numbers or underscores.')
      return
    }
    try {
      rename(next)
      setNameError(null)
      notify({ kind: 'info', title: 'Username updated', body: cloud ? undefined : 'Use the new name next time you log in.' })
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not change the username.')
    }
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `coquest-progress-${state.username}.json`
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
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} aria-label="Username" aria-invalid={nameError !== null} className="h-10 w-48 rounded-[10px] border-2 border-line bg-surface px-3 text-sm outline-none focus:border-sky" />
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
        <div className="border-b-2 border-line px-6 py-5">
          <p className="text-sm font-semibold">Daily goal</p>
          <p className="mt-0.5 text-[13px] text-mute">How much XP you aim to earn each day. A lesson is worth 20–30 XP.</p>
          <div className="mt-4 max-w-md">
            <GoalPicker value={state.dailyGoal} onChange={(goal) => { if (goal !== null) patch({ dailyGoal: goal }) }} />
          </div>
        </div>
        <Row title="Practice reminders" hint={`A notification after ${REMINDER_HOUR}:00 if you have not reached your daily goal. Works while CoQuest is open in a browser tab.`}>
          {permission === 'unsupported' || permission === 'denied' ? (
            <span className="rounded-md border-2 border-line px-2.5 py-1 text-xs font-semibold text-mute">{permission === 'denied' ? 'Blocked in your browser' : 'Not supported here'}</span>
          ) : (
            <button role="switch" aria-checked={practiceReminders} aria-label="Practice reminders" onClick={() => (practiceReminders ? patch({ profile: { ...state.profile, reminders: false } }) : void enablePracticeReminders())} className={cx('relative h-8 w-14 shrink-0 rounded-full transition-colors', practiceReminders ? 'bg-blue' : 'bg-line')}>
              <span className={cx('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]', practiceReminders ? 'left-7' : 'left-1')} />
            </button>
          )}
        </Row>
        <Row
          title="Email reminders"
          hint={cloud ? `A nudge about every 3 days, sent through Gmail${email ? ` to ${email}` : ''}.` : 'Reminder emails need the Supabase project connected and a Google or email account.'}
        >
          {cloud ? (
            <button role="switch" aria-checked={reminders === true} aria-label="Email reminders" disabled={reminders === null} onClick={() => void toggleReminders()} className={cx('relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50', reminders ? 'bg-blue' : 'bg-line')}>
              <span className={cx('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]', reminders ? 'left-7' : 'left-1')} />
            </button>
          ) : (
            <span className="rounded-md border-2 border-line px-2.5 py-1 text-xs font-semibold text-mute">Not available</span>
          )}
        </Row>
        <Row title="Appearance" hint="Light, dark, or follow your device.">
          <ThemePicker />
        </Row>
        <Row title="Welcome tour" hint="Meet QUEST again and choose your language, reason, level and daily goal afresh.">
          <Button variant="secondary" onClick={() => patch({ onboarded: false })}>Replay</Button>
        </Row>
        <Row title="Streak freezes" hint="A freeze is used automatically to protect your streak when you miss a day. Earn more at 7, 30 and 100-day streaks.">
          <span className="tnum text-xl font-semibold">{state.freezes}</span>
        </Row>
      </Panel>

      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">Your data</h2>
      <Panel>
        <Row title="Export progress" hint="Download everything CoQuest has recorded about your learning as a JSON file.">
          <Button variant="secondary" onClick={exportData}><Download size={15} />Export</Button>
        </Row>
        <Row title="Reset progress" hint="Erase all XP, lessons, streaks and achievements and start again. This cannot be undone.">
          <Button variant="danger" onClick={() => setConfirm('reset')}><Trash2 size={15} />Reset</Button>
        </Row>
        <Row title="Sign out" hint={cloud ? 'Your progress stays saved in your account.' : 'Your progress stays saved in this browser. Log in again with your username and password.'}>
          <Button variant="secondary" onClick={() => void leave()}><LogOut size={15} />Sign out</Button>
        </Row>
        {!cloud && (
          <Row title="Delete account" hint="Removes this account, its password and all of its progress from this browser.">
            <Button variant="danger" onClick={() => setConfirm('leave')}><Trash2 size={15} />Delete</Button>
          </Row>
        )}
      </Panel>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)}>
        <h2 className="text-lg font-semibold">{confirm === 'reset' ? 'Reset all progress?' : 'Delete this account?'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {confirm === 'reset'
            ? `This erases ${state.xp.toLocaleString()} XP, every completed lesson, your streak and your achievements. It cannot be undone.`
            : `This removes ${state.username}, its password and all of its progress from this browser. It cannot be undone — export first if you want a copy.`}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm === 'reset') { resetProgress(); setConfirm(null) } else { setConfirm(null); deleteLocalAccount() } }}>{confirm === 'reset' ? 'Yes, reset' : 'Yes, delete'}</Button>
        </div>
      </Modal>
    </div>
  )
}
