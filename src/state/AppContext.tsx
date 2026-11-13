import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { awardAchievements } from '../lib/achievements'
import { dayKey, weekStartOf } from '../lib/dates'
import { applyActivity, levelFromXp, newUserState } from '../lib/gamification'
import type { Activity } from '../lib/gamification'
import { clearLocal, loadCloud, loadLocal, saveCloud, saveLocal } from '../lib/repo'
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
  startLocal: (username: string) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<'ready' | 'confirm'>
  signOut: () => Promise<void>
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
      const saved = loadLocal()
      if (saved) commit(saved)
      setStatus(saved ? 'ready' : 'signedOut')
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
    const nameOf = (meta: Record<string, unknown> | undefined) => (typeof meta?.username === 'string' ? meta.username : 'Explorer')
    supabase.auth.getSession().then(({ data }) => adopt(data.session?.user.id ?? null, nameOf(data.session?.user.user_metadata)))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void adopt(session?.user.id ?? null, nameOf(session?.user.user_metadata))
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
      try {
        saveLocal(state)
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

  const startLocal = useCallback((username: string) => {
    commit(newUserState(username))
    setStatus('ready')
  }, [commit])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    if (error) throw new Error(error.message)
    return data.session ? 'ready' as const : 'confirm' as const
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
    } else {
      clearLocal()
      setStatus('signedOut')
    }
  }, [])

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
    const fresh = { ...newUserState(stateRef.current.username), avatar: stateRef.current.avatar }
    if (!isCloud) clearLocal()
    commit(fresh)
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
    startLocal,
    signIn,
    signUp,
    signOut,
    earn,
    logTime,
    patch,
    update,
    resetProgress,
  }), [update, status, userId, state, syncError, toasts, dismissToast, notify, startLocal, signIn, signUp, signOut, earn, logTime, patch, resetProgress])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = (): AppValue => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
