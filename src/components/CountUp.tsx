import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 700

/** A number that counts up (or down) to its new value, and briefly shows the change above it. */
export function CountUp({ value, className, showDelta = true }: { value: number; className?: string; showDelta?: boolean }) {
  const [shown, setShown] = useState(value)
  const [delta, setDelta] = useState<{ amount: number; key: number } | null>(null)
  const from = useRef(value)

  useEffect(() => {
    const start = from.current
    if (start === value) return
    from.current = value
    if (showDelta) setDelta({ amount: value - start, key: Date.now() })
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(value)
      return
    }
    const began = performance.now()
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / DURATION_MS)
      const eased = 1 - (1 - t) ** 3
      setShown(Math.round(start + (value - start) * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, showDelta])

  return (
    <span className={`relative tnum ${className ?? ''}`}>
      {shown.toLocaleString()}
      {delta && delta.amount !== 0 && (
        <span key={delta.key} className="animate-float-up pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-extrabold" style={{ color: delta.amount > 0 ? 'var(--color-ok)' : 'var(--color-bad)' }}>
          {delta.amount > 0 ? '+' : ''}{delta.amount}
        </span>
      )}
    </span>
  )
}
