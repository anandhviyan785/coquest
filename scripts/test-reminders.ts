/** Checks the reminder email builder, unsubscribe tokens and Gmail MIME encoding. Run: node scripts/test-reminders.ts */
import { writeFileSync } from 'node:fs'
import { buildReminder, reminderCopy, signUnsubscribe, toGmailRaw, verifyUnsubscribe } from '../supabase/functions/_shared/reminderEmail.ts'

let failed = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
  if (!ok) failed += 1
}

const base = { username: 'ada', streak: 0, xp: 0, lastActive: null, today: '2026-11-13', appUrl: 'https://coquest.example', unsubscribeUrl: 'https://x.supabase.co/functions/v1/unsubscribe?u=1&t=2' }

check('new player gets a first-lesson nudge', reminderCopy(base).subject.includes('first lesson'))
check('active player gets a streak message', reminderCopy({ ...base, streak: 5, xp: 120, lastActive: '2026-11-12' }).subject.startsWith('5-day streak'))
check('lapsed player gets a come-back message', reminderCopy({ ...base, streak: 0, xp: 300, lastActive: '2026-11-06' }).headline === 'It has been 7 days')

const hostile = buildReminder({ ...base, username: '<script>alert(1)</script>' })
check('username is HTML-escaped', !hostile.html.includes('<script>') && hostile.html.includes('&lt;script&gt;'))
check('every email has an unsubscribe link', hostile.html.includes(base.unsubscribeUrl.replace(/&/g, '&amp;')) && hostile.text.includes(base.unsubscribeUrl))

const id = '6f1c2b8e-1d2a-4e6f-9a3b-0c1d2e3f4a5b'
const token = await signUnsubscribe(id, 'test-secret')
check('valid token verifies', await verifyUnsubscribe(id, token, 'test-secret'))
check('token for another user fails', !(await verifyUnsubscribe('00000000-1d2a-4e6f-9a3b-0c1d2e3f4a5b', token, 'test-secret')))
check('token with wrong secret fails', !(await verifyUnsubscribe(id, token, 'other-secret')))

const email = buildReminder({ ...base, username: 'José', streak: 3, xp: 90, lastActive: '2026-11-13' })
const raw = toGmailRaw({ from: 'CoQuest <sender@gmail.com>', to: 'learner@gmail.com', email, unsubscribeUrl: base.unsubscribeUrl, boundary: 'B' })
const mime = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
check('raw is base64url', /^[A-Za-z0-9_-]+$/.test(raw))
check('non-ASCII subject is encoded', mime.includes('Subject: =?UTF-8?B?'))
check('has List-Unsubscribe headers', mime.includes('List-Unsubscribe: <') && mime.includes('List-Unsubscribe-Post: List-Unsubscribe=One-Click'))
check('has text and HTML parts', mime.includes('text/plain') && mime.includes('text/html') && mime.trimEnd().endsWith('--B--'))
let threw = false
try { toGmailRaw({ from: 'a@b.c', to: 'x@y.z\r\nBcc: evil@z.z', email, unsubscribeUrl: 'u' }) } catch { threw = true }
check('header injection in To is rejected', threw)

if (process.argv[2]) writeFileSync(process.argv[2], email.html)
console.log(failed === 0 ? 'all passed' : `${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
