# PyQuest

A gamified platform for learning to code: a lesson path for seven languages, a real in-browser code runner, XP, streaks, leagues, boss battles, live duels, daily challenges and an AI tutor. QUEST, the mascot, guides the way.

Built with React, TypeScript, Tailwind CSS, Lucide, Recharts, Monaco and Supabase.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5183. With no configuration PyQuest runs in **local mode**: pick a username and everything works on this device, with progress saved in the browser.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run verify` | Run every exercise's reference solution against its tests |
| `npm run test:reminders` | Test the reminder email builder and unsubscribe tokens |
| `npm run lint` | Lint with oxlint |

## Local mode vs. cloud mode

| Feature | Local mode | With Supabase |
| --- | --- | --- |
| Lessons, playground, bosses, daily challenge | Yes | Yes |
| XP, levels, streaks, achievements, statistics | Saved in the browser | Synced to your account |
| Accounts (email + password) | No — username only | Yes |
| Leaderboards | Shows only you | Everyone in your league |
| Duels | Between two tabs of one browser | Over the internet |
| AI tutor | Off | On, once the function is deployed |

## Connect Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key, then restart the dev server.

### Turn on the AI tutor

The tutor calls Claude from a Supabase Edge Function so the API key never reaches the browser. It verifies the signed-in player and allows 60 messages per player per day.

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=<your-key>
supabase functions deploy tutor
```

Set `ALLOWED_ORIGIN` as a secret too if you want to restrict the function to your site's origin.

## Sign in with Google and reminder emails through Gmail

Both need the Supabase project connected (above). One Google OAuth client is used for both.

**1. Create a Google OAuth client** (Google Cloud Console → APIs & Services)

- Create a project, then enable the **Gmail API** for it.
- OAuth consent screen: External. Add the scope `https://www.googleapis.com/auth/gmail.send`. Then **publish the app** (Publishing status → In production). While it stays in *Testing*, Google expires the Gmail refresh token after 7 days and reminders stop.
- Credentials → Create OAuth client ID → Web application. Add these authorised redirect URIs:
  - `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (Google sign-in)
  - `https://developers.google.com/oauthplayground` (to get the Gmail token in step 3)

**2. Turn on Google sign-in** — Supabase dashboard → Authentication → Providers → Google: paste the client ID and secret. Under Authentication → URL Configuration, set the Site URL to where PyQuest is hosted. A **Continue with Google** button then appears on the welcome, sign-up and log-in screens.

**3. Get a Gmail refresh token for the sending account** — open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground), click the gear, tick *Use your own OAuth credentials* and paste the client ID and secret. Authorise `https://www.googleapis.com/auth/gmail.send` while signed in to the Gmail account the reminders should come from, then exchange the code and copy the **refresh token**.

**4. Store the secrets and deploy the functions**

```bash
supabase secrets set GOOGLE_CLIENT_ID=<id> GOOGLE_CLIENT_SECRET=<secret> GMAIL_REFRESH_TOKEN=<token> GMAIL_SENDER=<you@gmail.com> APP_URL=<https://your-site> CRON_SECRET=<long random string> REMINDER_SECRET=<another long random string>
supabase functions deploy reminders --no-verify-jwt
supabase functions deploy unsubscribe --no-verify-jwt
```

**5. Schedule it** — run `supabase/schema.sql` again (it adds the reminder columns safely), then fill in the placeholders in `supabase/cron.sql` and run it. The job runs daily at 16:00 UTC and emails every player who has reminders on and has not had one for 3 days, so everyone gets one at least every 3 days. To check it without waiting, call the function yourself:

```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/reminders -H "Authorization: Bearer <CRON_SECRET>"
```

How it behaves:

- The message adapts: a first-lesson nudge for new players, a streak message for active ones, and a come-back message for anyone who has drifted away.
- Every email has an unsubscribe link (signed, so it only works for that player) and one-click unsubscribe headers. Players can also switch reminders off in Settings.
- Emails are a single 480px column that fits phone screens. `npm run test:reminders` checks the email builder, the unsubscribe tokens and the Gmail message encoding.
- A personal Gmail account can send about 500 emails a day, so each run sends at most 400. Anyone left over gets theirs the next day. For more players, use a Google Workspace account (about 2,000 a day) or a dedicated email service.
- Accounts made in local mode (no Supabase) have no email address, so they get no reminders.

## How code is executed

Learner code never runs on an application server.

| Language | Where it runs |
| --- | --- |
| Python | Pyodide (CPython on WebAssembly) in a Web Worker |
| JavaScript | A Web Worker with network and storage APIs removed |
| SQL | sql.js (SQLite on WebAssembly) in a Web Worker, fresh database per run |
| HTML, CSS | A sandboxed iframe with scripts disabled; tests parse the code rather than run it |
| C++, Java | A Piston sandbox server you host (`VITE_PISTON_URL`). Not available until you set one: the public Piston API has been whitelist-only since February 2026 |

Workers are terminated after 8 seconds or 20,000 characters of output, so infinite loops cannot hang the page.

## Project layout

```
src/
  content/      Courses, lessons, bosses and the challenge pool (data only)
  lib/          Game rules, code runner, persistence, duel messaging, tutor client
  state/        App context: auth, progress and XP-earning actions
  components/   Mascot, editor, workbench, layout and UI primitives
  pages/        One file per screen
public/workers/ Sandboxed runtimes
supabase/       Database schema and the tutor Edge Function
scripts/        Content verification
```

## Notes for production

- XP is computed in the browser and saved by the client. Row-level security stops players editing each other's data, but a determined player can inflate their own score. For prize-bearing competitions, move scoring into Edge Functions.
- The daily challenge pool and the duel problems are Python. Other languages have a two-unit starter course each; Python has the full six units.
