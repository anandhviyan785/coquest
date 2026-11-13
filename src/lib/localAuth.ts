import { hydrate } from './repo'
import type { UserState } from './types'

/**
 * Accounts for local mode (no Supabase project). Each account has a username and a password,
 * stored in this browser only. Passwords are never stored: only a salted PBKDF2-SHA256 hash.
 * This keeps profiles apart and stops someone at the same browser walking straight in; it is
 * not a substitute for server-side accounts, which cloud mode provides.
 */

const ACCOUNTS_KEY = 'pyquest:v1:accounts'
const SESSION_KEY = 'pyquest:v1:session'
const LEGACY_STATE_KEY = 'pyquest:v1:state'
const stateKey = (id: string) => `pyquest:v1:state:${id}`

const ITERATIONS = 210_000
export const MIN_PASSWORD = 8
const LOGIN_ERROR = 'Incorrect username or password.'

interface Account { id: string; username: string; salt: string; hash: string; iterations: number; createdAt: string }

// ── Storage helpers ───────────────────────────────────────────────────────
const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch (err) {
    console.error(`Could not read ${key}`, err)
    return fallback
  }
}

const write = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Could not write ${key}`, err)
    throw new Error('Your browser blocked saving. Check that site storage is allowed.')
  }
}

const accounts = (): Account[] => read<Account[]>(ACCOUNTS_KEY, [])
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// ── Hashing ───────────────────────────────────────────────────────────────
const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string): Uint8Array => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

const derive = async (password: string, salt: Uint8Array, iterations: number): Promise<string> => {
  if (!crypto?.subtle) throw new Error('Secure log-in needs HTTPS or localhost.')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256)
  return toBase64(new Uint8Array(bits))
}

/** Compares two strings without returning early, so timing does not reveal how much matched. */
const equal = (a: string, b: string): boolean => {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return diff === 0
}

// ── Accounts ──────────────────────────────────────────────────────────────
export const usernameTaken = (username: string, exceptId?: string): boolean =>
  accounts().some((a) => a.id !== exceptId && sameName(a.username, username))

export const createAccount = async (username: string, password: string): Promise<string> => {
  if (password.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`)
  if (usernameTaken(username)) throw new Error('That username is already taken in this browser. Log in instead, or pick another.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const account: Account = {
    id: crypto.randomUUID(),
    username: username.trim(),
    salt: toBase64(salt),
    hash: await derive(password, salt, ITERATIONS),
    iterations: ITERATIONS,
    createdAt: new Date().toISOString(),
  }
  write(ACCOUNTS_KEY, [...accounts(), account])
  return account.id
}

/** Returns the account id when the username and password match. */
export const verifyLogin = async (username: string, password: string): Promise<string> => {
  const account = accounts().find((a) => sameName(a.username, username))
  // Hash even when the user does not exist, so both failures take the same time.
  const salt = account ? fromBase64(account.salt) : crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, account?.iterations ?? ITERATIONS)
  if (!account || !equal(hash, account.hash)) throw new Error(LOGIN_ERROR)
  return account.id
}

export const renameAccount = (id: string, username: string): void => {
  const list = accounts()
  const current = list.find((a) => a.id === id)
  if (!current || current.username === username) return
  write(ACCOUNTS_KEY, list.map((a) => (a.id === id ? { ...a, username } : a)))
}

export const deleteAccount = (id: string): void => {
  write(ACCOUNTS_KEY, accounts().filter((a) => a.id !== id))
  localStorage.removeItem(stateKey(id))
  if (getSession() === id) setSession(null)
}

// ── Session and progress ──────────────────────────────────────────────────
export const getSession = (): string | null => {
  const id = read<string | null>(SESSION_KEY, null)
  return id && accounts().some((a) => a.id === id) ? id : null
}

export const setSession = (id: string | null): void => {
  if (id) write(SESSION_KEY, id)
  else localStorage.removeItem(SESSION_KEY)
}

export const loadAccountState = (id: string): UserState | null => {
  const account = accounts().find((a) => a.id === id)
  if (!account) return null
  const raw = read<unknown>(stateKey(id), null)
  return raw ? hydrate(raw, account.username) : null
}

export const saveAccountState = (id: string, state: UserState): void => write(stateKey(id), state)

// ── Profiles saved before log-in existed ──────────────────────────────────
/** Progress from the earlier password-less profile, if this browser has one. */
export const legacyProfile = (): UserState | null => {
  const raw = read<unknown>(LEGACY_STATE_KEY, null)
  return raw ? hydrate(raw, 'Explorer') : null
}

export const clearLegacyProfile = (): void => localStorage.removeItem(LEGACY_STATE_KEY)
