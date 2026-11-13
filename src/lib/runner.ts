import type { CssTest, DomTest, Exercise, LangId, Test } from './types'

/**
 * Code execution. Learner code never runs on an application server:
 *  - Python, JavaScript and SQL run in dedicated Web Workers (WebAssembly runtimes for Python and SQL),
 *    which are terminated if they exceed the time limit.
 *  - HTML and CSS render in a sandboxed iframe (see Preview) and are checked by parsing, not executing.
 *  - C++ and Java compile on a Piston sandbox service you host, configured with VITE_PISTON_URL.
 */

export interface RunResult { stdout: string; stderr: string; error: string | null; timedOut: boolean; ms: number }
export interface RunOptions { stdin?: string; setup?: string; timeoutMs?: number }

const WORKER_LANGS = ['python', 'javascript', 'sql'] as const
type WorkerLang = (typeof WORKER_LANGS)[number]
const isWorkerLang = (lang: LangId): lang is WorkerLang => (WORKER_LANGS as readonly string[]).includes(lang)

const DEFAULT_TIMEOUT_MS = 8000
const LOAD_TIMEOUT_MS = 60_000
const MAX_OUTPUT_CHARS = 20_000

interface Job { resolve: (r: RunResult) => void; out: string[]; err: string[]; started: number; timer: ReturnType<typeof setTimeout> | null; timeoutMs: number; size: number }

class Sandbox {
  private worker: Worker | null = null
  private jobs = new Map<number, Job>()
  private nextId = 0
  private lang: WorkerLang

  constructor(lang: WorkerLang) {
    this.lang = lang
  }

  private spawn(): Worker {
    const worker = new Worker(`/workers/${this.lang}.js`)
    worker.onmessage = (event) => this.handle(event.data)
    worker.onerror = () => this.failAll('The code runner crashed. Try running again.')
    this.worker = worker
    return worker
  }

  /** Starts loading the runtime ahead of the first run. */
  warm(): void {
    if (!this.worker) this.spawn()
  }

  private kill(): void {
    this.worker?.terminate()
    this.worker = null
  }

  private finish(id: number, patch: Partial<RunResult>): void {
    const job = this.jobs.get(id)
    if (!job) return
    if (job.timer) clearTimeout(job.timer)
    this.jobs.delete(id)
    job.resolve({ stdout: job.out.join('\n'), stderr: job.err.join('\n'), error: null, timedOut: false, ms: Math.round(performance.now() - job.started), ...patch })
  }

  private failAll(error: string): void {
    this.kill()
    for (const id of [...this.jobs.keys()]) this.finish(id, { error })
  }

  private timeout(id: number, message: string): void {
    this.kill()
    this.finish(id, { error: message, timedOut: true })
    for (const other of [...this.jobs.keys()]) this.finish(other, { error: 'Run cancelled.' })
  }

  private handle(msg: { id?: number; type: string; text?: string; error?: string; message?: string }): void {
    if (msg.type === 'fatal') return this.failAll(msg.message ?? 'The runtime failed to load.')
    if (msg.id === undefined) return
    const job = this.jobs.get(msg.id)
    if (!job) return
    if (msg.type === 'start') {
      // The runtime is loaded and the learner's code is about to run: start the real clock.
      if (job.timer) clearTimeout(job.timer)
      job.started = performance.now()
      const id = msg.id
      job.timer = setTimeout(() => this.timeout(id, `Time limit exceeded (${job.timeoutMs / 1000}s). Is there an infinite loop?`), job.timeoutMs)
    } else if (msg.type === 'out' || msg.type === 'err') {
      const text = msg.text ?? ''
      job.size += text.length
      if (job.size > MAX_OUTPUT_CHARS) return this.timeout(msg.id, 'Output limit exceeded. Is something printing in a loop?')
      ;(msg.type === 'out' ? job.out : job.err).push(text)
    } else if (msg.type === 'done') {
      this.finish(msg.id, { error: msg.error ?? null })
    }
  }

  run(code: string, opts: RunOptions): Promise<RunResult> {
    const worker = this.worker ?? this.spawn()
    const id = ++this.nextId
    return new Promise((resolve) => {
      const loadTimer = setTimeout(() => this.timeout(id, 'The runtime took too long to load. Check your connection and try again.'), LOAD_TIMEOUT_MS)
      this.jobs.set(id, { resolve, out: [], err: [], started: performance.now(), timer: loadTimer, timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, size: 0 })
      worker.postMessage({ id, code, stdin: opts.stdin ?? '', setup: opts.setup ?? '' })
    })
  }
}

const sandboxes = new Map<WorkerLang, Sandbox>()
const sandboxFor = (lang: WorkerLang): Sandbox => {
  const existing = sandboxes.get(lang)
  if (existing) return existing
  const created = new Sandbox(lang)
  sandboxes.set(lang, created)
  return created
}

export const warmRuntime = (lang: LangId): void => {
  if (isWorkerLang(lang)) sandboxFor(lang).warm()
}

// ── Compiled languages (remote sandbox) ───────────────────────────────────
// The public Piston API became whitelist-only in February 2026, so there is no default endpoint:
// C++ and Java run only when VITE_PISTON_URL points at a Piston instance you host.
const PISTON_URL = ((import.meta.env.VITE_PISTON_URL as string | undefined) ?? '').replace(/\/$/, '')

/** True when a compile server is configured for C++ and Java. */
export const compilerConfigured = PISTON_URL !== ''

export const needsCompiler = (lang: LangId): boolean => lang === 'cpp' || lang === 'java'

export const COMPILER_HELP = 'C++ and Java need a compile server. Run your own Piston instance and set VITE_PISTON_URL in .env — the README explains how.'
const PISTON_LANG: Partial<Record<LangId, { language: string; file: string }>> = {
  cpp: { language: 'c++', file: 'main.cpp' },
  java: { language: 'java', file: 'Main.java' },
}

const runRemote = async (lang: LangId, code: string, opts: RunOptions): Promise<RunResult> => {
  const target = PISTON_LANG[lang]
  const started = performance.now()
  const fail = (error: string): RunResult => ({ stdout: '', stderr: '', error, timedOut: false, ms: Math.round(performance.now() - started) })
  if (!target) return fail(`${lang} cannot be executed.`)
  if (!compilerConfigured) return fail(COMPILER_HELP)
  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: target.language, version: '*', files: [{ name: target.file, content: code }], stdin: opts.stdin ?? '', run_timeout: 5000 }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return fail(`The ${lang === 'cpp' ? 'C++' : 'Java'} compile service refused the request (${res.status}). ${detail.slice(0, 160)}`.trim())
    }
    const data = (await res.json()) as { compile?: { stderr?: string; code?: number }; run?: { stdout?: string; stderr?: string; code?: number; signal?: string | null } }
    if (data.compile && data.compile.code !== 0) return fail(`Compile error:\n${(data.compile.stderr ?? '').trim()}`)
    const run = data.run ?? {}
    const killed = run.signal === 'SIGKILL'
    return {
      stdout: (run.stdout ?? '').replace(/\n$/, ''),
      stderr: '',
      error: killed ? 'Time limit exceeded. Is there an infinite loop?' : run.code ? (run.stderr ?? `Exited with code ${run.code}`).trim() : null,
      timedOut: killed,
      ms: Math.round(performance.now() - started),
    }
  } catch (err) {
    console.error('Remote execution failed', err)
    return fail('Could not reach the compile server at VITE_PISTON_URL. Check that it is running and allows requests from this site.')
  }
}

export const canExecute = (lang: LangId): boolean => isWorkerLang(lang) || lang in PISTON_LANG

export const runCode = (lang: LangId, code: string, opts: RunOptions = {}): Promise<RunResult> => {
  if (isWorkerLang(lang)) return sandboxFor(lang).run(code, opts)
  return runRemote(lang, code, opts)
}

// ── Tests ─────────────────────────────────────────────────────────────────
export interface TestOutcome { name: string; passed: boolean; expected?: string; actual?: string; error?: string | null }

const normalise = (text: string): string => text.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim()

const checkDom = (html: string, test: DomTest): TestOutcome => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let found: Element[]
  try {
    found = [...doc.querySelectorAll(test.selector)]
  } catch {
    return { name: test.name, passed: false, error: `Invalid selector in test: ${test.selector}` }
  }
  const wanted = test.text?.toLowerCase()
  const passed = wanted === undefined ? found.length > 0 : found.some((el) => (el.textContent ?? '').toLowerCase().includes(wanted))
  const actual = found.length === 0 ? `No <${test.selector}> element found` : `Found: ${normalise(found[0].textContent ?? '') || '(empty)'}`
  return { name: test.name, passed, expected: test.text ? `<${test.selector}> containing "${test.text}"` : `a <${test.selector}> element`, actual }
}

const squash = (v: string): string => v.toLowerCase().replace(/\s+/g, '').replace(/;$/, '')

const checkCss = (css: string, test: CssTest): TestOutcome => {
  const expected = `${test.selector} { ${test.prop}: ${test.value} }`
  let sheet: CSSStyleSheet
  try {
    sheet = new CSSStyleSheet()
    sheet.replaceSync(css)
  } catch (err) {
    return { name: test.name, passed: false, expected, error: err instanceof Error ? err.message : 'Invalid CSS' }
  }
  const rules = [...sheet.cssRules].filter((r): r is CSSStyleRule => r instanceof CSSStyleRule)
  const matching = rules.filter((r) => r.selectorText.split(',').some((s) => squash(s) === squash(test.selector)))
  const values = matching.map((r) => r.style.getPropertyValue(test.prop)).filter(Boolean)
  const passed = values.some((v) => squash(v) === squash(test.value))
  const actual = matching.length === 0 ? `No rule for ${test.selector}` : values.length === 0 ? `${test.prop} is not set on ${test.selector}` : `${test.prop}: ${values[values.length - 1]}`
  return { name: test.name, passed, expected, actual }
}

const runOutputTest = async (lang: LangId, code: string, test: Extract<Test, { expected: string }>, setup?: string): Promise<TestOutcome> => {
  const source = test.append ? `${code}\n${test.append}` : code
  const result = await runCode(lang, source, { stdin: test.stdin, setup })
  const actual = normalise(result.stdout)
  const expected = normalise(test.expected)
  return { name: test.name, passed: !result.error && actual === expected, expected, actual, error: result.error }
}

/** Runs every test for an exercise, in order. */
export const runTests = async (lang: LangId, code: string, exercise: Exercise): Promise<TestOutcome[]> => {
  const outcomes: TestOutcome[] = []
  for (const test of exercise.tests) {
    if (test.kind === 'dom') outcomes.push(checkDom(code, test))
    else if (test.kind === 'css') outcomes.push(checkCss(code, test))
    else outcomes.push(await runOutputTest(lang, code, test, exercise.setup))
  }
  return outcomes
}

/** A complete HTML document for the sandboxed preview iframe. */
export const previewDocument = (lang: LangId, code: string, markup?: string): string => {
  const base = '<style>body{font-family:system-ui,sans-serif;margin:16px;color:#0f172a;background:#fff}</style>'
  if (lang === 'css') return `<!doctype html><html><head>${base}<style>${code}</style></head><body>${markup ?? ''}</body></html>`
  return `<!doctype html><html><head>${base}</head><body>${code}</body></html>`
}
