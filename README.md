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

## How code is executed

Learner code never runs on an application server.

| Language | Where it runs |
| --- | --- |
| Python | Pyodide (CPython on WebAssembly) in a Web Worker |
| JavaScript | A Web Worker with network and storage APIs removed |
| SQL | sql.js (SQLite on WebAssembly) in a Web Worker, fresh database per run |
| HTML, CSS | A sandboxed iframe with scripts disabled; tests parse the code rather than run it |
| C++, Java | A Piston sandbox service (`VITE_PISTON_URL`) |

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
