-- PyQuest database schema. Run this once in the Supabase SQL editor (or `supabase db push`).

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

-- Tutor usage, written by the `tutor` Edge Function to enforce a daily message limit.
create table if not exists public.tutor_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  messages integer not null default 0,
  primary key (user_id, day)
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.daily_results enable row level security;
alter table public.tutor_usage enable row level security;

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

-- tutor_usage has no policies: only the Edge Function's service role can touch it.

-- Atomically counts one tutor message and reports whether the player is still under the daily limit.
create or replace function public.count_tutor_message(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.tutor_usage (user_id, day, messages)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update set messages = public.tutor_usage.messages + 1
  returning messages into used;
  return used <= p_limit;
end;
$$;

revoke all on function public.count_tutor_message(uuid, integer) from public, anon, authenticated;
grant execute on function public.count_tutor_message(uuid, integer) to service_role;
