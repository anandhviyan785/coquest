import { CircleAlert, LoaderCircle, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CodeEditor } from '../components/CodeEditor'
import { LangLogo } from '../components/LangLogo'
import { Button, PageHeader, cx } from '../components/ui'
import { COURSES } from '../content'
import { explainError } from '../lib/errors'
import { compilerConfigured, previewDocument, runCode, warmRuntime } from '../lib/runner'
import type { RunResult } from '../lib/runner'
import type { LangId } from '../lib/types'
import { useApp } from '../state/AppContext'

const STARTERS: Record<LangId, string> = {
  python: '# Welcome to the playground. Write any Python you like.\nname = "explorer"\nfor step in range(1, 4):\n    print(f"Step {step}: keep going, {name}!")\n',
  javascript: '// Welcome to the playground. Write any JavaScript you like.\nconst name = "explorer";\nfor (let step = 1; step <= 3; step++) {\n  console.log(`Step ${step}: keep going, ${name}!`);\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    for (int step = 1; step <= 3; step++) {\n        cout << "Step " << step << endl;\n    }\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        for (int step = 1; step <= 3; step++) {\n            System.out.println("Step " + step);\n        }\n    }\n}\n',
  html: '<h1>My page</h1>\n<p>Edit this HTML and press Run to update the preview.</p>\n<ul>\n  <li>Learn</li>\n  <li>Practise</li>\n  <li>Battle</li>\n</ul>\n',
  css: 'h1 {\n  color: #1cb0f6;\n  font-size: 36px;\n}\n\n.card {\n  padding: 20px;\n  border-radius: 12px;\n  background-color: #e0f2fe;\n}\n',
  sql: "-- A sample table is ready for you: explorers(id, name, league, xp)\nSELECT league, COUNT(*) AS members, SUM(xp) AS total_xp\nFROM explorers\nGROUP BY league\nORDER BY total_xp DESC;\n",
}

const SQL_SETUP = `CREATE TABLE explorers (id INTEGER PRIMARY KEY, name TEXT, league TEXT, xp INTEGER);
INSERT INTO explorers (name, league, xp) VALUES ('Ada','Gold',1500),('Sam','Silver',620),('Lee','Gold',1320),('Mia','Bronze',90),('Kai','Silver',480);`

const CSS_MARKUP = '<h1>Styled heading</h1>\n<div class="card">A card to style. Try changing its colours and spacing.</div>\n<p>A paragraph of text.</p>\n<button>A button</button>'

const SAVE_KEY = 'pyquest:v1:playground'
const MAX_TRACKED_SECONDS = 30 * 60

const loadSaved = (): Partial<Record<LangId, string>> => {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as Partial<Record<LangId, string>>
  } catch {
    return {}
  }
}

export function Playground() {
  const { logTime } = useApp()
  const [lang, setLang] = useState<LangId>('python')
  const [sources, setSources] = useState<Partial<Record<LangId, string>>>(loadSaved)
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const openedAt = useRef(Date.now())
  const ran = useRef(false)

  const code = sources[lang] ?? STARTERS[lang]
  const isMarkup = lang === 'html' || lang === 'css'
  const remote = lang === 'cpp' || lang === 'java'

  useEffect(() => {
    warmRuntime(lang)
    setResult(null)
    setPreview(sources[lang] ?? STARTERS[lang])
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(sources))
    } catch (err) {
      console.error('Could not save playground code', err)
    }
  }, [sources])

  // Only count playground time as study time if the learner actually ran something.
  useEffect(() => {
    openedAt.current = Date.now()
    return () => {
      if (ran.current) logTime(Math.min((Date.now() - openedAt.current) / 1000, MAX_TRACKED_SECONDS))
    }
  }, [logTime])

  const setCode = (next: string) => setSources((all) => ({ ...all, [lang]: next }))

  const run = async () => {
    ran.current = true
    if (isMarkup) {
      setPreview(code)
      return
    }
    setBusy(true)
    const res = await runCode(lang, code, { stdin, setup: lang === 'sql' ? SQL_SETUP : undefined })
    setResult(res)
    setBusy(false)
  }

  const reset = () => {
    setSources((all) => ({ ...all, [lang]: STARTERS[lang] }))
    setPreview(STARTERS[lang])
    setResult(null)
  }

  const help = result?.error ? explainError(lang, result.error) : null

  return (
    <div>
      <PageHeader title="Playground" subtitle="A free space to experiment. Your code is kept in this browser between visits." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 overflow-x-auto rounded-xl border-2 border-line bg-card p-1" role="tablist" aria-label="Language">
          {COURSES.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === lang} onClick={() => setLang(c.id)} className={cx('flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition-colors', c.id === lang ? 'bg-blue text-white' : 'text-mute hover:text-ink')}>
              <LangLogo lang={c.id} size={18} />{c.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={reset} disabled={busy}><RotateCcw size={15} />Reset</Button>
          <Button onClick={run} disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}{isMarkup ? 'Update preview' : 'Run'}</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <CodeEditor lang={lang} value={code} onChange={setCode} height={500} />

        <div className="flex flex-col gap-4">
          {isMarkup ? (
            <div className="flex-1 overflow-hidden rounded-xl border-2 border-line bg-card" style={{ minHeight: 300 }}>
              <iframe title="Preview" sandbox="" srcDoc={previewDocument(lang, preview, lang === 'css' ? CSS_MARKUP : undefined)} className="h-full w-full" style={{ minHeight: 500 }} />
            </div>
          ) : (
            <>
              <div className="flex min-h-64 flex-1 flex-col overflow-hidden rounded-xl border-2 border-line bg-surface">
                <div className="flex items-center justify-between border-b-2 border-line px-4 py-2 text-[13px]">
                  <span className="font-medium text-mute">Terminal</span>
                  {result && !busy && <span className="tnum text-xs text-faint">{result.error ? 'exited with an error' : 'finished'} · {result.ms} ms</span>}
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed" aria-live="polite">
                  {busy && <p className="text-faint">{remote ? 'Compiling and running…' : 'Running…'}</p>}
                  {!busy && !result && <p className="text-faint">Press Run to execute your code.</p>}
                  {!busy && result && (
                    <>
                      {result.stdout && <pre className="whitespace-pre-wrap text-ink">{result.stdout}</pre>}
                      {result.stderr && <pre className="whitespace-pre-wrap text-gold-dark">{result.stderr}</pre>}
                      {result.error && <pre className="whitespace-pre-wrap text-bad">{result.error}</pre>}
                      {!result.stdout && !result.stderr && !result.error && <p className="text-faint">The program finished without printing anything.</p>}
                      {help && <p className="mt-3 flex gap-2 rounded-lg border-2 border-line bg-card p-3 font-sans text-[13px] text-body"><CircleAlert size={16} className="mt-0.5 shrink-0 text-ice" />{help}</p>}
                    </>
                  )}
                </div>
              </div>
              {lang !== 'sql' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-mute">Input (stdin) — one line per read</span>
                  <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} spellCheck={false} placeholder="Lines your program reads with input()" className="w-full resize-y rounded-xl border-2 border-line bg-surface px-3 py-2 font-mono text-[13px] outline-none placeholder:text-faint focus:border-sky" />
                </label>
              )}
            </>
          )}
          <p className="text-xs leading-relaxed text-faint">
            {isMarkup
              ? 'The preview renders in a sandboxed frame with scripts disabled.'
              : remote
                ? compilerConfigured ? 'C++ and Java are compiled and run on your Piston sandbox server, never on the CoQuest server.' : 'C++ and Java need a compile server: set VITE_PISTON_URL to a Piston instance you host.'
                : 'This code runs in an isolated worker inside your browser. Nothing is sent to a server, and runs are stopped after 8 seconds.'}
          </p>
        </div>
      </div>
    </div>
  )
}
