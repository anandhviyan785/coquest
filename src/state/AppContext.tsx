import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { awardAchievements } from '../lib/achievements'
import { dayKey, weekStartOf } from '../lib/dates'
import { applyActivity, levelFromXp, newUserState } from '../lib/gamification'
import type { Activity } from '../lib/gamification'
import { clearLegacyProfile, createAccount, deleteAccount, getSession, googleAccount, legacyProfile, loadAccountState, renameAccount, saveAccountState, setSession, usernameOf, usernameTaken, verifyLogin } from '../lib/localAuth'
import { signInWithGooglePopup } from '../lib/googleSignIn'
import { claimDailyCloud, loadCloud, recordPuzzleCloud, saveCloud } from '../lib/repo'
import { claimDaily, milestoneChests, openChest } from '../lib/rewards'
import { recordPuzzle, puzzleReward } from '../content/puzzles'
import type { Puzzle } from '../content/puzzles'
import { addGems } from '../lib/gamification'
import { isCloud, supabase } from '../lib/supabase'
import type { LangId, Loot, RewardClaim, UserState } from '../lib/types'

type Status = 'loading' | 'signedOut' | 'ready'

export interface EarnResult { xp: number; achievements: string[]; leveledUp: number | null }

export interface PuzzleOutcome extends EarnResult { gems: number }

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
  /** Logs in with an email (or, on this device only, a username) and a password. */
  signIn: (login: string, password: string) => Promise<void>
  /** Creates an account with a username, email and password. */
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
  /** Claims today's Daily Rewards chest (checked by the server when one is connected). Null if already claimed. */
  claimDailyReward: () => Promise<RewardClaim | null>
  /** Opens a bonus chest from the inventory. */
  openBonusChest: (id: string) => Loot | null
  /** Records today's Daily Puzzle and pays its reward. Null if today's puzzle was already played. */
  finishPuzzle: (puzzle: Puzzle, lang: LangId, solved: boolean, attempts: number) => Promise<PuzzleOutcome | null>
}

const AppContext = createContext<AppValue | null>(null)
const SAVE_DELAY_MS = 700
const CLOUD_LOAD_ATTEMPTS = 3
const CLOUD_RETRY_MS = 1500
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
  /** The signed-in cloud user whose progress is already loaded, so a repeat SIGNED_IN does not reload it. */
  const loadedUser = useRef<string | null>(null)

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
      // A remembered sign-in stays signed in. If its progress is missing (storage cleared or
      // unreadable), the player starts afresh but is not sent back to the log-in screen.
      const id = getSession()
      if (id) {
        commit(loadAccountState(id) ?? newUserState(usernameOf(id) ?? 'Explorer'))
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
        loadedUser.current = null
        setUserId(null)
        setStatus('signedOut')
        return
      }
      // Supabase re-emits SIGNED_IN on tab focus: keep the progress already on screen.
      if (loadedUser.current === id) return
      loadedUser.current = id // claim before the await so a second SIGNED_IN cannot load twice
      // A signed-in player is not sent to the log-in screen because of a brief network failure:
      // loading is retried a few times before giving up.
      for (let attempt = 1; ; attempt += 1) {
        try {
          const loaded = await loadCloud(id, name)
          if (cancelled) return
          commit(loaded)
          setUserId(id)
          setSyncError(null)
          setStatus('ready')
          return
        } catch (err) {
          if (cancelled) return
          if (attempt < CLOUD_LOAD_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, CLOUD_RETRY_MS * attempt))
            continue
          }
          console.error('Could not load cloud progress', err)
          loadedUser.current = null
          setSyncError(messageOf(err))
          setStatus('signedOut')
          return
        }
      }
    }
    supabase.auth.getSession()
      .then(({ data }) => adopt(data.session?.user.id ?? null, nameOf(data.session?.user)))
      .catch((err) => {
        if (cancelled) return
        setSyncError(messageOf(err))
        setStatus('signedOut')
      })
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
      enterLocal(id, loadAccountState(id) ?? newUserState(usernameOf(id) ?? login.trim()))
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: login, password })
    if (error) throw new Error(error.message)
  }, [enterLocal])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (!supabase) {
      const id = await createAccount(username, email, password)
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
    if (!supabase) {
      const profile = await signInWithGooglePopup()
      const { id, username } = googleAccount(profile)
      enterLocal(id, loadAccountState(id) ?? newUserState(username))
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) throw new Error(error.message)
  }, [enterLocal])

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
    const { state: awarded, earned } = awardAchievements(applied)
    const next = milestoneChests(before, awarded, earned)
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

  /** Seeds chest rolls with the account, so a chest's contents cannot be re-rolled by reloading. */
  const seed = userId ?? stateRef.current.username

  const claimDailyReward = useCallback(async (): Promise<RewardClaim | null> => {
    if (stateRef.current.rewardClaims[dayKey()]) return null
    const server = isCloud ? await claimDailyCloud(dayKey()) : undefined
    const { state: next, claim } = claimDaily(stateRef.current, seed, dayKey(), server)
    if (claim) commit(next)
    return claim
  }, [commit, seed])

  const openBonusChest = useCallback((id: string): Loot | null => {
    const { state: next, loot } = openChest(stateRef.current, id, seed)
    if (loot) commit(next)
    return loot
  }, [commit, seed])

  const finishPuzzle = useCallback(async (puzzle: Puzzle, lang: LangId, solved: boolean, attempts: number): Promise<PuzzleOutcome | null> => {
    const today = dayKey()
    if (stateRef.current.puzzles[today]) return null
    const reward = isCloud ? await recordPuzzleCloud(today, lang, puzzle.id, puzzle.difficulty, solved, attempts) : puzzleReward(puzzle.difficulty, solved, attempts)
    const result = { at: new Date().toISOString(), lang, puzzleId: puzzle.id, solved, attempts, xp: reward.xp, gems: reward.gems }
    const earned = earn(
      { xp: reward.xp, kind: 'puzzle', title: `Daily Puzzle: ${puzzle.title}`, lang, correct: solved ? 1 : 0, attempts },
      (s) => addGems(recordPuzzle(s, result, today), reward.gems, 'Daily Puzzle hard bonus'),
    )
    return { ...earned, gems: reward.gems }
  }, [earn])

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
    claimDailyReward,
    openBonusChest,
    finishPuzzle,
  }), [claimDailyReward, openBonusChest, finishPuzzle, update, status, userId, state, syncError, toasts, dismissToast, notify, signIn, signUp, signOut, signInWithGoogle, deleteLocalAccount, rename, earn, logTime, patch, resetProgress])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = (): AppValue => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
