import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { awardAchievements } from '../lib/achievements'
import { dayKey, weekStartOf } from '../lib/dates'
import { applyActivity, levelFromXp, newUserState } from '../lib/gamification'
import type { Activity } from '../lib/gamification'
import { clearLegacyProfile, createAccount, deleteAccount, getSession, legacyProfile, loadAccountState, renameAccount, saveAccountState, setSession, usernameTaken, verifyLogin } from '../lib/localAuth'
import { loadCloud, saveCloud } from '../lib/repo'
import { isCloud, supabase } from '../lib/supabase'
import type { LangId, UserState } from '../lib/types'

type Status = 'loading' | 'signedOut' | 'ready'

export interface EarnResult { xp: number; achievements: string[]; leveledUp: number | null }

export interface Toast { id: number; kind: 'achievement' | 'level' | 'info' | 'error'; title: string; body?: string }

interface AppValue {
  status: Status
  cloud: boolean
  userId: string | null
  state: UserState
  /** Weekly XP for the current week (0 if the stored week has rolled over). */
  weeklyXp: number
  syncError: string | null
  toasts: Toast[]
  dismissToast: (id: number) => void
  notify: (toast: Omit<Toast, 'id'>) => void
  /** Logs in with an email (cloud mode) or a username (local mode) and a password. */
  signIn: (login: string, password: string) => Promise<void>
  /** Creates an account. `email` is ignored in local mode. */
  signUp: (email: string, password: string, username: string) => Promise<'ready' | 'confirm'>
  signOut: () => Promise<void>
  /** Cloud mode only: sends the browser to Google to sign in with a Gmail account. */
  signInWithGoogle: () => Promise<void>
  /** Local mode only: permanently removes the signed-in account and its progress from this browser. */
  deleteLocalAccount: () => void
  /** Changes the username, refusing one another account in this browser already uses. */
  rename: (username: string) => void
  /** Records an XP-earning activity, with an optional extra state change applied first. */
  earn: (activity: Activity, also?: (s: UserState) => UserState) => EarnResult
  /** Adds study time without awarding XP or touching the streak. */
  logTime: (seconds: number, lang?: LangId) => void
  patch: (change: Partial<UserState>) => void
  /** Applies a pure state transition, such as a shop purchase or a quest claim. */
  update: (change: (s: UserState) => UserState) => void
  resetProgress: () => void
}

const AppContext = createContext<AppValue | null>(null)
const SAVE_DELAY_MS = 700
const EMPTY = newUserState('Explorer')

/**
 * The starting username for a new cloud player: the one they chose at sign-up, or for Google
 * sign-ins (which have none) the start of their email address plus a short, stable suffix.
 */
const nameOf = (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | undefined): string => {
  const chosen = user?.user_metadata?.username
  if (typeof chosen === 'string' && chosen) return chosen
  const base = (user?.email ?? '').split('@')[0].replace(/[^A-Za-z0-9_]/g, '').slice(0, 14) || 'explorer'
  return `${base.length >= 3 ? base : 'explorer'}_${(user?.id ?? '0000').replace(/-/g, '').slice(0, 4)}`
}

const messageOf = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong')

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [state, setState] = useState<UserState>(EMPTY)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const stateRef = useRef(state)
  const toastId = useRef(0)

  const commit = useCallback((next: UserState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    toastId.current += 1
    setToasts((list) => [...list, { ...toast, id: toastId.current }])
  }, [])

  const dismissToast = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  // Boot: restore a local profile, or follow the Supabase session.
  useEffect(() => {
    if (!supabase) {
      const id = getSession()
      const saved = id ? loadAccountState(id) : null
      if (id && saved) {
        commit(saved)
        setUserId(id)
        setStatus('ready')
      } else {
        setStatus('signedOut')
      }
      return
    }
    let cancelled = false
    const adopt = async (id: string | null, name: string) => {
      if (!id) {
        setUserId(null)
        setStatus('signedOut')
        return
      }
      try {
        const loaded = await loadCloud(id, name)
        if (cancelled) return
        commit(loaded)
        setUserId(id)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setSyncError(messageOf(err))
        setStatus('signedOut')
      }
    }
    supabase.auth.getSession().then(({ data }) => adopt(data.session?.user.id ?? null, nameOf(data.session?.user)))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void adopt(session?.user.id ?? null, nameOf(session?.user))
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [commit])

  // Persist every change: instantly to this browser in local mode, debounced to Supabase in cloud mode.
  useEffect(() => {
    if (status !== 'ready') return
    if (!isCloud) {
      if (!userId) return
      try {
        saveAccountState(userId, state)
        renameAccount(userId, state.username)
        setSyncError(null)
      } catch (err) {
        setSyncError(messageOf(err))
      }
      return
    }
    if (!userId) return
    const timer = setTimeout(() => {
      saveCloud(userId, state).then(
        () => setSyncError(null),
        (err) => setSyncError(messageOf(err)),
      )
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state, status, userId])

  /** Local mode: make an account the signed-in one and load its progress. */
  const enterLocal = useCallback((id: string, loaded: UserState) => {
    saveAccountState(id, loaded)
    setSession(id)
    commit(loaded)
    setUserId(id)
    setSyncError(null)
    setStatus('ready')
  }, [commit])

  const leaveLocal = useCallback(() => {
    setSession(null)
    setStatus('signedOut')
    setUserId(null)
    commit(EMPTY)
  }, [commit])

  const signIn = useCallback(async (login: string, password: string) => {
    if (!supabase) {
      const id = await verifyLogin(login, password)
      enterLocal(id, loadAccountState(id) ?? newUserState(login.trim()))
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: login, password })
    if (error) throw new Error(error.message)
  }, [enterLocal])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (!supabase) {
      const id = await createAccount(username, password)
      // Progress from before log-in existed carries over when the same username signs up.
      const legacy = legacyProfile()
      const keep = legacy && legacy.username.toLowerCase() === username.trim().toLowerCase()
      if (keep) clearLegacyProfile()
      enterLocal(id, keep ? { ...legacy, username: username.trim() } : newUserState(username.trim()))
      return 'ready' as const
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    if (error) throw new Error(error.message)
    return data.session ? 'ready' as const : 'confirm' as const
  }, [enterLocal])

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
    } else {
      leaveLocal()
    }
  }, [leaveLocal])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Google sign-in needs the Supabase project connected.')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) throw new Error(error.message)
  }, [])

  const deleteLocalAccount = useCallback(() => {
    if (isCloud || !userId) return
    deleteAccount(userId)
    leaveLocal()
  }, [userId, leaveLocal])

  const rename = useCallback((username: string) => {
    if (!isCloud && usernameTaken(username, userId ?? undefined)) throw new Error('Another account in this browser already uses that username.')
    commit({ ...stateRef.current, username })
  }, [commit, userId])

  const earn = useCallback((activity: Activity, also?: (s: UserState) => UserState): EarnResult => {
    const before = stateRef.current
    const applied = applyActivity(also ? also(before) : before, activity)
    const { state: next, earned } = awardAchievements(applied)
    commit(next)
    const levelBefore = levelFromXp(before.xp)
    const levelAfter = levelFromXp(next.xp)
    return { xp: next.xp - before.xp, achievements: earned, leveledUp: levelAfter > levelBefore ? levelAfter : null }
  }, [commit])

  const logTime = useCallback((seconds: number, lang?: LangId) => {
    if (seconds < 1) return
    const s = stateRef.current
    const today = dayKey()
    const prev = s.days[today] ?? { xp: 0, seconds: 0, lessons: 0, correct: 0, attempts: 0, langs: {} }
    const langs = lang && prev.langs[lang] === undefined ? { ...prev.langs, [lang]: 0 } : prev.langs
    commit({ ...s, days: { ...s.days, [today]: { ...prev, seconds: prev.seconds + Math.round(seconds), langs } } })
  }, [commit])

  const patch = useCallback((change: Partial<UserState>) => commit({ ...stateRef.current, ...change }), [commit])

  const update = useCallback((change: (s: UserState) => UserState) => commit(change(stateRef.current)), [commit])

  const resetProgress = useCallback(() => {
    const { username, avatar, createdAt, profile } = stateRef.current
    // A reset clears progress but does not send the player back through the welcome flow.
    commit({ ...newUserState(username), avatar, createdAt, profile, onboarded: true })
  }, [commit])

  const value = useMemo<AppValue>(() => ({
    status,
    cloud: isCloud,
    userId,
    state,
    weeklyXp: state.weekStart === weekStartOf() ? state.weeklyXp : 0,
    syncError,
    toasts,
    dismissToast,
    notify,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    deleteLocalAccount,
    rename,
    earn,
    logTime,
    patch,
    update,
    resetProgress,
  }), [update, status, userId, state, syncError, toasts, dismissToast, notify, signIn, signUp, signOut, signInWithGoogle, deleteLocalAccount, rename, earn, logTime, patch, resetProgress])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = (): AppValue => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
