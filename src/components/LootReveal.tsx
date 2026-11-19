import { useEffect, useState } from 'react'
import { RARITY } from '../lib/rewards'
import { play } from '../lib/sfx'
import type { Loot, Rarity } from '../lib/types'
import { Chest } from './Chest'
import { Confetti } from './Confetti'
import { BoltIcon, FreezeIcon, GemIcon } from './icons'
import { Mascot } from './Mascot'
import { Button, cx } from './ui'

type Phase = 'shaking' | 'open'
const SHAKE_MS = 900

/**
 * The chest-opening moment: the chest shakes, bursts open, and each reward springs in one after
 * another. Sounds play once per stage. Closing returns to the page.
 */
export function LootReveal({ rarity, loot, onClose }: { rarity: Rarity; loot: Loot; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('shaking')

  useEffect(() => {
    play('chest')
    const timer = setTimeout(() => {
      setPhase('open')
      play('claim')
    }, SHAKE_MS)
    const gem = setTimeout(() => play('gem'), SHAKE_MS + 450)
    return () => {
      clearTimeout(timer)
      clearTimeout(gem)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && phase === 'open' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, onClose])

  const items = [
    { key: 'xp', icon: <BoltIcon size={34} />, label: `+${loot.xp} XP`, show: loot.xp > 0 },
    { key: 'gems', icon: <GemIcon size={34} />, label: `+${loot.gems} gems`, show: loot.gems > 0 },
    { key: 'saver', icon: <FreezeIcon size={34} />, label: `+${loot.savers} streak saver`, show: loot.savers > 0 },
    { key: 'bonus', icon: <Chest rarity={loot.bonusChest ?? 'rare'} size={40} glow={false} />, label: `Bonus ${RARITY[loot.bonusChest ?? 'rare'].name} chest`, show: loot.bonusChest !== null },
  ].filter((i) => i.show)

  const info = RARITY[rarity]
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${info.name} chest`}>
      <div className="grad-night absolute inset-0 opacity-95" />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center text-white">
        <p className="label mb-2 rounded-full px-3 py-1 text-[12px]" style={{ background: info.color }}>{info.name} chest</p>
        <div className={cx('relative my-2', phase === 'shaking' && 'animate-shake [animation-iteration-count:3]')}>
          {phase === 'open' && rarity !== 'rare' && <Confetti />}
          <Chest rarity={rarity} size={190} open={phase === 'open'} />
        </div>
        {phase === 'shaking' ? (
          <p className="mt-2 text-lg font-bold text-white/85" aria-live="polite">Opening…</p>
        ) : (
          <>
            <ul className="mt-2 grid w-full gap-2.5" aria-live="polite">
              {items.map((item, i) => (
                <li key={item.key} className="animate-spring flex items-center gap-4 rounded-2xl bg-white/12 px-4 py-3 text-left backdrop-blur" style={{ animationDelay: `${i * 140}ms`, animationFillMode: 'both' }}>
                  {item.icon}
                  <span className="text-[18px] font-extrabold">{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-3">
              <Mascot expression="excited" motion="jump" size={72} />
              <Button variant="gold" size="lg" onClick={onClose} autoFocus>Collect</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
