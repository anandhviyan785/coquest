-- CoQuest Daily Rewards and Daily Puzzle. Run after schema.sql (safe to run again).
--
-- Rewards are decided here, not in the browser. Each table's primary key (player, day) means a
-- second claim on the same day fails, even if two requests race. Players can read their own rows
-- but cannot insert or change them directly: only these functions write them.

create table if not exists public.reward_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  cycle_day smallint not null check (cycle_day between 1 and 7),
  rarity text not null check (rarity in ('rare', 'epic', 'legendary')),
  xp integer not null check (xp >= 0),
  gems integer not null check (gems >= 0),
  savers smallint not null check (savers >= 0),
  bonus_chest text check (bonus_chest in ('rare', 'epic', 'legendary')),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.puzzle_results (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  lang text not null check (lang in ('python', 'javascript', 'cpp', 'java', 'html', 'css', 'sql')),
  puzzle_id text not null check (char_length(puzzle_id) <= 40),
  difficulty smallint not null check (difficulty between 1 and 3),
  solved boolean not null,
  attempts smallint not null check (attempts between 1 and 3),
  xp integer not null check (xp >= 0),
  gems integer not null check (gems >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Every gem a server function grants, for auditing.
create table if not exists public.gem_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists gem_ledger_user_idx on public.gem_ledger (user_id, created_at desc);

alter table public.reward_claims enable row level security;
alter table public.puzzle_results enable row level security;
alter table public.gem_ledger enable row level security;

drop policy if exists "players read their own reward claims" on public.reward_claims;
create policy "players read their own reward claims" on public.reward_claims for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "players read their own puzzle results" on public.puzzle_results;
create policy "players read their own puzzle results" on public.puzzle_results for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "players read their own gem ledger" on public.gem_ledger;
create policy "players read their own gem ledger" on public.gem_ledger for select to authenticated using ((select auth.uid()) = user_id);

-- A repeatable number in [0, 1) for a seed, so a chest cannot be re-rolled.
create or replace function public.seeded_random(p_seed text)
returns double precision
language sql
immutable
as $$
  select ('x' || substr(md5(p_seed), 1, 8))::bit(32)::bigint / 4294967296.0;
$$;

-- The day sent by the browser is its local date; it must be within a day of the server's date.
create or replace function public.check_player_day(p_day date)
returns void
language plpgsql
as $$
begin
  if p_day < current_date - 1 or p_day > current_date + 1 then
    raise exception 'invalid_day';
  end if;
end;
$$;

create or replace function public.claim_daily_reward(p_day date)
returns table (cycle_day smallint, rarity text, xp integer, gems integer, savers smallint, bonus_chest text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_prev smallint;
  v_cycle smallint;
  v_rarity text;
  v_seed text;
  v_xp integer;
  v_gems integer;
  v_savers smallint := 0;
  v_bonus text := null;
begin
  if v_user is null then raise exception 'not_signed_in'; end if;
  perform public.check_player_day(p_day);

  select r.cycle_day into v_prev from public.reward_claims r where r.user_id = v_user and r.day = p_day - 1;
  v_cycle := coalesce(v_prev % 7, 0) + 1;
  v_rarity := (array['rare', 'rare', 'epic', 'rare', 'epic', 'epic', 'legendary'])[v_cycle];
  v_seed := v_user::text || ':' || p_day::text;

  if v_rarity = 'rare' then
    v_xp := 10 + floor(public.seeded_random(v_seed || ':xp') * 11);
    v_gems := 5 + floor(public.seeded_random(v_seed || ':gems') * 11);
  elsif v_rarity = 'epic' then
    v_xp := 25 + floor(public.seeded_random(v_seed || ':xp') * 16);
    v_gems := 20 + floor(public.seeded_random(v_seed || ':gems') * 16);
    if public.seeded_random(v_seed || ':saver') < 0.3 then v_savers := 1; end if;
    if public.seeded_random(v_seed || ':bonus') < 0.1 then v_bonus := 'rare'; end if;
  else
    v_xp := 60 + floor(public.seeded_random(v_seed || ':xp') * 31);
    v_gems := 50 + floor(public.seeded_random(v_seed || ':gems') * 31);
    if public.seeded_random(v_seed || ':saver') < 0.6 then v_savers := 1; end if;
    if public.seeded_random(v_seed || ':bonus') < 0.5 then v_bonus := 'epic'; end if;
  end if;

  begin
    insert into public.reward_claims (user_id, day, cycle_day, rarity, xp, gems, savers, bonus_chest)
    values (v_user, p_day, v_cycle, v_rarity, v_xp, v_gems, v_savers, v_bonus);
  exception when unique_violation then
    raise exception 'already_claimed';
  end;
  insert into public.gem_ledger (user_id, amount, reason) values (v_user, v_gems, 'Daily Rewards day ' || v_cycle);

  return query select v_cycle, v_rarity, v_xp, v_gems, v_savers, v_bonus;
end;
$$;

create or replace function public.complete_daily_puzzle(p_day date, p_lang text, p_puzzle_id text, p_difficulty integer, p_solved boolean, p_attempts integer)
returns table (xp integer, gems integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_base integer;
  v_xp integer;
  v_gems integer := 0;
begin
  if v_user is null then raise exception 'not_signed_in'; end if;
  perform public.check_player_day(p_day);
  if p_difficulty not between 1 and 3 or p_attempts not between 1 and 3 then raise exception 'invalid_input'; end if;

  v_base := (array[15, 25, 40])[p_difficulty];
  if p_solved then
    v_xp := greatest(5, round(v_base * (1 - (p_attempts - 1) * 0.25)));
    if p_difficulty = 3 then v_gems := 15; end if;
  else
    v_xp := 5;
  end if;

  begin
    insert into public.puzzle_results (user_id, day, lang, puzzle_id, difficulty, solved, attempts, xp, gems)
    values (v_user, p_day, p_lang, p_puzzle_id, p_difficulty, p_solved, p_attempts, v_xp, v_gems);
  exception when unique_violation then
    raise exception 'already_played';
  end;
  if v_gems > 0 then
    insert into public.gem_ledger (user_id, amount, reason) values (v_user, v_gems, 'Daily Puzzle hard bonus');
  end if;

  return query select v_xp, v_gems;
end;
$$;

revoke all on function public.claim_daily_reward(date) from public, anon;
revoke all on function public.complete_daily_puzzle(date, text, text, integer, boolean, integer) from public, anon;
grant execute on function public.claim_daily_reward(date) to authenticated;
grant execute on function public.complete_daily_puzzle(date, text, text, integer, boolean, integer) to authenticated;
