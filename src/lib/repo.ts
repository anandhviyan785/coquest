import { dayKey, weekStartOf } from './dates'
import { leagueFromXp, liveStreak, newUserState } from './gamification'
import { supabase } from './supabase'
import type { LangId, Loot, Rarity, UserState } from './types'

/** Fills in any fields missing from older saved states. */
export const hydrate = (raw: unknown, fallbackName: string): UserState => {
  const base = newUserState(fallbackName)
  if (!raw || typeof raw !== 'object') return base
  const saved = raw as Partial<UserState>
  return {
    ...base,
    ...saved,
    profile: { ...base.profile, ...saved.profile },
    settings: { ...base.settings, ...saved.settings },
    rewardClaims: saved.rewardClaims ?? {},
    chests: Array.isArray(saved.chests) ? saved.chests : [],
    puzzles: saved.puzzles ?? {},
    gemLog: Array.isArray(saved.gemLog) ? saved.gemLog : [],
    // Anyone who already had saved progress before the welcome flow existed skips it.
    onboarded: saved.onboarded ?? true,
  }
}

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

// ── Reminder emails (cloud only) ──────────────────────────────────────────
export const fetchReminderPref = async (userId: string): Promise<boolean> => {
  if (!supabase) return false
  const { data, error } = await supabase.from('profiles').select('email_reminders').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.email_reminders ?? true
}

export const setReminderPref = async (userId: string, on: boolean): Promise<void> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('profiles').update({ email_reminders: on }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export const signedInEmail = async (): Promise<string | null> => {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.email ?? null
}

// ── Daily Rewards and Daily Puzzle (cloud only) ───────────────────────────
// These run as database functions (supabase/schema.sql) so the server decides the reward and
// a second claim on the same day is refused, whatever the browser sends.

const RARITIES: Rarity[] = ['rare', 'epic', 'legendary']

export const claimDailyCloud = async (day: string): Promise<Loot & { cycleDay: number }> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('claim_daily_reward', { p_day: day })
  if (error) throw new Error(error.message.includes('already_claimed') ? "Today's chest has already been claimed." : error.message)
  const row = (Array.isArray(data) ? data[0] : data) as { cycle_day: number; rarity: string; xp: number; gems: number; savers: number; bonus_chest: string | null } | null
  if (!row || !RARITIES.includes(row.rarity as Rarity)) throw new Error('The server sent an unexpected reward.')
  const bonus = row.bonus_chest && RARITIES.includes(row.bonus_chest as Rarity) ? (row.bonus_chest as Rarity) : null
  return { cycleDay: row.cycle_day, rarity: row.rarity as Rarity, xp: row.xp, gems: row.gems, savers: row.savers, bonusChest: bonus }
}

export const recordPuzzleCloud = async (day: string, lang: LangId, puzzleId: string, difficulty: number, solved: boolean, attempts: number): Promise<{ xp: number; gems: number }> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('complete_daily_puzzle', { p_day: day, p_lang: lang, p_puzzle_id: puzzleId, p_difficulty: difficulty, p_solved: solved, p_attempts: attempts })
  if (error) throw new Error(error.message.includes('already_played') ? "Today's puzzle has already been played." : error.message)
  const row = (Array.isArray(data) ? data[0] : data) as { xp: number; gems: number } | null
  if (!row) throw new Error('The server sent an unexpected result.')
  return { xp: row.xp, gems: row.gems }
}
