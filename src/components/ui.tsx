import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ')

// ── Button ────────────────────────────────────────────────────────────────
// The kit's buttons are flat blocks with a darker bottom edge that collapses when pressed.
type Variant = 'primary' | 'blue' | 'secondary' | 'ghost' | 'success' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-blue text-white border-blue-dark hover:brightness-105',
  success: 'bg-blue text-white border-blue-dark hover:brightness-105',
  blue: 'bg-blue text-white border-blue-dark hover:brightness-105',
  danger: 'bg-bad text-white border-bad-dark hover:brightness-105',
  gold: 'bg-gold text-white border-gold-dark hover:brightness-105',
  secondary: 'bg-card text-blue border-2 border-line hover:bg-surface',
  ghost: 'bg-transparent text-mute border-transparent hover:bg-surface hover:text-body',
}
const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[12px] gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-[13px] gap-2 rounded-xl',
  lg: 'h-[50px] px-6 text-[15px] gap-2 rounded-2xl',
}
const SOLID_EDGE = 'border-b-4 active:border-b-0 active:translate-y-1'
const EDGE: Record<Variant, string> = {
  primary: SOLID_EDGE,
  success: SOLID_EDGE,
  blue: SOLID_EDGE,
  danger: SOLID_EDGE,
  gold: SOLID_EDGE,
  secondary: 'border-b-4 active:border-b-2 active:translate-y-0.5',
  ghost: '',
}

const buttonClass = (variant: Variant, size: Size, extra?: string) =>
  cx(
    'label inline-flex shrink-0 items-center justify-center select-none whitespace-nowrap transition-[filter,background-color]',
    'disabled:pointer-events-none disabled:border-line disabled:bg-line disabled:text-faint',
    VARIANT[variant],
    EDGE[variant],
    SIZE[size],
    extra,
  )

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size }

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}

export function LinkButton({ to, variant = 'primary', size = 'md', className, children }: { to: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return <Link to={to} className={buttonClass(variant, size, className)}>{children}</Link>
}

// ── Surfaces ──────────────────────────────────────────────────────────────
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-2xl border-2 border-line bg-card', className)}>{children}</section>
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-ink">{children}</h2>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-mute">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

/** Underlined tab strip, as on the kit's Quests / Badges and Following / Followers screens. */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: Array<{ id: T; label: string }>; value: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div className={cx('flex border-b-2 border-line', className)} role="tablist">
      {tabs.map((tab) => (
        <button key={tab.id} role="tab" aria-selected={value === tab.id} onClick={() => onChange(tab.id)} className={cx('label -mb-0.5 flex-1 border-b-2 px-4 py-3.5 text-[13px] transition-colors', value === tab.id ? 'border-blue text-blue' : 'border-transparent text-faint hover:text-mute')}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/** The kit's bottom action bar: neutral, or a green / red result panel. Used by lessons and the welcome flow. */
export function ScreenFooter({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'bad'; children: ReactNode }) {
  return (
    <footer className={cx('shrink-0 px-4 py-5', tone === 'good' ? 'bg-green-soft' : tone === 'bad' ? 'bg-bad-soft' : 'border-t-2 border-line bg-card')}>
      <div className="mx-auto flex w-full max-w-[1008px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">{children}</div>
    </footer>
  )
}

// ── Progress ──────────────────────────────────────────────────────────────
export function Bar({ value, max, color = 'var(--color-gold)', className }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={cx('h-4 overflow-hidden rounded-full bg-line', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="relative h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }}>
        {pct > 12 && <span className="absolute inset-x-2 top-[22%] h-[22%] rounded-full bg-white/30" />}
      </div>
    </div>
  )
}

export function Ring({ value, max, size = 96, stroke = 10, color = 'var(--color-blue)', children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

// ── Small pieces ──────────────────────────────────────────────────────────
export function Tag({ children, color = 'var(--color-mute)' }: { children: ReactNode; color?: string }) {
  return (
    <span className="label inline-flex h-6 items-center gap-1 rounded-lg px-2 text-[11px]" style={{ color, background: `color-mix(in srgb, ${color} 14%, white)` }}>
      {children}
    </span>
  )
}

/** A stat tile: icon, bold value and a quiet label, as in the kit's profile Statistics grid. */
export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <div className="tnum text-xl font-bold leading-tight text-ink">{value}</div>
        <div className="text-[15px] text-mute">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] text-faint">{hint}</div>}
      </div>
    </div>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <p className="text-lg font-bold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[15px] text-mute">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Code({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={cx('overflow-x-auto rounded-xl border-2 border-line bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-ink', className)}>
      <code>{code}</code>
    </pre>
  )
}

/** Renders text with `inline code` spans and **bold** emphasis. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <p className={cx('text-[17px] leading-relaxed text-body', className)}>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="rounded-md bg-blue-soft px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-blue-dark">{part.slice(1, -1)}</code>
        }
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 cursor-default bg-black/50" onClick={onClose} />
      <div className="animate-pop relative w-full max-w-md rounded-2xl bg-card p-6">{children}</div>
    </div>
  )
}
