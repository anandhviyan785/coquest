import { Monitor, Moon, Sun } from 'lucide-react'
import { setTheme, useThemeChoice } from '../lib/theme'
import type { ThemeChoice } from '../lib/theme'
import { cx } from './ui'

const OPTIONS: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

/** Light, dark or system, as a small segmented control. */
export function ThemePicker() {
  const choice = useThemeChoice()
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-xl bg-surface p-1">
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={choice === id} onClick={() => setTheme(id)} className={cx('flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold transition-colors', choice === id ? 'bg-card text-blue ring-2 ring-line' : 'text-mute hover:text-body')}>
          <Icon size={15} strokeWidth={2.6} />
          {label}
        </button>
      ))}
    </div>
  )
}
