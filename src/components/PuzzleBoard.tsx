import { Undo2 } from 'lucide-react'
import { useMemo } from 'react'
import { normaliseTyped } from '../content/puzzles'
import type { Puzzle } from '../content/puzzles'
import { seeded } from '../lib/rewards'
import { Code, cx } from './ui'

/** The player's current answer, whatever the puzzle format. */
export type Answer = { kind: 'index'; value: number | null } | { kind: 'order'; value: number[] } | { kind: 'text'; value: string }

export const emptyAnswer = (p: Puzzle): Answer =>
  p.kind === 'order' ? { kind: 'order', value: [] } : p.kind === 'type' ? { kind: 'text', value: '' } : { kind: 'index', value: null }

export const isAnswered = (p: Puzzle, a: Answer): boolean =>
  a.kind === 'index' ? a.value !== null : a.kind === 'order' ? p.kind === 'order' && a.value.length === p.lines.length : normaliseTyped(a.value).length > 0

/** A stable shuffle of the order puzzle's lines that is never already in the right order. */
export const shuffledOrder = (p: Puzzle): number[] => {
  if (p.kind !== 'order') return []
  const rand = seeded(p.id)
  const idx = p.lines.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.every((v, i) => v === i) ? [...idx.slice(1), idx[0]] : idx
}

function Options({ options, value, onPick, locked, correct }: { options: string[]; value: number | null; onPick: (i: number) => void; locked: boolean; correct: number | null }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((opt, i) => {
        const chosen = value === i
        const right = correct === i
        return (
          <button key={opt} disabled={locked} onClick={() => onPick(i)} aria-pressed={chosen}
            className={cx('press rounded-2xl border-2 border-b-4 px-4 py-3.5 text-left font-mono text-[15px] font-bold transition-colors', right ? 'border-ok bg-green-soft text-ok' : chosen ? 'border-blue bg-blue-soft text-blue' : 'border-line bg-card text-body hover:bg-surface')}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/** Renders one puzzle and reports the answer as the player builds it. */
export function PuzzleBoard({ puzzle, answer, onChange, locked, reveal }: { puzzle: Puzzle; answer: Answer; onChange: (a: Answer) => void; locked: boolean; reveal: boolean }) {
  const pool = useMemo(() => shuffledOrder(puzzle), [puzzle])

  switch (puzzle.kind) {
    case 'output':
    case 'missing':
    case 'choice': {
      const value = answer.kind === 'index' ? answer.value : null
      return (
        <div className="space-y-4">
          {'code' in puzzle && puzzle.code && <Code code={puzzle.code} className="glow-blue" />}
          <Options options={puzzle.options} value={value} onPick={(i) => onChange({ kind: 'index', value: i })} locked={locked} correct={reveal ? puzzle.answer : null} />
        </div>
      )
    }
    case 'bug': {
      const value = answer.kind === 'index' ? answer.value : null
      const lines = puzzle.code.split('\n')
      return (
        <ol className="overflow-hidden rounded-2xl border-2 border-line bg-surface font-mono text-[14px]">
          {lines.map((line, i) => {
            const chosen = value === i
            const right = reveal && puzzle.answer === i
            return (
              <li key={i}>
                <button disabled={locked} onClick={() => onChange({ kind: 'index', value: i })} aria-pressed={chosen} aria-label={`Line ${i + 1}: ${line.trim() || 'blank'}`}
                  className={cx('flex w-full items-start gap-3 border-b border-line px-3 py-2.5 text-left last:border-b-0 transition-colors', right ? 'bg-green-soft text-ok' : chosen ? 'bg-blue-soft text-blue' : 'text-ink hover:bg-blue-soft/50')}>
                  <span className="tnum w-5 shrink-0 text-right text-faint">{i + 1}</span>
                  <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )
    }
    case 'order': {
      const chosen = answer.kind === 'order' ? answer.value : []
      const remaining = pool.filter((i) => !chosen.includes(i))
      return (
        <div className="space-y-4">
          <ol className="min-h-[120px] space-y-2 rounded-2xl border-2 border-dashed border-blue-line bg-blue-soft/40 p-3" aria-label="Your order">
            {chosen.length === 0 && <li className="py-6 text-center text-[14px] text-faint">Tap the lines below in the right order</li>}
            {chosen.map((i, at) => (
              <li key={i}>
                <button disabled={locked} onClick={() => onChange({ kind: 'order', value: chosen.filter((c) => c !== i) })}
                  className={cx('animate-pop flex w-full items-center gap-2 rounded-xl border-2 border-b-4 bg-card px-3 py-2 text-left font-mono text-[13px] font-bold', reveal ? (puzzle.lines[at] === puzzle.lines[i] ? 'border-ok text-ok' : 'border-bad text-bad') : 'border-blue-line text-ink')}>
                  <span className="tnum text-faint">{at + 1}</span><span className="whitespace-pre">{puzzle.lines[i]}</span>
                </button>
              </li>
            ))}
          </ol>
          <ul className="flex flex-wrap gap-2" aria-label="Lines to place">
            {remaining.map((i) => (
              <li key={i}>
                <button disabled={locked} onClick={() => onChange({ kind: 'order', value: [...chosen, i] })} aria-label={`Add line: ${puzzle.lines[i].trim()}`}
                  className="press rounded-xl border-2 border-b-4 border-line bg-card px-3 py-2 font-mono text-[13px] font-bold text-body hover:bg-surface">
                  <span className="whitespace-pre">{puzzle.lines[i].trim()}</span>
                </button>
              </li>
            ))}
          </ul>
          {chosen.length > 0 && !locked && (
            <button onClick={() => onChange({ kind: 'order', value: [] })} className="label inline-flex items-center gap-1.5 text-[12px] text-mute hover:text-body"><Undo2 size={14} strokeWidth={3} />Start over</button>
          )}
          {reveal && <Code code={puzzle.lines.join('\n')} />}
        </div>
      )
    }
    case 'type': {
      const value = answer.kind === 'text' ? answer.value : ''
      return (
        <div className="space-y-4">
          <Code code={puzzle.code} className="glow-blue" />
          <label className="block">
            <span className="label mb-1.5 block text-[12px] text-mute">Your code for ___</span>
            <input value={value} onChange={(e) => onChange({ kind: 'text', value: e.target.value })} disabled={locked} spellCheck={false} autoCapitalize="off" autoComplete="off"
              className="h-[52px] w-full rounded-2xl border-2 border-line bg-card px-4 font-mono text-[16px] text-ink outline-none focus:border-blue" placeholder="Type here" />
          </label>
          {reveal && <p className="font-mono text-[14px] font-bold text-ok">Answer: {puzzle.accepted[0]}</p>}
        </div>
      )
    }
  }
}
