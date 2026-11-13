// Turns off reminder emails for one player. Linked from every reminder email.
//   supabase functions deploy unsubscribe --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2'
import { verifyUnsubscribe } from '../_shared/reminderEmail.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const page = (title: string, body: string, status = 200): Response =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background:#f7f7f7;color:#3c3c3c">
<div style="max-width:420px;margin:64px auto;padding:28px;background:#fff;border:2px solid #e5e5e5;border-radius:16px;text-align:center">
<p style="margin:0 0 12px;font-size:24px;font-weight:800;color:#1cb0f6">pyquest</p>
<h1 style="margin:0 0 8px;font-size:20px">${title}</h1><p style="margin:0;font-size:15px;line-height:1.5;color:#777">${body}</p></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') return page('Not allowed', 'This link only works from a reminder email.', 405)
  const url = new URL(req.url)
  const userId = url.searchParams.get('u') ?? ''
  const token = url.searchParams.get('t') ?? ''
  const secret = Deno.env.get('REMINDER_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!secret || !supabaseUrl || !serviceKey) return page('Something went wrong', 'Reminders could not be changed right now. Try again later.', 503)
  if (!UUID.test(userId) || !/^[0-9a-f]{64}$/.test(token) || !(await verifyUnsubscribe(userId, token, secret))) {
    return page('Link not valid', 'This unsubscribe link is incomplete or has been changed. You can also turn reminders off in PyQuest settings.', 400)
  }
  const admin = createClient(supabaseUrl, serviceKey)
  const { error } = await admin.from('profiles').update({ email_reminders: false }).eq('id', userId)
  if (error) {
    console.error('unsubscribe: update failed for', userId, error.message)
    return page('Something went wrong', 'Reminders could not be changed right now. Try again later.', 500)
  }
  return page('Reminders turned off', 'You will not get any more reminder emails. You can turn them back on in PyQuest settings.')
})
