import type { ReactNode } from 'react'
import { cx } from './ui'

interface Props {
  selected: boolean
  onClick: () => void
  icon?: ReactNode
  title: string
  hint?: string
  right?: ReactNode
}

/** A tappable answer card, as used in the welcome questions and the daily-goal picker. */
export function OptionButton({ selected, onClick, icon, title, hint, right }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        'flex min-h-[60px] w-full items-center gap-4 rounded-xl border-2 border-b-4 px-4 py-3 text-left transition-colors active:translate-y-0.5 active:border-b-2',
        selected ? 'border-blue-line bg-blue-soft text-blue' : 'border-line bg-card text-body hover:bg-surface',
      )}
    >
      {icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold leading-snug">{title}</span>
        {hint && <span className={cx('block text-[14px] font-medium', selected ? 'text-blue-dark' : 'text-mute')}>{hint}</span>}
      </span>
      {right && <span className={cx('label shrink-0 text-[13px]', selected ? 'text-blue' : 'text-faint')}>{right}</span>}
    </button>
  )
}
