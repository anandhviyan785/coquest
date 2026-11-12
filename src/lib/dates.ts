const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD. */
export const dayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseDay = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (key: string, n: number): string => {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export const daysBetween = (from: string, to: string): number =>
  Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000)

/** Monday of the week containing the given day. */
export const weekStartOf = (key: string = dayKey()): string => {
  const offset = (parseDay(key).getDay() + 6) % 7
  return addDays(key, -offset)
}

export const lastNDays = (n: number, end: string = dayKey()): string[] =>
  Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)))

export const msUntilTomorrow = (): number => {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

export const formatClock = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}

export const shortDate = (key: string): string =>
  parseDay(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export const weekdayShort = (key: string): string =>
  parseDay(key).toLocaleDateString(undefined, { weekday: 'short' })
