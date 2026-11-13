import type { ReactNode } from 'react'
import { FreezeIcon, GemIcon, QuestsIcon, WagerIcon } from '../components/icons'
import { Button } from '../components/ui'
import { SHOP, buyFreeze, canBuyFreeze, canPlaceWager, liveStreak, placeWager } from '../lib/gamification'
import { useApp } from '../state/AppContext'

function Item({ icon, title, children, pill, action }: { icon: ReactNode; title: string; children: ReactNode; pill?: string; action: ReactNode }) {
  return (
    <li className="flex gap-5 border-t-2 border-line py-6">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[17px] font-bold text-body">{title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{children}</p>
        {pill && <span className="label mt-2 inline-block rounded-full bg-line px-2.5 py-1 text-[11px] text-faint">{pill}</span>}
        <div className="mt-3">{action}</div>
      </div>
    </li>
  )
}

function Price({ label, cost }: { label: string; cost: number }) {
  return <>{label} <GemIcon size={20} /><span className="tnum">{cost}</span></>
}

export function Shop() {
  const { state, update, notify } = useApp()
  const streak = liveStreak(state)

  const buy = () => {
    update(buyFreeze)
    notify({ kind: 'info', title: 'Streak Freeze equipped', body: 'It will protect your streak on the next day you miss.' })
  }
  const wager = () => {
    update((s) => placeWager(s))
    notify({ kind: 'info', title: 'Wager placed', body: `Reach a ${streak + SHOP.wager.days}-day streak to win ${SHOP.wager.payout} gems.` })
  }

  const freezeFull = state.freezes >= SHOP.freeze.max

  return (
    <div>
      <div className="mb-8 flex items-center gap-5 rounded-2xl border-2 border-line p-5">
        <QuestsIcon size={64} />
        <div>
          <h1 className="text-xl font-bold text-ink">Gems</h1>
          <p className="tnum text-[15px] text-mute">You have {state.gems.toLocaleString()} gem{state.gems === 1 ? '' : 's'}</p>
          <p className="mt-1 text-[13px] text-faint">Earn gems with XP and by claiming daily quests.</p>
        </div>
      </div>

      <h2 className="mb-4 text-2xl font-bold text-ink">Power-Ups</h2>
      <ul>
        <Item
          icon={<FreezeIcon size={72} />}
          title="Streak Freeze"
          pill={`${state.freezes} / ${SHOP.freeze.max} equipped`}
          action={
            <Button variant="secondary" disabled={!canBuyFreeze(state)} onClick={buy}>
              {freezeFull ? 'Full' : <Price label="Get for:" cost={SHOP.freeze.cost} />}
            </Button>
          }
        >
          Streak Freeze allows your streak to remain in place for one full day of inactivity.
        </Item>

        <Item
          icon={<WagerIcon size={72} />}
          title="Double or Nothing"
          pill={state.wager ? `In play · reach a ${state.wager.target}-day streak` : undefined}
          action={
            <Button variant="secondary" disabled={!canPlaceWager(state)} onClick={wager}>
              {state.wager ? 'Wager placed' : <Price label="Get for:" cost={SHOP.wager.cost} />}
            </Button>
          }
        >
          Double your {SHOP.wager.cost} gem wager by maintaining a {SHOP.wager.days} day streak.
        </Item>
      </ul>
    </div>
  )
}
