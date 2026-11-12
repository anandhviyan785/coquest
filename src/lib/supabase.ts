import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Null when no Supabase project is configured. The app then runs in local mode:
 * progress is saved in this browser and online features explain what they need.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const isCloud = supabase !== null
