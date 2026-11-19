import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Null when no Supabase project is configured. The app then runs in local mode:
 * progress is saved in this browser and online features explain what they need.
 *
 * Sign-ins are remembered: the session is kept in this browser's local storage (under Supabase's
 * default key, so existing sessions keep working), its token is refreshed automatically before it
 * expires, and the Google sign-in redirect is picked up from the address bar.
 */
export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

export const isCloud = supabase !== null
