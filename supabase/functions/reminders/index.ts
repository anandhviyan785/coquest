// PyQuest reminder emails — Supabase Edge Function, run once a day by pg_cron (see supabase/cron.sql).
// Emails every player who has reminders on and has not had one for REMINDER_EVERY_DAYS days,
// sending through the Gmail API from the Gmail account named in GMAIL_SENDER.
//
//   supabase secrets set GMAIL_SENDER=you@gmail.com GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
//     GMAIL_REFRESH_TOKEN=... CRON_SECRET=... REMINDER_SECRET=... APP_URL=https://your-site
//   supabase functions deploy reminders --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildReminder, signUnsubscribe, toGmailRaw } from '../_shared/reminderEmail.ts'

const REMINDER_EVERY_DAYS = 3
/** Consumer Gmail accounts can send about 500 messages a day; stay under it. Anyone left over is sent next run. */
const MAX_PER_RUN = 400

const env = (name: string): string => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing secret ${name}`)
  return value
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Exchanges the stored refresh token for a short-lived Gmail access token. */
const gmailAccessToken = async (): Promise<string> => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      client_secret: env('GOOGLE_CLIENT_SECRET'),
      refresh_token: env('GMAIL_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || typeof data.access_token !== 'string') throw new Error(`Google token exchange failed (${res.status}): ${data.error ?? 'unknown'}`)
  return data.access_token
}

const sendGmail = async (accessToken: string, raw: string): Promise<void> => {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) throw new Error(`Gmail send failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
}

interface Candidate { user_id: string; email: string; username: string; streak: number; xp: number; last_active: string | null }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  // Only the scheduler, which holds CRON_SECRET, may trigger a send.
  let secret: string
  try {
    secret = env('CRON_SECRET')
  } catch (err) {
    console.error('reminders:', (err as Error).message)
    return json({ error: 'Not configured' }, 503)
  }
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return json({ error: 'Unauthorized' }, 401)

  try {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
    const { data, error } = await admin.rpc('reminder_candidates', { p_every_days: REMINDER_EVERY_DAYS, p_limit: MAX_PER_RUN })
    if (error) throw new Error(`Could not list players: ${error.message}`)
    const candidates = (data ?? []) as Candidate[]
    if (candidates.length === 0) return json({ sent: 0, failed: 0 })

    const accessToken = await gmailAccessToken()
    const sender = env('GMAIL_SENDER')
    const appUrl = env('APP_URL').replace(/\/$/, '')
    const fnUrl = `${env('SUPABASE_URL')}/functions/v1/unsubscribe`
    const reminderSecret = env('REMINDER_SECRET')
    const today = new Date().toISOString().slice(0, 10)

    let sent = 0
    const failures: string[] = []
    for (const c of candidates) {
      try {
        const token = await signUnsubscribe(c.user_id, reminderSecret)
        const unsubscribeUrl = `${fnUrl}?u=${encodeURIComponent(c.user_id)}&t=${token}`
        const email = buildReminder({ username: c.username, streak: c.streak, xp: c.xp, lastActive: c.last_active, today, appUrl, unsubscribeUrl })
        await sendGmail(accessToken, toGmailRaw({ from: `PyQuest <${sender}>`, to: c.email, email, unsubscribeUrl }))
        const { error: markError } = await admin.from('profiles').update({ last_reminder_at: new Date().toISOString() }).eq('id', c.user_id)
        if (markError) throw new Error(`sent but not recorded: ${markError.message}`)
        sent += 1
      } catch (err) {
        // Log the user id, never the email address.
        console.error('reminders: failed for', c.user_id, (err as Error).message)
        failures.push(c.user_id)
      }
    }
    return json({ sent, failed: failures.length })
  } catch (err) {
    console.error('reminders:', (err as Error).message)
    return json({ error: 'Reminder run failed' }, 500)
  }
})
