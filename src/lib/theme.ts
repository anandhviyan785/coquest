import { useSyncExternalStore } from 'react'

/** The player's choice. "system" follows the device and changes when the device does. */
export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_KEY = 'pyquest:v1:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
const CHROME_COLOR: Record<ResolvedTheme, string> = { light: '#38B6FF', dark: '#131F24' }

const isChoice = (value: unknown): value is ThemeChoice => value === 'light' || value === 'dark' || value === 'system'

export const storedTheme = (): ThemeChoice => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return isChoice(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

const systemPrefersDark = (): boolean => typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches

export const resolveTheme = (choice: ThemeChoice): ResolvedTheme =>
  choice === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : choice

let choice: ThemeChoice = storedTheme()
const listeners = new Set<() => void>()

/** Paints the resolved theme onto the page and the browser's address-bar colour. */
const paint = (): void => {
  const resolved = resolveTheme(choice)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME_COLOR[resolved])
  listeners.forEach((listener) => listener())
}

export const setTheme = (next: ThemeChoice): void => {
  choice = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch (err) {
    console.error('Could not remember the theme', err)
  }
  paint()
}

/** Applies the saved theme and keeps "system" in step with the device. Call once at start-up. */
export const initTheme = (): void => {
  paint()
  if (typeof matchMedia === 'function') matchMedia(DARK_QUERY).addEventListener('change', () => choice === 'system' && paint())
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useThemeChoice = (): ThemeChoice => useSyncExternalStore(subscribe, () => choice)
export const useResolvedTheme = (): ResolvedTheme => useSyncExternalStore(subscribe, () => resolveTheme(choice))
