import { dayKey, weekStartOf } from './dates'
import { leagueFromXp, liveStreak, newUserState } from './gamification'
import { supabase } from './supabase'
import type { UserState } from './types'

const LOCAL_KEY = 'pyquest:v1:state'

/** Fills in any fields missing from older saved states. */
const hydrate = (raw: unknown, fallbackName: string): UserState => {
  const base = newUserState(fallbackName)
  if (!raw || typeof raw !== 'object') return base
  return { ...base, ...(raw as Partial<UserState>) }
}

// ── Local mode ────────────────────────────────────────────────────────────
export const loadLocal = (): UserState | null => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? hydrate(JSON.parse(raw), 'Explorer') : null
  } catch (err) {
    console.error('Could not read saved progress', err)
    return null
  }
}

export const saveLocal = (state: UserState): void => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Could not save progress', err)
    throw new Error('Your browser blocked saving progress. Check storage settings.')
  }
}

export const clearLocal = (): void => localStorage.removeItem(LOCAL_KEY)

// ── Cloud mode ────────────────────────────────────────────────────────────
export const loadCloud = async (userId: string, fallbackName: string): Promise<UserState> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('progress').select('state').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return hydrate(data?.state, fallbackName)
}

export const saveCloud = async (userId: string, state: UserState): Promise<void> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const week = weekStartOf()
  const profile = {
    id: userId,
    username: state.username,
    avatar: state.avatar,
    xp: state.xp,
    weekly_xp: state.weekStart === week ? state.weeklyXp : 0,
    week_start: week,
    streak: liveStreak(state),
    league: leagueFromXp(state.xp).id,
    updated_at: new Date().toISOString(),
  }
  const profileRes = await supabase.from('profiles').upsert(profile)
  if (profileRes.error) {
    const taken = profileRes.error.code === '23505'
    throw new Error(taken ? 'That username is already taken.' : profileRes.error.message)
  }
  const progressRes = await supabase.from('progress').upsert({ user_id: userId, state, updated_at: new Date().toISOString() })
  if (progressRes.error) throw new Error(progressRes.error.message)
}

// ── Leaderboards (cloud only) ─────────────────────────────────────────────
export interface BoardRow { id: string; username: string; avatar: string; xp: number; weekly_xp: number; streak: number; league: string }

export const fetchWeeklyBoard = async (league: string): Promise<BoardRow[]> => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar, xp, weekly_xp, streak, league')
    .eq('league', league)
    .eq('week_start', weekStartOf())
    .order('weekly_xp', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data ?? []
}

export const fetchAllTimeBoard = async (): Promise<BoardRow[]> => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar, xp, weekly_xp, streak, league')
    .order('xp', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data ?? []
}

export interface DailyRow { user_id: string; username: string; ms: number }

export const fetchDailyBoard = async (day: string = dayKey()): Promise<DailyRow[]> => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('daily_results')
    .select('user_id, username, ms')
    .eq('day', day)
    .order('ms', { ascending: true })
    .limit(25)
  if (error) throw new Error(error.message)
  return data ?? []
}

export const submitDailyResult = async (userId: string, username: string, ms: number, day: string = dayKey()): Promise<void> => {
  if (!supabase) return
  const { error } = await supabase.from('daily_results').upsert({ user_id: userId, day, username, ms }, { onConflict: 'user_id,day', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}
