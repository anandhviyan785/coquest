import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ')

// ── Button ────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-blue text-white hover:bg-sky active:bg-blue shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]',
  secondary: 'bg-raised text-ink border border-line hover:border-sky/60 hover:bg-[#213251]',
  ghost: 'text-mute hover:text-ink hover:bg-raised',
  success: 'bg-ok text-[#04210f] hover:brightness-110',
  danger: 'bg-transparent text-bad border border-bad/40 hover:bg-bad/10',
}
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-[10px]',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
}

const buttonClass = (variant: Variant, size: Size, extra?: string) =>
  cx(
    'inline-flex items-center justify-center font-semibold transition-colors select-none whitespace-nowrap',
    'disabled:opacity-45 disabled:pointer-events-none',
    VARIANT[variant],
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
  return <section className={cx('rounded-2xl border border-line bg-card', className)}>{children}</section>
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">{children}</h2>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

// ── Progress ──────────────────────────────────────────────────────────────
export function Bar({ value, max, color = 'var(--color-sky)', className }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-bg', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Ring({ value, max, size = 96, stroke = 8, color = 'var(--color-cyan)', children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

// ── Small pieces ──────────────────────────────────────────────────────────
export function Tag({ children, color = 'var(--color-mute)' }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      {children}
    </span>
  )
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-mute">{icon}{label}</div>
      <div className="tnum mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
    </div>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-mute">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Code({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={cx('overflow-x-auto rounded-xl border border-line bg-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-[#cfe3ff]', className)}>
      <code>{code}</code>
    </pre>
  )
}

/** Renders text with `inline code` spans and **bold** emphasis. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <p className={cx('leading-relaxed text-[15px] text-[#d5deeb]', className)}>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="rounded-md border border-line bg-bg px-1.5 py-0.5 font-mono text-[13px] text-ice">{part.slice(1, -1)}</code>
        }
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 cursor-default bg-black/60" onClick={onClose} />
      <div className="animate-pop relative w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl shadow-black/50">{children}</div>
    </div>
  )
}
