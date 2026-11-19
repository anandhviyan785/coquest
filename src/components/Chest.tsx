import { RARITY } from '../lib/rewards'
import type { Rarity } from '../lib/types'
import { cx } from './ui'

const BODY: Record<Rarity, { lid: string; body: string; band: string; lock: string }> = {
  rare: { lid: '#60A5FA', body: '#2563EB', band: '#BFDBFE', lock: '#FDE68A' },
  epic: { lid: '#B48CFF', body: '#7C3AED', band: '#FFC800', lock: '#FFE27A' },
  legendary: { lid: '#FFD54A', body: '#E59400', band: '#FFF3B0', lock: '#8A4DFF' },
}

/**
 * A treasure chest, coloured by rarity, with a soft glow behind it. `idle` makes it wiggle now
 * and then; `open` lifts the lid and lets the light out.
 */
export function Chest({ rarity, size = 96, open = false, idle = false, glow = true, className }: { rarity: Rarity; size?: number; open?: boolean; idle?: boolean; glow?: boolean; className?: string }) {
  const c = BODY[rarity]
  return (
    <span className={cx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }} aria-hidden="true">
      {glow && <span className="animate-glow absolute inset-[8%] rounded-full blur-xl" style={{ background: RARITY[rarity].glow }} />}
      <svg viewBox="0 0 64 64" width={size} height={size} className={cx('relative', idle && !open && 'animate-wiggle')}>
        {open && <path d="M14 30 32 4l18 26z" fill={RARITY[rarity].glow} opacity="0.7" />}
        <rect x="8" y="30" width="48" height="26" rx="6" fill={c.body} />
        <rect x="8" y="38" width="48" height="5" fill={c.band} opacity="0.9" />
        <g style={{ transformOrigin: '8px 30px', transform: open ? 'rotate(-28deg)' : 'none', transition: 'transform 0.45s cubic-bezier(0.2, 1.6, 0.4, 1)' }}>
          <path d="M8 30a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v3H8z" fill={c.lid} />
          <rect x="8" y="29" width="48" height="4" fill={c.band} />
        </g>
        <rect x="27" y="27" width="10" height="14" rx="3" fill={c.lock} />
        <circle cx="32" cy="33" r="2" fill={c.body} />
        <rect x="12" y="46" width="6" height="6" rx="2" fill="#fff" opacity="0.18" />
      </svg>
    </span>
  )
}
