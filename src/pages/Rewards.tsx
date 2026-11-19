import { Check, ChevronRight, Lock, ShieldCheck, Store, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Chest } from '../components/Chest'
import { DailyGoalCard } from '../components/Layout'
import { LootReveal } from '../components/LootReveal'
import { Mascot } from '../components/Mascot'
import { FlameIcon, GemIcon } from '../components/icons'
import { Button, cx } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { dayKey, msUntilTomorrow } from '../lib/dates'
import { liveStreak } from '../lib/gamification'
import { CYCLE, MAX_SAVERS, RARITY, canClaimDaily, cycleDayFor, cycleSlots } from '../lib/rewards'
import type { Loot, Rarity } from '../lib/types'
import { useApp } from '../state/AppContext'

const hoursLeft = (): string => {
  const ms = msUntilTomorrow()
  const h = Math.floor(ms / 3_600_000)
  return h >= 1 ? `${h} h ${Math.floor((ms % 3_600_000) / 60_000)} min` : `${Math.max(1, Math.round(ms / 60_000))} min`
}

function SectionTitle({ children, id }: { children: string; id?: string }) {
  return <h2 id={id} className="mb-3 mt-9 scroll-mt-20 text-xl font-bold text-ink">{children}</h2>
}

function TodayChest({ onReveal }: { onReveal: (rarity: Rarity, loot: Loot) => void }) {
  const { state, claimDailyReward, notify } = useApp()
  const [busy, setBusy] = useState(false)
  const [, tick] = useState(0)
  const today = dayKey()
  const claimable = canClaimDaily(state, today)
  const cycleDay = claimable ? cycleDayFor(state, today) : state.rewardClaims[today]?.cycleDay ?? 1
  const rarity = CYCLE[cycleDay - 1]

  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 60_000)
    return () => clearInterval(timer)
  }, [])

  const claim = async () => {
    setBusy(true)
    try {
      const result = await claimDailyReward()
      if (result) onReveal(result.rarity, result)
      else notify({ kind: 'info', title: 'Already claimed', body: 'Come back tomorrow for the next chest.' })
    } catch (err) {
      notify({ kind: 'error', title: 'Could not claim the chest', body: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="grad-night glow-blue relative overflow-hidden rounded-[28px] p-5 text-white sm:p-6">
      <div className="flex items-center gap-4">
        <Chest rarity={rarity} size={132} idle={claimable} open={!claimable} />
        <div className="min-w-0 flex-1">
          <p className="label text-[12px] text-white/70">Day {cycleDay} of 7</p>
          <h2 className="text-2xl font-extrabold leading-tight">{RARITY[rarity].name} chest</h2>
          <p className="mt-1 text-[14px] font-bold text-white/80">{claimable ? 'Ready to open!' : `Claimed. Next chest in ${hoursLeft()}.`}</p>
        </div>
      </div>
      {claimable ? (
        <Button variant="gold" size="lg" className="mt-5 w-full" onClick={() => void claim()} disabled={busy} data-sfx="none">{busy ? 'Opening…' : 'Claim reward'}</Button>
      ) : (
        <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-white/12 py-3 text-[15px] font-bold"><Check size={18} strokeWidth={3} />Today's reward claimed</p>
      )}
    </section>
  )
}

function WeekTrack() {
  const { state } = useApp()
  const slots = cycleSlots(state)
  return (
    <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="This week's chests">
      {slots.map((slot) => (
        <li key={slot.day} className={cx('flex flex-col items-center gap-1 rounded-2xl border-2 px-0.5 py-2', slot.state === 'available' ? 'border-blue bg-blue-soft glow-blue' : 'border-line bg-card', slot.state === 'locked' && 'opacity-60')} aria-label={`Day ${slot.day}, ${RARITY[slot.rarity].name}: ${slot.state}`}>
          <span className="label text-[10px] text-faint">Day {slot.day}</span>
          <span className="relative">
            <Chest rarity={slot.rarity} size={slot.day === 7 ? 42 : 36} glow={false} open={slot.state === 'claimed'} idle={slot.state === 'available'} />
            {slot.state === 'claimed' && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ok text-white"><Check size={10} strokeWidth={4} /></span>}
            {slot.state === 'locked' && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-faint text-white"><Lock size={9} strokeWidth={3} /></span>}
          </span>
          <span className="hidden text-[10px] font-bold sm:block" style={{ color: RARITY[slot.rarity].color }}>{RARITY[slot.rarity].name}</span>
        </li>
      ))}
    </ol>
  )
}

function BonusChests({ onReveal }: { onReveal: (rarity: Rarity, loot: Loot) => void }) {
  const { state, openBonusChest, notify } = useApp()
  if (state.chests.length === 0) {
    return (
      <div className="soft-card flex items-center gap-4 p-5">
        <Mascot expression="sleeping" size={64} />
        <p className="text-[15px] text-mute">No bonus chests yet. Unlock achievements, reach streak milestones and level up to win more.</p>
      </div>
    )
  }
  const open = (id: string, rarity: Rarity) => {
    const loot = openBonusChest(id)
    if (loot) onReveal(rarity, loot)
    else notify({ kind: 'error', title: 'That chest was already opened' })
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {state.chests.map((c) => (
        <li key={c.id} className="soft-card flex flex-col items-center p-4 text-center">
          <Chest rarity={c.rarity} size={72} idle />
          <p className="mt-1 text-[15px] font-bold" style={{ color: RARITY[c.rarity].color }}>{RARITY[c.rarity].name}</p>
          <p className="mb-3 truncate text-[12px] text-faint">From {c.source}</p>
          <Button size="sm" onClick={() => open(c.id, c.rarity)} data-sfx="none">Open</Button>
        </li>
      ))}
    </ul>
  )
}

function StreakCard() {
  const { state } = useApp()
  const streak = liveStreak(state)
  return (
    <section className="soft-card grid grid-cols-2 gap-4 p-5">
      <div className="flex items-center gap-3">
        <FlameIcon size={44} muted={streak === 0} className={streak > 0 ? 'animate-bob' : undefined} />
        <div>
          <p className="tnum text-2xl font-extrabold text-flame">{streak}</p>
          <p className="text-[13px] font-bold text-mute">day streak</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-soft text-blue"><ShieldCheck size={24} strokeWidth={2.6} /></span>
        <div>
          <p className="tnum text-2xl font-extrabold text-blue">{state.freezes}<span className="text-[14px] text-faint">/{MAX_SAVERS}</span></p>
          <p className="text-[13px] font-bold text-mute">streak savers</p>
        </div>
      </div>
      <p className="col-span-2 text-[13px] leading-relaxed text-mute">If you miss a day, a streak saver is used automatically so your streak survives. Win them from Epic and Legendary chests or buy them in the shop.</p>
    </section>
  )
}

function Achievements() {
  const { state } = useApp()
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ACHIEVEMENTS.map((a) => {
        const [current, target] = a.progress(state)
        const earned = Boolean(state.achievements[a.id])
        return (
          <li key={a.id} className={cx('soft-card flex flex-col items-center p-4 text-center', earned ? 'glow-gold' : 'opacity-80')}>
            <span className={cx('mb-2 flex h-12 w-12 items-center justify-center rounded-2xl', earned ? 'grad-gold text-white' : 'bg-line text-faint')}>{earned ? <Check size={24} strokeWidth={3.5} /> : <Lock size={20} strokeWidth={3} />}</span>
            <p className="text-[14px] font-bold text-body">{a.name}</p>
            <p className="tnum mt-0.5 text-[12px] text-faint">{earned ? 'Unlocked' : `${current.toLocaleString()} / ${target.toLocaleString()}`}</p>
          </li>
        )
      })}
    </ul>
  )
}

function GemHistory() {
  const { state } = useApp()
  if (state.gemLog.length === 0) return <p className="soft-card p-5 text-[15px] text-mute">Every gem you earn or spend will be listed here.</p>
  return (
    <ol className="soft-card overflow-hidden">
      {state.gemLog.slice(0, 20).map((tx, i) => (
        <li key={`${tx.at}-${i}`} className="flex items-center gap-3 border-b-2 border-line px-4 py-3 last:border-b-0">
          <GemIcon size={22} />
          <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-body">{tx.reason}</span>
          <span className="hidden text-[12px] text-faint sm:block">{new Date(tx.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span className={cx('tnum w-14 text-right text-[14px] font-extrabold', tx.amount > 0 ? 'text-ok' : 'text-bad')}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
        </li>
      ))}
    </ol>
  )
}

export function Rewards() {
  const { state } = useApp()
  const { hash } = useLocation()
  const [reveal, setReveal] = useState<{ rarity: Rarity; loot: Loot } | null>(null)

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <Mascot expression={canClaimDaily(state) ? 'excited' : 'happy'} motion={canClaimDaily(state) ? 'jump' : 'float'} size={64} />
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Daily Rewards</h1>
          <p className="text-[15px] text-mute">Open a chest every day. Day 7 is always Legendary.</p>
        </div>
      </header>

      <TodayChest onReveal={(rarity, loot) => setReveal({ rarity, loot })} />
      <div className="mt-4"><WeekTrack /></div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-bold text-mute">
        {(['rare', 'epic', 'legendary'] as const).map((r) => (
          <span key={r} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RARITY[r].color }} />{RARITY[r].name}: {RARITY[r].xp[0]}–{RARITY[r].xp[1]} XP, {RARITY[r].gems[0]}–{RARITY[r].gems[1]} gems{RARITY[r].saverChance > 0 ? `, ${Math.round(RARITY[r].saverChance * 100)}% streak saver` : ''}</span>
        ))}
      </div>

      <SectionTitle>Bonus chests</SectionTitle>
      <BonusChests onReveal={(rarity, loot) => setReveal({ rarity, loot })} />

      <SectionTitle>Streak</SectionTitle>
      <StreakCard />
      <DailyGoalCard className="mt-3" />

      <SectionTitle>Achievements</SectionTitle>
      <Achievements />

      <SectionTitle id="gems">Gem history</SectionTitle>
      <div className="mb-3 flex items-center gap-2 text-[15px] font-bold text-body"><GemIcon size={24} /><span className="tnum">{state.gems.toLocaleString()}</span> gems</div>
      <GemHistory />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link to="/shop" className="press soft-card flex items-center gap-3 p-4"><Store size={22} className="text-blue" /><span className="flex-1 font-bold text-body">Shop</span><ChevronRight size={18} className="text-faint" /></Link>
        <Link to="/quests" className="press soft-card flex items-center gap-3 p-4"><Target size={22} className="text-blue" /><span className="flex-1 font-bold text-body">Daily quests and badges</span><ChevronRight size={18} className="text-faint" /></Link>
      </div>

      {reveal && <LootReveal rarity={reveal.rarity} loot={reveal.loot} onClose={() => setReveal(null)} />}
    </div>
  )
}
