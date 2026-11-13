import type { CSSProperties } from 'react'

const COLORS = ['#1CB0F6', '#FFC800', '#FF9600', '#CE82FF', '#58CC02', '#FF4B4B']
const COUNT = 18

interface Piece { dx: number; dy: number; rot: number; color: string; round: boolean; delay: number }

/** A fixed ring of pieces, so the burst looks the same every time it plays. */
const PIECES: Piece[] = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2
  const reach = 95 + (i % 3) * 28
  return {
    dx: Math.cos(angle) * reach,
    dy: Math.sin(angle) * reach - 24,
    rot: (i * 53) % 360,
    color: COLORS[i % COLORS.length],
    round: i % 2 === 0,
    delay: (i % 4) * 70,
  }
})

/** A burst of confetti from the middle of its (relatively positioned) parent. Use `loop` to repeat. */
export function Confetti({ loop = false }: { loop?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={loop ? 'confetti loop' : 'confetti'}
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--rot': `${p.rot}deg`, background: p.color, borderRadius: p.round ? '50%' : '3px', animationDelay: `${p.delay}ms` } as CSSProperties}
        />
      ))}
    </span>
  )
}
