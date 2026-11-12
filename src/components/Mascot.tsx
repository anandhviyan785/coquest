import { useId } from 'react'
import type { Expression } from '../lib/types'

/**
 * QUEST — the platform mascot.
 * One character model (body, fin, eyes, satchel) shared by every expression;
 * only the eyes, brows, mouth, arms, fin angle and head tilt change.
 */

type Eye = 'open' | 'wide' | 'happy' | 'sleep' | 'droopy'
type Brow = 'none' | 'firm' | 'sad' | 'raised'
type Mouth = 'smile' | 'open' | 'cheer' | 'frown' | 'oh' | 'smirk' | 'flat' | 'grin'

interface Pose {
  tilt: number
  fin: number
  eyes: [Eye, Eye]
  look: [number, number]
  brow: Brow
  mouth: Mouth
  /** Arm angles in degrees from hanging straight down; positive swings outward and up. */
  arms: [number, number]
  zzz?: boolean
}

const POSES: Record<Expression, Pose> = {
  happy: { tilt: 0, fin: -4, eyes: ['happy', 'happy'], look: [0, 0], brow: 'none', mouth: 'open', arms: [140, 140] },
  thinking: { tilt: 4, fin: 6, eyes: ['open', 'open'], look: [4, -5], brow: 'raised', mouth: 'flat', arms: [22, -62] },
  excited: { tilt: 0, fin: -10, eyes: ['wide', 'wide'], look: [0, -1], brow: 'none', mouth: 'cheer', arms: [155, 155] },
  disappointed: { tilt: 3, fin: 30, eyes: ['droopy', 'droopy'], look: [0, 5], brow: 'sad', mouth: 'frown', arms: [8, 8] },
  sleeping: { tilt: 6, fin: 22, eyes: ['sleep', 'sleep'], look: [0, 0], brow: 'none', mouth: 'oh', arms: [10, 10], zzz: true },
  victorious: { tilt: -3, fin: -8, eyes: ['open', 'happy'], look: [0, 0], brow: 'firm', mouth: 'grin', arms: [165, 40] },
  curious: { tilt: -8, fin: -6, eyes: ['wide', 'open'], look: [3, -2], brow: 'none', mouth: 'oh', arms: [24, 70] },
  determined: { tilt: 0, fin: 0, eyes: ['open', 'open'], look: [0, 0], brow: 'firm', mouth: 'smirk', arms: [48, 48] },
}

const INK = '#0B1533'
const EYES = [76, 124] as const
const EYE_Y = 100

function EyeShape({ kind, cx, look, clip }: { kind: Eye; cx: number; look: [number, number]; clip: string }) {
  if (kind === 'happy') {
    return <path d={`M${cx - 15} ${EYE_Y + 4} Q${cx} ${EYE_Y - 14} ${cx + 15} ${EYE_Y + 4}`} stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
  }
  if (kind === 'sleep') {
    return <path d={`M${cx - 14} ${EYE_Y} Q${cx} ${EYE_Y + 11} ${cx + 14} ${EYE_Y}`} stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
  }
  const wide = kind === 'wide'
  const rx = wide ? 17 : 16
  const ry = wide ? 21 : 19
  const px = cx + look[0]
  const py = EYE_Y + 1 + look[1]
  return (
    <g>
      <ellipse cx={cx} cy={EYE_Y} rx={rx} ry={ry} fill="#F8FAFC" />
      <g clipPath={`url(#${clip})`}>
        <circle cx={px} cy={py} r={wide ? 12.5 : 11.5} fill="#0891B2" />
        <circle cx={px} cy={py} r={wide ? 8.5 : 7.5} fill={INK} />
        <circle cx={px - 4} cy={py - 5} r={wide ? 4.6 : 3.8} fill="#FFFFFF" />
        <circle cx={px + 4.5} cy={py + 4} r="1.7" fill="#FFFFFF" opacity="0.85" />
        {kind === 'droopy' && <rect x={cx - 20} y={EYE_Y - 24} width="40" height="21" fill="#2459DE" />}
      </g>
      {kind === 'droopy' && (
        <path d={`M${cx - 15.5} ${EYE_Y - 3} L${cx + 15.5} ${EYE_Y - 3}`} stroke="#1A3FA8" strokeWidth="2.5" strokeLinecap="round" />
      )}
    </g>
  )
}

function Brows({ kind }: { kind: Brow }) {
  const common = { stroke: '#132B7A', strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none' }
  if (kind === 'firm') return (<g {...common}><path d="M58 73 L90 81" /><path d="M142 73 L110 81" /></g>)
  if (kind === 'sad') return (<g {...common}><path d="M60 80 L88 73" /><path d="M140 80 L112 73" /></g>)
  if (kind === 'raised') return (<g {...common}><path d="M62 77 L90 77" /><path d="M110 70 Q124 62 140 70" /></g>)
  return null
}

function MouthShape({ kind }: { kind: Mouth }) {
  const line = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' }
  switch (kind) {
    case 'smile': return <path d="M88 127 Q100 139 112 127" {...line} />
    case 'smirk': return <path d="M89 130 Q104 139 114 125" {...line} />
    case 'flat': return <path d="M91 131 L108 128" {...line} />
    case 'frown': return <path d="M90 135 Q100 125 110 135" {...line} />
    case 'oh': return <ellipse cx="100" cy="131" rx="5.5" ry="6.5" fill={INK} />
    case 'grin':
      return (<g><path d="M84 124 Q100 146 116 124 Z" fill="#F8FAFC" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" /><path d="M88 130 L112 130" stroke={INK} strokeWidth="2" opacity="0.35" /></g>)
    case 'open':
    case 'cheer': {
      const depth = kind === 'cheer' ? 152 : 146
      return (
        <g>
          <path d={`M85 124 Q100 ${depth} 115 124 Z`} fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="100" cy={kind === 'cheer' ? 139 : 136} rx="6.5" ry="3.6" fill="#FB7185" />
        </g>
      )
    }
  }
}

function Arm({ side, angle, fill }: { side: 'left' | 'right'; angle: number; fill: string }) {
  const x = side === 'left' ? 44 : 156
  const rot = side === 'left' ? angle : -angle
  return (
    <g transform={`translate(${x} 120) rotate(${rot})`}>
      <ellipse cx="0" cy="13" rx="9.5" ry="17" fill={fill} stroke="#1741B8" strokeWidth="1.5" />
    </g>
  )
}

interface MascotProps {
  expression?: Expression
  size?: number
  className?: string
  /** Gentle idle float. Off by default so QUEST stays calm in dense layouts. */
  float?: boolean
}

export function Mascot({ expression = 'curious', size = 160, className = '', float = false }: MascotProps) {
  const uid = useId().replace(/:/g, '')
  const pose = POSES[expression]
  const id = (name: string) => `${name}-${uid}`

  return (
    <svg
      viewBox="0 0 200 210"
      width={size}
      height={size * 1.05}
      role="img"
      aria-label={`QUEST looking ${expression}`}
      className={`${float ? 'animate-bob' : ''} ${className}`}
    >
      <defs>
        <radialGradient id={id('body')} cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#4C8DFA" />
          <stop offset="48%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1A45C4" />
        </radialGradient>
        <linearGradient id={id('fin')} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
        <radialGradient id={id('belly')} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
        </radialGradient>
        {EYES.map((cx, i) => (
          <clipPath key={cx} id={id(`eye${i}`)}>
            <ellipse cx={cx} cy={EYE_Y} rx={pose.eyes[i] === 'wide' ? 17 : 16} ry={pose.eyes[i] === 'wide' ? 21 : 19} />
          </clipPath>
        ))}
      </defs>

      <ellipse cx="100" cy="198" rx="50" ry="6.5" fill="#000" opacity="0.32" />

      <g transform={`rotate(${pose.tilt} 100 180)`}>
        {/* feet */}
        <ellipse cx="78" cy="184" rx="16" ry="10" fill="#1A45C4" />
        <ellipse cx="122" cy="184" rx="16" ry="10" fill="#1A45C4" />

        {/* side fins */}
        <path d="M40 90 C22 80 16 100 35 110 Z" fill="#06B6D4" />
        <path d="M160 90 C178 80 184 100 165 110 Z" fill="#06B6D4" />

        {/* head fin — QUEST's signature silhouette */}
        <g transform={`rotate(${pose.fin} 108 46)`}>
          <path d="M112 48 C112 30 126 21 142 26 C133 32 130 41 132 52 Z" fill="#0891B2" />
          <path d="M94 46 C83 20 99 1 127 6 C116 16 113 31 120 48 Z" fill={`url(#${id('fin')})`} />
          <path d="M101 40 C96 26 103 15 114 12" stroke="#ECFEFF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
        </g>

        {/* body */}
        <path
          d="M100 40 C146 40 167 78 167 116 C167 157 138 178 100 178 C62 178 33 157 33 116 C33 78 54 40 100 40 Z"
          fill={`url(#${id('body')})`}
        />
        <ellipse cx="100" cy="140" rx="37" ry="29" fill={`url(#${id('belly')})`} />
        <ellipse cx="72" cy="62" rx="20" ry="9" fill="#93C5FD" opacity="0.28" transform="rotate(-28 72 62)" />

        {/* cheek freckles */}
        <g fill="#67E8F9" opacity="0.75">
          <circle cx="52" cy="121" r="2" /><circle cx="59" cy="126" r="2" /><circle cx="50" cy="129" r="1.6" />
          <circle cx="148" cy="121" r="2" /><circle cx="141" cy="126" r="2" /><circle cx="150" cy="129" r="1.6" />
        </g>

        {/* explorer satchel */}
        <path d="M60 70 Q104 112 141 146" stroke="#8A5A2B" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        <path d="M60 70 Q104 112 141 146" stroke="#B9824A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <rect x="124" y="140" width="33" height="27" rx="7" fill="#A8713A" />
        <path d="M124 147 Q124 140 131 140 H150 Q157 140 157 147 V151 Q140.5 162 124 151 Z" fill="#C99355" />
        <rect x="137" y="151" width="7" height="8" rx="2" fill="#67E8F9" />

        {/* face */}
        {EYES.map((cx, i) => (
          <EyeShape key={cx} kind={pose.eyes[i]} cx={cx} look={pose.look} clip={id(`eye${i}`)} />
        ))}
        <Brows kind={pose.brow} />
        <MouthShape kind={pose.mouth} />

        {/* arms */}
        <Arm side="left" angle={pose.arms[0]} fill="#2459DE" />
        <Arm side="right" angle={pose.arms[1]} fill="#2459DE" />
      </g>

      {pose.zzz && (
        <g fill="#67E8F9" fontFamily="'JetBrains Mono Variable', monospace" fontWeight="700">
          <text x="150" y="58" fontSize="15" opacity="0.6">z</text>
          <text x="162" y="42" fontSize="19" opacity="0.8">z</text>
          <text x="176" y="24" fontSize="23">z</text>
        </g>
      )}
    </svg>
  )
}

/** Round avatar crop of QUEST's face, for profile pictures and compact UI. */
export function MascotAvatar({ expression = 'curious', size = 40 }: { expression?: Expression; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-raised ring-1 ring-line"
      style={{ width: size, height: size }}
    >
      <Mascot expression={expression} size={size * 1.25} className="translate-y-[18%]" />
    </span>
  )
}
