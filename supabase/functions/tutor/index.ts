// CoQuest AI tutor — Supabase Edge Function.
// Keeps ANTHROPIC_API_KEY on the server, verifies the caller, rate-limits per player and calls Claude.
//
//   supabase secrets set ANTHROPIC_API_KEY=...
//   supabase functions deploy tutor
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = 'claude-opus-5-5'
const DAILY_MESSAGE_LIMIT = 60
const MAX_TURNS = 24
const MAX_MESSAGE_CHARS = 12_500
const MAX_CODE_CHARS = 8_000
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
type Level = (typeof LEVELS)[number]

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const LEVEL_GUIDE: Record<Level, string> = {
  beginner: 'The learner is a beginner. Use everyday words, define any term the first time you use it, keep examples to a few lines, and introduce one idea at a time.',
  intermediate: 'The learner knows the basics (variables, conditions, loops, functions). You can use standard terminology and slightly longer examples.',
  advanced: 'The learner is comfortable with the language. Be concise, discuss trade-offs and idioms, and skip explanations of fundamentals unless asked.',
}

const systemPrompt = (level: Level, language: string): string => `You are the coding tutor inside CoQuest, a learning platform for students, teenagers and young adults. You speak as Quest, the platform's curious and encouraging explorer mascot — warm and a little playful, never childish, and never at the expense of being accurate.

${LEVEL_GUIDE[level]} The learner is currently working in ${language}; use it for examples unless they ask about another language.

How to help:
- Your goal is for the learner to understand and solve things themselves. When they are stuck on an exercise or a bug, give progressive hints: first a nudge toward where to look, then a more specific hint if they ask again, and only show a full solution when they explicitly ask for it or have clearly tried and are still blocked.
- When they share an error, say in plain language what it means, point to the line or construct responsible, and explain why it happens before suggesting a fix.
- When they ask for a practice question, give exactly one, matched to their level, and wait for their answer before revealing the solution. When they answer, tell them clearly whether it is right and why.
- When explaining a concept, lead with the idea in a sentence or two, then a short runnable example, then one thing people commonly get wrong.
- If you are not sure about something, say so. Do not invent functions, libraries or behaviour.
- Stay on programming and learning to code. If asked about something unrelated, say briefly that you are here for coding help and offer a way back.

Format replies in Markdown: fenced code blocks for code, backticks for inline code, short paragraphs, and lists only when the content is genuinely a list. Keep answers focused — most should fit on one screen.`

interface Turn { role: 'user' | 'assistant'; content: string }

const parseBody = (body: unknown): { messages: Turn[]; level: Level; language: string; code: string } | string => {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object.'
  const { messages, level, language, code } = body as Record<string, unknown>
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_TURNS) return `Send between 1 and ${MAX_TURNS} messages.`
  const turns: Turn[] = []
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'Each message must be an object.'
    const { role, content } = m as Record<string, unknown>
    if (role !== 'user' && role !== 'assistant') return 'Message roles must be "user" or "assistant".'
    if (typeof content !== 'string' || content.trim() === '' || content.length > MAX_MESSAGE_CHARS) return 'Message content is empty or too long.'
    turns.push({ role, content })
  }
  if (turns[0].role !== 'user' || turns[turns.length - 1].role !== 'user') return 'The conversation must start and end with a user message.'
  if (code !== undefined && (typeof code !== 'string' || code.length > MAX_CODE_CHARS)) return 'Attached code is too long.'
  return {
    messages: turns,
    level: LEVELS.includes(level as Level) ? (level as Level) : 'beginner',
    language: typeof language === 'string' && /^[A-Za-z+#]{1,16}$/.test(language) ? language : 'Python',
    code: typeof code === 'string' ? code : '',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey || !Deno.env.get('ANTHROPIC_API_KEY')) {
    console.error('tutor: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY')
    return json({ error: 'The tutor is not configured yet.' }, 503)
  }

  // Who is asking?
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Sign in to use the tutor.' }, 401)
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: auth, error: authError } = await admin.auth.getUser(token)
  if (authError || !auth.user) return json({ error: 'Sign in to use the tutor.' }, 401)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400)
  }
  const parsed = parseBody(raw)
  if (typeof parsed === 'string') return json({ error: parsed }, 400)

  // Rate limit before spending any tokens.
  const { data: allowed, error: limitError } = await admin.rpc('count_tutor_message', { p_user: auth.user.id, p_limit: DAILY_MESSAGE_LIMIT })
  if (limitError) {
    console.error('tutor: rate limit check failed', limitError)
    return json({ error: 'The tutor is unavailable right now. Try again shortly.' }, 503)
  }
  if (!allowed) return json({ error: `You have reached today's limit of ${DAILY_MESSAGE_LIMIT} tutor messages. It resets tomorrow.` }, 429)

  const messages: Anthropic.Beta.BetaMessageParam[] = parsed.messages.map((m) => ({ role: m.role, content: m.content }))
  if (parsed.code) {
    const last = messages[messages.length - 1]
    last.content = `${last.content}\n\nHere is my code:\n\`\`\`\n${parsed.code}\n\`\`\``
  }

  try {
    const client = new Anthropic()
    // Streamed so long answers cannot hit an HTTP timeout; the browser receives the finished reply.
    // If the primary model declines a request, the API retries it on a fallback model inside the same call.
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16_000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: systemPrompt(parsed.level, parsed.language), cache_control: { type: 'ephemeral' } }],
      messages,
    })
    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') return json({ error: 'The tutor cannot help with that request. Try asking about your code in a different way.' }, 422)
    const reply = message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('\n').trim()
    if (!reply) return json({ error: 'The tutor did not produce an answer. Try again.' }, 502)
    return json({ reply })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'The tutor is busy. Try again in a moment.' }, 429)
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('tutor: ANTHROPIC_API_KEY was rejected')
      return json({ error: 'The tutor is not configured correctly.' }, 503)
    }
    if (error instanceof Anthropic.APIError) {
      console.error('tutor: Claude API error', error.status, error.message)
      return json({ error: 'The tutor ran into a problem. Try again.' }, 502)
    }
    console.error('tutor: unexpected error', error)
    return json({ error: 'The tutor ran into a problem. Try again.' }, 500)
  }
})
