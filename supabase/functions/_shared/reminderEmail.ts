/**
 * Builds PyQuest reminder emails and signs unsubscribe links.
 * No imports, so it runs unchanged in Supabase Edge Functions (Deno) and in Node for tests.
 */

export interface ReminderInput {
  username: string
  streak: number
  xp: number
  /** YYYY-MM-DD of the player's last learning day, or null if they never finished a lesson. */
  lastActive: string | null
  /** YYYY-MM-DD of today, in UTC. */
  today: string
  appUrl: string
  unsubscribeUrl: string
}

export interface ReminderEmail { subject: string; text: string; html: string }

const DAY_MS = 86_400_000

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Picks the message for where the player is: brand new, on a streak, or drifting away. */
export const reminderCopy = (input: ReminderInput): { subject: string; headline: string; body: string; cta: string } => {
  const { username, streak, xp, lastActive, today } = input
  if (!lastActive) {
    return {
      subject: `${username}, your first lesson is waiting`,
      headline: 'Your quest has not started yet',
      body: 'Your first Python lesson takes about five minutes. Write a real line of code and earn your first XP.',
      cta: 'Start my first lesson',
    }
  }
  const away = daysBetween(lastActive, today)
  if (away <= 1 && streak > 0) {
    return {
      subject: `${streak}-day streak, ${username}. Keep it going!`,
      headline: `You are on a ${streak}-day streak`,
      body: `You have earned ${xp.toLocaleString('en')} XP so far. One lesson today keeps the streak alive.`,
      cta: 'Continue my streak',
    }
  }
  return {
    subject: `We miss you, ${username}`,
    headline: `It has been ${away} days`,
    body: `You have ${xp.toLocaleString('en')} XP banked. Jump back in with a quick lesson and start a new streak today.`,
    cta: 'Pick up where I left off',
  }
}

export const buildReminder = (input: ReminderInput): ReminderEmail => {
  const copy = reminderCopy(input)
  const text = [
    `Hi ${input.username},`,
    '',
    copy.headline,
    copy.body,
    '',
    `${copy.cta}: ${input.appUrl}`,
    '',
    'You get these reminders about every 3 days.',
    `Stop them: ${input.unsubscribeUrl}`,
  ].join('\n')

  const e = escapeHtml
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${e(copy.subject)}</title>
<style>@media (max-width:520px){.pad{padding-left:20px!important;padding-right:20px!important}.cta{display:block!important;text-align:center!important}}</style>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#3c3c3c;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:2px solid #e5e5e5;border-radius:16px">
<tr><td class="pad" style="padding:28px 28px 0;font-size:26px;font-weight:800;color:#1cb0f6">pyquest</td></tr>
<tr><td class="pad" style="padding:20px 28px 0">
<p style="margin:0 0 6px;font-size:15px;color:#777777">Hi ${e(input.username)},</p>
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#3c3c3c">${e(copy.headline)}</h1>
<p style="margin:0;font-size:16px;line-height:1.55;color:#4b4b4b">${e(copy.body)}</p>
</td></tr>
<tr><td class="pad" style="padding:24px 28px 28px">
<a class="cta" href="${e(input.appUrl)}" style="display:inline-block;background:#1cb0f6;border-bottom:4px solid #1899d6;border-radius:14px;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;text-decoration:none;padding:16px 24px;mso-padding-alt:0">${e(copy.cta)}</a>
</td></tr>
</table>
<p style="max-width:480px;margin:14px auto 0;padding:0 8px;font-size:12px;line-height:1.5;color:#afafaf">You get these reminders about every 3 days. <a href="${e(input.unsubscribeUrl)}" style="color:#afafaf">Stop reminder emails</a>.</p>
</td></tr></table>
</body></html>`

  return { subject: copy.subject, text, html }
}

// ── Unsubscribe tokens ────────────────────────────────────────────────────
const hex = (buffer: ArrayBuffer): string => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** HMAC-SHA256 of the user id, so an unsubscribe link only works for the person it was sent to. */
export const signUnsubscribe = async (userId: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`unsubscribe:${userId}`)))
}

export const verifyUnsubscribe = async (userId: string, token: string, secret: string): Promise<boolean> => {
  const expected = await signUnsubscribe(userId, secret)
  if (expected.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}

// ── MIME message for the Gmail API ────────────────────────────────────────
const base64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
const b64Utf8 = (text: string): string => base64(new TextEncoder().encode(text))
const encodeHeader = (text: string): string => (/^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${b64Utf8(text)}?=`)
const wrap76 = (text: string): string => text.replace(/.{1,76}/g, '$&\r\n').trimEnd()

/** A multipart (text + HTML) message, base64url-encoded as the Gmail API's `raw` field expects. */
export const toGmailRaw = (opts: { from: string; to: string; email: ReminderEmail; unsubscribeUrl: string; boundary?: string }): string => {
  if (/[\r\n]/.test(opts.to) || /[\r\n]/.test(opts.from)) throw new Error('Invalid address')
  const boundary = opts.boundary ?? `pyq_${crypto.randomUUID().replace(/-/g, '')}`
  const mime = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeHeader(opts.email.subject)}`,
    'MIME-Version: 1.0',
    `List-Unsubscribe: <${opts.unsubscribeUrl}>`,
    'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64Utf8(opts.email.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64Utf8(opts.email.html)),
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return b64Utf8(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
