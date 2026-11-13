import { Check, ChevronRight, Clock, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BoltIcon, ChestIcon, FlameIcon, GemIcon, QuestsIcon } from '../components/icons'
import { Mascot } from '../components/Mascot'
import { Bar, Button, Tabs, cx } from '../components/ui'
import { allBosses } from '../content'
import { challengeForDay } from '../content/challenges'
import { ACHIEVEMENTS } from '../lib/achievements'
import { dayKey, msUntilTomorrow } from '../lib/dates'
import { STREAK_REWARDS } from '../lib/gamification'
import { claimQuest, questStatus } from '../lib/quests'
import { useApp } from '../state/AppContext'

type Tab = 'quests' | 'badges'

const BADGE_COLORS = ['#FF4B4B', '#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#00CD9C', '#FFC800']

const timeLeft = (ms: number): string => {
  const hours = Math.floor(ms / 3_600_000)
  return hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'}` : `${Math.max(1, Math.round(ms / 60_000))} min`
}

function QuestsTab() {
  const { state, update, notify } = useApp()
  const today = dayKey()
  const [left, setLeft] = useState(msUntilTomorrow())
  useEffect(() => {
    const timer = setInterval(() => setLeft(msUntilTomorrow()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const quests = questStatus(state, today)
  const daily = challengeForDay(today)
  const dailyDone = Boolean(state.daily[today])
  const bosses = allBosses()
  const bossesDone = bosses.filter((b) => state.lessons[b.boss.id]).length

  const claim = (id: string, reward: number) => {
    update((s) => claimQuest(s, id, today))
    notify({ kind: 'info', title: `Quest complete: +${reward} gems` })
  }

  return (
    <div>
      <div className="relative flex min-h-[180px] items-center overflow-hidden rounded-2xl bg-violet p-6 text-white">
        <div className="max-w-[60%]">
          <h2 className="text-2xl font-bold">Welcome!</h2>
          <p className="mt-2 text-[17px] leading-relaxed text-white/90">Complete quests to earn gems. Quests refresh every day.</p>
        </div>
        <Mascot expression="excited" size={150} className="absolute -bottom-3 right-3" />
      </div>

      <div className="mb-4 mt-7 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink">Daily Quests</h2>
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-gold-dark"><Clock size={18} strokeWidth={3} />{timeLeft(left)}</span>
      </div>

      <ul className="overflow-hidden rounded-2xl border-2 border-line">
        {quests.map(({ quest, current, done, claimed }) => (
          <li key={quest.id} className="flex items-center gap-4 border-b-2 border-line p-5 last:border-b-0">
            <BoltIcon size={46} />
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[17px] font-bold text-body">{quest.title}</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Bar value={current} max={quest.target} className="h-6" />
                  <span className="tnum absolute inset-0 flex items-center justify-center text-[13px] font-bold text-body">{current} / {quest.target}</span>
                </div>
                {claimed ? (
                  <span className="label flex h-9 items-center gap-1 rounded-xl bg-green-soft px-3 text-[12px] text-ok"><Check size={15} strokeWidth={4} />Claimed</span>
                ) : done ? (
                  <Button size="sm" variant="gold" onClick={() => claim(quest.id, quest.reward)}><GemIcon size={16} />Claim {quest.reward}</Button>
                ) : (
                  <span className="flex items-center gap-1" title={`Reward: ${quest.reward} gems`}><ChestIcon size={36} /><span className="tnum text-[13px] font-bold text-faint">{quest.reward}</span></span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mb-4 mt-9 text-2xl font-bold text-ink">More challenges</h2>
      <div className="overflow-hidden rounded-2xl border-2 border-line">
        <Link to="/daily" className="flex items-center gap-4 border-b-2 border-line p-5 transition-colors hover:bg-surface">
          <FlameIcon size={46} muted={dailyDone} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold text-body">Daily challenge: {daily.title}</p>
            <p className="text-[15px] text-mute">{dailyDone ? 'Solved today. A new one arrives at midnight.' : `${daily.difficulty} · one problem, the same for everyone`}</p>
          </div>
          <ChevronRight size={22} strokeWidth={3} className="text-faint" />
        </Link>
        <Link to="/bosses" className="flex items-center gap-4 p-5 transition-colors hover:bg-surface">
          <QuestsIcon size={46} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold text-body">Boss battles</p>
            <p className="tnum text-[15px] text-mute">{bossesDone} of {bosses.length} unit bosses defeated</p>
          </div>
          <ChevronRight size={22} strokeWidth={3} className="text-faint" />
        </Link>
      </div>
    </div>
  )
}

function BadgesTab() {
  const { state } = useApp()
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-ink">Achievements</h2>
      <ul className="overflow-hidden rounded-2xl border-2 border-line">
        {ACHIEVEMENTS.map((a, i) => {
          const [current, target] = a.progress(state)
          const earned = Boolean(state.achievements[a.id])
          const color = BADGE_COLORS[i % BADGE_COLORS.length]
          return (
            <li key={a.id} className="flex items-center gap-5 border-b-2 border-line p-5 last:border-b-0">
              <span className="flex h-[88px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-b-4 border-black/15 text-white" style={{ background: earned ? color : '#E5E5E5' }}>
                {earned ? <Check size={30} strokeWidth={4} /> : <Lock size={24} strokeWidth={3} className="text-faint" />}
                <span className={cx('label text-[10px]', !earned && 'text-faint')}>{earned ? 'Earned' : 'Locked'}</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[17px] font-bold text-body">{a.name}</p>
                  <span className="tnum text-[15px] text-faint">{current.toLocaleString()}/{target.toLocaleString()}</span>
                </div>
                <Bar value={current} max={target} className="my-2" />
                <p className="text-[15px] text-mute">{a.description}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <h2 className="mb-4 mt-9 text-2xl font-bold text-ink">Streak milestones</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {STREAK_REWARDS.map((r) => {
          const claimed = state.streakRewards.includes(r.days)
          return (
            <li key={r.days} className={cx('rounded-2xl border-2 p-4', claimed ? 'border-flame bg-[#FFF5E0]' : 'border-line')}>
              <p className="flex items-center gap-2 text-[17px] font-bold text-body"><FlameIcon size={26} muted={!claimed} />{r.days} days</p>
              <p className="mt-1 text-[15px] text-mute">+{r.xp} XP and {r.freezes} streak freeze{r.freezes === 1 ? '' : 's'}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Quests() {
  const [tab, setTab] = useState<Tab>('quests')
  return (
    <div>
      <Tabs tabs={[{ id: 'quests', label: 'Quests' }, { id: 'badges', label: 'Badges' }]} value={tab} onChange={setTab} className="mb-6" />
      {tab === 'quests' ? <QuestsTab /> : <BadgesTab />}
    </div>
  )
}
