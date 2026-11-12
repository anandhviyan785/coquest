/** Boss artwork: one creature model, re-tinted and re-horned per boss so each reads as its own monster. */

const PALETTES = [
  { body: '#7C2D12', belly: '#C2410C', eye: '#FBBF24' },
  { body: '#4C1D95', belly: '#7C3AED', eye: '#67E8F9' },
  { body: '#14532D', belly: '#16A34A', eye: '#FBBF24' },
  { body: '#7F1D1D', belly: '#DC2626', eye: '#FDE68A' },
  { body: '#134E4A', belly: '#0D9488', eye: '#F97316' },
  { body: '#312E81', belly: '#4F46E5', eye: '#F97316' },
  { body: '#3F3F46', belly: '#71717A', eye: '#EF4444' },
]

const hash = (text: string): number => [...text].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7)

export function Monster({ id, size = 150, defeated = false, hurt = false }: { id: string; size?: number; defeated?: boolean; hurt?: boolean }) {
  const seed = hash(id)
  const palette = PALETTES[seed % PALETTES.length]
  const horns = seed % 3
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={defeated ? 'Defeated boss' : 'Boss monster'} className={hurt ? 'animate-shake' : ''} style={{ opacity: defeated ? 0.45 : 1, filter: defeated ? 'grayscale(0.8)' : undefined }}>
      <ellipse cx="100" cy="188" rx="58" ry="7" fill="#000" opacity="0.35" />
      {horns === 0 && (<g fill="#E2E8F0"><path d="M58 62 L44 18 L78 48 Z" /><path d="M142 62 L156 18 L122 48 Z" /></g>)}
      {horns === 1 && (<g fill={palette.belly}><path d="M70 50 L62 14 L86 40 Z" /><path d="M100 44 L100 6 L114 40 Z" /><path d="M130 50 L138 14 L114 40 Z" /></g>)}
      {horns === 2 && (<g fill="none" stroke="#E2E8F0" strokeWidth="9" strokeLinecap="round"><path d="M62 60 C40 50 34 28 50 16" /><path d="M138 60 C160 50 166 28 150 16" /></g>)}
      <path d="M100 38 C150 38 176 76 176 120 C176 164 146 184 100 184 C54 184 24 164 24 120 C24 76 50 38 100 38 Z" fill={palette.body} />
      <ellipse cx="100" cy="142" rx="46" ry="32" fill={palette.belly} opacity="0.55" />
      {defeated ? (
        <g stroke="#0B1533" strokeWidth="6" strokeLinecap="round">
          <path d="M62 86 L86 106 M86 86 L62 106" /><path d="M114 86 L138 106 M138 86 L114 106" />
        </g>
      ) : (
        <g>
          <path d="M54 82 L92 96 L88 112 L58 108 Z" fill={palette.eye} /><path d="M146 82 L108 96 L112 112 L142 108 Z" fill={palette.eye} />
          <circle cx="76" cy="103" r="5" fill="#0B1533" /><circle cx="124" cy="103" r="5" fill="#0B1533" />
        </g>
      )}
      <path d={defeated ? 'M70 148 Q100 132 130 148' : 'M62 132 Q100 172 138 132 Z'} fill={defeated ? 'none' : '#0B1533'} stroke="#0B1533" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {!defeated && (<g fill="#F8FAFC"><path d="M74 137 L82 150 L90 140 Z" /><path d="M93 141 L100 154 L107 141 Z" /><path d="M110 140 L118 150 L126 137 Z" /></g>)}
    </svg>
  )
}
