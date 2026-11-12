import { Check, CircleAlert, Lightbulb, LoaderCircle, Play, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { explainError } from '../lib/errors'
import { canExecute, previewDocument, runCode, runTests, warmRuntime } from '../lib/runner'
import type { RunResult, TestOutcome } from '../lib/runner'
import type { Exercise, LangId } from '../lib/types'
import { CodeEditor } from './CodeEditor'
import { Button, Prose, cx } from './ui'

export interface CheckSummary { passed: boolean; passedCount: number; total: number; hintsUsed: number; code: string }

interface Props {
  lang: LangId
  exercise: Exercise
  /** Called after every "Check answer", pass or fail. */
  onCheck?: (summary: CheckSummary) => void
  /** Called whenever the learner edits the code. */
  onCodeChange?: (code: string) => void
  editorHeight?: number
  showHints?: boolean
  disabled?: boolean
}

type Tab = 'output' | 'tests'

const firstStdin = (exercise: Exercise): string => {
  const withInput = exercise.tests.find((t) => t.kind !== 'dom' && t.kind !== 'css' && t.stdin)
  return withInput && 'stdin' in withInput ? withInput.stdin ?? '' : ''
}

export function Workbench({ lang, exercise, onCheck, onCodeChange, editorHeight = 300, showHints = true, disabled = false }: Props) {
  const [code, setCode] = useState(exercise.starter)
  const [stdin, setStdin] = useState(() => firstStdin(exercise))
  const [result, setResult] = useState<RunResult | null>(null)
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null)
  const [busy, setBusy] = useState<'run' | 'check' | null>(null)
  const [tab, setTab] = useState<Tab>('output')
  const [hints, setHints] = useState(0)
  const [preview, setPreview] = useState(exercise.starter)
  const alive = useRef(true)

  const isMarkup = lang === 'html' || lang === 'css'
  const usesStdin = useMemo(() => firstStdin(exercise) !== '', [exercise])

  useEffect(() => {
    alive.current = true
    warmRuntime(lang)
    return () => {
      alive.current = false
    }
  }, [lang])

  const update = (next: string) => {
    setCode(next)
    onCodeChange?.(next)
  }

  const run = async () => {
    if (isMarkup) {
      setPreview(code)
      return
    }
    setBusy('run')
    setTab('output')
    const res = await runCode(lang, code, { stdin, setup: exercise.setup })
    if (!alive.current) return
    setResult(res)
    setBusy(null)
  }

  const check = async () => {
    setBusy('check')
    setTab('tests')
    if (isMarkup) setPreview(code)
    const results = await runTests(lang, code, exercise)
    if (!alive.current) return
    setOutcomes(results)
    setBusy(null)
    const passedCount = results.filter((r) => r.passed).length
    onCheck?.({ passed: passedCount === results.length, passedCount, total: results.length, hintsUsed: hints, code })
  }

  const reset = () => {
    update(exercise.starter)
    setPreview(exercise.starter)
    setResult(null)
    setOutcomes(null)
  }

  const errorHelp = result?.error ? explainError(lang, result.error) : null
  const allPassed = outcomes !== null && outcomes.every((o) => o.passed)

  return (
    <div className="space-y-4">
      <Prose text={exercise.prompt} />

      {lang === 'sql' && exercise.setup && (
        <details className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm">
          <summary className="cursor-pointer text-mute">Show the tables this query runs against</summary>
          <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-[#cfe3ff]">{exercise.setup}</pre>
        </details>
      )}

      <div className={cx('grid gap-4', isMarkup && 'lg:grid-cols-2')}>
        <CodeEditor lang={lang} value={code} onChange={update} height={editorHeight} readOnly={disabled} />
        {isMarkup && (
          <div className="overflow-hidden rounded-xl border border-line bg-white" style={{ height: editorHeight }}>
            <iframe title="Preview" sandbox="" srcDoc={previewDocument(lang, preview, exercise.markup)} className="h-full w-full" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={run} disabled={busy !== null || disabled || (!isMarkup && !canExecute(lang))}>
          {busy === 'run' ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}
          {isMarkup ? 'Update preview' : 'Run'}
        </Button>
        <Button onClick={check} disabled={busy !== null || disabled}>
          {busy === 'check' ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
          Check answer
        </Button>
        <Button variant="ghost" onClick={reset} disabled={busy !== null || disabled}><RotateCcw size={15} />Reset</Button>
        {showHints && exercise.hints.length > 0 && (
          <Button variant="ghost" className="ml-auto" onClick={() => setHints((n) => Math.min(n + 1, exercise.hints.length))} disabled={hints >= exercise.hints.length}>
            <Lightbulb size={15} />
            {hints === 0 ? 'Hint' : hints < exercise.hints.length ? 'Another hint' : 'No more hints'}
          </Button>
        )}
      </div>

      {hints > 0 && (
        <ol className="space-y-2">
          {exercise.hints.slice(0, hints).map((hint, i) => (
            <li key={i} className="animate-rise flex gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-sm">
              <span className="tnum font-semibold text-gold">{i + 1}</span>
              <Prose text={hint} className="!text-sm" />
            </li>
          ))}
        </ol>
      )}

      {usesStdin && !isMarkup && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-mute">Input — one line per input() call, used when you press Run</span>
          <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2} spellCheck={false} className="w-full resize-y rounded-xl border border-line bg-bg px-3 py-2 font-mono text-[13px] outline-none focus:border-sky" />
        </label>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-bg">
        <div className="flex border-b border-line text-[13px]" role="tablist">
          {(isMarkup ? (['tests'] as Tab[]) : (['output', 'tests'] as Tab[])).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t || isMarkup} onClick={() => setTab(t)} className={cx('px-4 py-2 font-medium capitalize', tab === t || isMarkup ? 'text-ink shadow-[inset_0_-2px_0_var(--color-cyan)]' : 'text-mute hover:text-ink')}>
              {t === 'tests' && outcomes ? `Tests ${outcomes.filter((o) => o.passed).length}/${outcomes.length}` : t}
            </button>
          ))}
          {result && tab === 'output' && !isMarkup && <span className="tnum ml-auto self-center pr-4 text-xs text-faint">{result.ms} ms</span>}
        </div>

        {tab === 'output' && !isMarkup ? (
          <div className="min-h-24 p-4 font-mono text-[13px] leading-relaxed" aria-live="polite">
            {busy === 'run' && <p className="text-faint">Running…</p>}
            {!busy && !result && <p className="text-faint">Press Run to see your program&apos;s output here.</p>}
            {result && busy !== 'run' && (
              <>
                {result.stdout && <pre className="whitespace-pre-wrap text-[#d5e4ff]">{result.stdout}</pre>}
                {result.stderr && <pre className="whitespace-pre-wrap text-gold">{result.stderr}</pre>}
                {result.error && <pre className="whitespace-pre-wrap text-bad">{result.error}</pre>}
                {!result.stdout && !result.stderr && !result.error && <p className="text-faint">The program finished without printing anything.</p>}
                {errorHelp && (
                  <p className="mt-3 flex gap-2 rounded-lg border border-line bg-card p-3 font-sans text-[13px] text-[#d5deeb]">
                    <CircleAlert size={16} className="mt-0.5 shrink-0 text-ice" />
                    {errorHelp}
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="min-h-24 p-3" aria-live="polite">
            {busy === 'check' && <p className="p-1 text-[13px] text-faint">Running tests…</p>}
            {!busy && !outcomes && <p className="p-1 text-[13px] text-faint">Press Check answer to run {exercise.tests.length} test{exercise.tests.length === 1 ? '' : 's'}.</p>}
            {outcomes && busy !== 'check' && (
              <ul className="space-y-1.5">
                {outcomes.map((o) => (
                  <li key={o.name} className={cx('rounded-lg border px-3 py-2 text-[13px]', o.passed ? 'border-ok/25 bg-ok/[0.06]' : 'border-bad/30 bg-bad/[0.06]')}>
                    <div className="flex items-center gap-2 font-medium">
                      {o.passed ? <Check size={15} className="text-ok" /> : <X size={15} className="text-bad" />}
                      {o.name}
                    </div>
                    {!o.passed && (
                      <dl className="mt-2 grid gap-x-3 gap-y-1 pl-6 font-mono text-xs sm:grid-cols-[auto_1fr]">
                        {o.error ? (
                          <><dt className="text-faint">Error</dt><dd className="whitespace-pre-wrap text-bad">{o.error}</dd></>
                        ) : (
                          <>
                            <dt className="text-faint">Expected</dt><dd className="whitespace-pre-wrap text-[#d5e4ff]">{o.expected || '(nothing)'}</dd>
                            <dt className="text-faint">Got</dt><dd className="whitespace-pre-wrap text-gold">{o.actual || '(nothing)'}</dd>
                          </>
                        )}
                      </dl>
                    )}
                    {!o.passed && o.error && explainError(lang, o.error) && <p className="mt-2 pl-6 text-xs text-mute">{explainError(lang, o.error)}</p>}
                  </li>
                ))}
              </ul>
            )}
            {allPassed && busy !== 'check' && <p className="mt-2 px-1 text-[13px] font-medium text-ok">All tests passed.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
