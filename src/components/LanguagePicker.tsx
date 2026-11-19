import { Check, Code2, X } from 'lucide-react'
import { useEffect } from 'react'
import { COURSES, courseProgress } from '../content'
import { play } from '../lib/sfx'
import type { LangId } from '../lib/types'
import { useApp } from '../state/AppContext'
import { LangLogo } from './LangLogo'
import { Bar, cx } from './ui'

/**
 * A sheet listing every language. It rises from the bottom on phones and sits in the middle on
 * larger screens. Picking one switches the whole app (path, glossary, daily puzzle) to it.
 */
export function LanguagePicker({ open, current, onPick, onClose }: { open: boolean; current: LangId; onPick: (id: LangId) => void; onClose: () => void }) {
  const { state } = useApp()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Choose a language">
      <button aria-label="Close" data-sfx="none" className="absolute inset-0 cursor-default bg-[#0a1a3a]/55 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <div className="mb-4 flex items-center gap-3">
          <span className="grad-hero flex h-11 w-11 items-center justify-center rounded-2xl text-white"><Code2 size={22} strokeWidth={2.6} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-ink">Choose a language</h2>
            <p className="text-[14px] text-mute">Your path, glossary and daily puzzle follow your choice.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl text-faint hover:bg-surface hover:text-mute"><X size={20} strokeWidth={3} /></button>
        </div>
        <ul className="grid gap-2.5">
          {COURSES.map((c) => {
            const active = c.id === current
            const progress = courseProgress(c, state.lessons)
            return (
              <li key={c.id}>
                <button
                  data-sfx="none"
                  onClick={() => {
                    play('select')
                    onPick(c.id)
                  }}
                  aria-pressed={active}
                  className={cx('press flex w-full items-center gap-4 rounded-2xl border-2 p-3.5 text-left', active ? 'border-blue bg-blue-soft glow-blue' : 'border-line hover:bg-surface')}
                >
                  <LangLogo lang={c.id} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cx('text-[17px] font-bold', active ? 'text-blue' : 'text-body')}>{c.name}</span>
                      <span className="tnum text-[13px] font-bold text-faint">{progress.pct}%</span>
                    </span>
                    <span className="block truncate text-[13px] text-mute">{c.tagline}</span>
                    <Bar value={progress.completed} max={progress.total} color="var(--color-blue)" className="mt-1.5 h-2" />
                  </span>
                  {active && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue text-white"><Check size={16} strokeWidth={3.5} /></span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
