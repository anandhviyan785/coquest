-- CoQuest database schema. Run this once in the Supabase SQL editor (or `supabase db push`).

-- Public profile: what leaderboards and duels show about a player.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar text not null default 'curious' check (char_length(avatar) <= 20000),
  xp integer not null default 0 check (xp >= 0),
  weekly_xp integer not null default 0 check (weekly_xp >= 0),
  week_start date not null default current_date,
  streak integer not null default 0 check (streak >= 0),
  league text not null default 'bronze' check (league in ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master')),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_weekly_idx on public.profiles (league, week_start, weekly_xp desc);
create index if not exists profiles_xp_idx on public.profiles (xp desc);

-- Private progress: lessons, daily activity, achievements, history. Only the owner can read it.
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per player per day for the daily-challenge leaderboard.
create table if not exists public.daily_results (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  username text not null,
  ms integer not null check (ms > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists daily_results_day_idx on public.daily_results (day, ms);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.daily_results enable row level security;

-- Profiles: any signed-in player can read; players write only their own row.
create policy "profiles are readable by signed-in players" on public.profiles for select to authenticated using (true);
create policy "players insert their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "players update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Progress: owner only.
create policy "players read their own progress" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "players insert their own progress" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "players update their own progress" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Daily results: readable by signed-in players; each player posts one time per day and cannot change it.
create policy "daily results are readable by signed-in players" on public.daily_results for select to authenticated using (true);
create policy "players post their own daily result" on public.daily_results for insert to authenticated with check ((select auth.uid()) = user_id and day = current_date);

-- ── Reminder emails ────────────────────────────────────────────────────────
-- Players get a reminder email about every 3 days unless they turn it off.
alter table public.profiles add column if not exists email_reminders boolean not null default true;
alter table public.profiles add column if not exists last_reminder_at timestamptz;

-- Players due a reminder: reminders on, a confirmed email, and none sent in p_every_days days.
-- The hour of slack stops a daily job that runs a few seconds early from skipping a day.
create or replace function public.reminder_candidates(p_every_days integer, p_limit integer)
returns table (user_id uuid, email text, username text, streak integer, xp integer, last_active text)
language sql
security definer
set search_path = public
as $$
  select p.id, u.email::text, p.username, p.streak, p.xp, pr.state->>'lastActive'
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.progress pr on pr.user_id = p.id
  where p.email_reminders
    and u.email is not null
    and u.email_confirmed_at is not null
    and (p.last_reminder_at is null or p.last_reminder_at <= now() - make_interval(days => p_every_days) + interval '1 hour')
  order by p.last_reminder_at nulls first
  limit p_limit;
$$;

revoke all on function public.reminder_candidates(integer, integer) from public, anon, authenticated;
grant execute on function public.reminder_candidates(integer, integer) to service_role;
