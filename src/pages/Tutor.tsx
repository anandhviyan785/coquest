import { Bug, Code2, Dumbbell, Lightbulb, MessageCircleQuestion, Send, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { Markdown } from '../components/Markdown'
import { Mascot, MascotAvatar } from '../components/Mascot'
import { Button, PageHeader, cx } from '../components/ui'
import { COURSES } from '../content'
import { levelFromXp, totals } from '../lib/gamification'
import { MAX_CODE_CHARS, MAX_MESSAGE_CHARS, askTutor, skillLevelFor } from '../lib/tutor'
import type { TutorMessage } from '../lib/tutor'
import type { LangId } from '../lib/types'
import { useApp } from '../state/AppContext'

const HISTORY_KEY = 'pyquest:v1:tutor'
const MAX_SAVED = 40

const STARTERS = [
  { icon: MessageCircleQuestion, label: 'Explain a concept', prompt: 'Explain what a function is and why I would use one, with a small example.' },
  { icon: Bug, label: 'Debug my code', prompt: 'My code is not working. Help me find the bug without just giving me the answer.', needsCode: true },
  { icon: Dumbbell, label: 'Practice question', prompt: 'Give me one practice question that suits my level, then wait for my answer.' },
  { icon: Lightbulb, label: 'Give me a hint', prompt: 'I am stuck on this code. Give me a small hint to get moving again, not the solution.', needsCode: true },
]

const loadHistory = (): TutorMessage[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as TutorMessage[]).slice(-MAX_SAVED) : []
  } catch {
    return []
  }
}

export function Tutor() {
  const { state, cloud } = useApp()
  const [messages, setMessages] = useState<TutorMessage[]>(loadHistory)
  const [draft, setDraft] = useState('')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [lang, setLang] = useState<LangId>('python')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const skill = skillLevelFor(levelFromXp(state.xp), totals(state).lessons)

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_SAVED)))
    } catch (err) {
      console.error('Could not save the tutor conversation', err)
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const send = async (text: string) => {
    const content = text.trim().slice(0, MAX_MESSAGE_CHARS)
    if (!content || busy || !cloud) return
    const attached = showCode && code.trim() ? code : undefined
    const shown = attached ? `${content}\n\n\`\`\`\n${attached.slice(0, MAX_CODE_CHARS)}\n\`\`\`` : content
    const next: TutorMessage[] = [...messages, { role: 'user', content: shown }]
    setMessages(next)
    setDraft('')
    setError(null)
    setBusy(true)
    try {
      const reply = await askTutor(next, { level: skill, language: COURSES.find((c) => c.id === lang)?.name ?? 'Python' })
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The tutor could not answer. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(draft)
    }
  }

  const pickStarter = (starter: (typeof STARTERS)[number]) => {
    if (starter.needsCode) {
      setShowCode(true)
      setDraft(starter.prompt)
      return
    }
    void send(starter.prompt)
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[520px] flex-col">
      <PageHeader
        title="AI Tutor"
        subtitle={`Ask anything about code. Answers are pitched at ${skill} level, based on your progress.`}
        action={messages.length > 0 ? <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setError(null) }}><Trash2 size={14} />Clear chat</Button> : undefined}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex-1 overflow-y-auto p-5" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <Mascot expression={cloud ? 'curious' : 'thinking'} size={120} />
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{cloud ? 'What shall we figure out?' : 'The tutor is not connected yet'}</h2>
              {cloud ? (
                <>
                  <p className="mt-1.5 text-sm text-mute">I can explain ideas, help you debug, set practice questions and nudge you with hints.</p>
                  <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
                    {STARTERS.map((s) => (
                      <button key={s.label} onClick={() => pickStarter(s)} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm font-medium transition-colors hover:border-sky/60">
                        <s.icon size={17} className="shrink-0 text-cyan" />{s.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  The tutor runs on Claude through a Supabase Edge Function, so the API key never reaches the browser. Add your Supabase keys, deploy the <code className="font-mono text-ice">tutor</code> function and set <code className="font-mono text-ice">ANTHROPIC_API_KEY</code> — the README has the three commands.
                </p>
              )}
            </div>
          ) : (
            <ol className="mx-auto max-w-3xl space-y-5">
              {messages.map((m, i) => (
                <li key={i} className={cx('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                  {m.role === 'assistant' ? <MascotAvatar expression="happy" size={34} /> : <Avatar avatar={state.avatar} size={34} />}
                  <div className={cx('min-w-0 max-w-[85%] rounded-2xl px-4 py-3', m.role === 'user' ? 'rounded-tr-sm bg-blue/25' : 'rounded-tl-sm border border-line bg-surface')}>
                    <Markdown text={m.content} />
                  </div>
                </li>
              ))}
              {busy && (
                <li className="flex gap-3">
                  <MascotAvatar expression="thinking" size={34} />
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-4" aria-label="The tutor is thinking">
                    {[0, 1, 2].map((n) => <span key={n} className="h-1.5 w-1.5 animate-pulse rounded-full bg-mute" style={{ animationDelay: `${n * 180}ms` }} />)}
                  </div>
                </li>
              )}
            </ol>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="border-t border-bad/40 bg-bad/10 px-5 py-2.5 text-sm text-bad" role="alert">{error}</p>}

        <form onSubmit={submit} className="border-t border-line bg-surface p-3">
          <div className="mx-auto max-w-3xl">
            {showCode && (
              <div className="mb-2 rounded-xl border border-line bg-bg">
                <div className="flex items-center gap-2 border-b border-line px-3 py-1.5">
                  <span className="text-xs font-medium text-mute">Attached code</span>
                  <select value={lang} onChange={(e) => setLang(e.target.value as LangId)} aria-label="Code language" className="ml-auto rounded-md border border-line bg-card px-2 py-1 text-xs outline-none">
                    {COURSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => { setShowCode(false); setCode('') }} aria-label="Remove attached code" className="text-faint hover:text-ink"><X size={15} /></button>
                </div>
                <textarea value={code} onChange={(e) => setCode(e.target.value.slice(0, MAX_CODE_CHARS))} rows={5} spellCheck={false} placeholder="Paste the code you want help with" className="block w-full resize-y bg-transparent px-3 py-2 font-mono text-[13px] outline-none placeholder:text-faint" />
              </div>
            )}
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setShowCode((v) => !v)} aria-pressed={showCode} aria-label="Attach code" disabled={!cloud} className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40', showCode ? 'border-sky bg-raised text-ice' : 'border-line text-mute hover:text-ink')}><Code2 size={18} /></button>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_CHARS))} onKeyDown={onKeyDown} rows={1} disabled={!cloud} placeholder={cloud ? 'Ask the tutor…  (Enter to send, Shift+Enter for a new line)' : 'Connect Supabase to chat with the tutor'} aria-label="Message" className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-faint focus:border-sky disabled:opacity-50" />
              <Button type="submit" className="h-11 w-11 !px-0" disabled={!cloud || busy || !draft.trim()} aria-label="Send"><Send size={17} /></Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
