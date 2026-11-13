import { Check, Lock, Swords, Zap } from 'lucide-react'
import { Monster } from '../components/Monster'
import { LinkButton, PageHeader, Tag, cx } from '../components/ui'
import { LANG_LABEL, allBosses, isUnlocked, stepPath } from '../content'
import { XP } from '../lib/gamification'
import { useApp } from '../state/AppContext'

export function Bosses() {
  const { state } = useApp()
  const bosses = allBosses()
  const defeated = bosses.filter((b) => state.lessons[b.boss.id]).length

  return (
    <div>
      <PageHeader title="Boss Battles" subtitle="Every unit ends with a boss. Clear each stage without running out of hearts." action={<span className="tnum rounded-lg border-2 border-line bg-card px-3 py-1.5 text-sm font-semibold">{defeated} / {bosses.length} defeated</span>} />

      <ul className="divide-y-2 divide-line overflow-hidden rounded-2xl border-2 border-line bg-card">
        {bosses.map(({ course, unit, boss }) => {
          const done = Boolean(state.lessons[boss.id])
          const open = isUnlocked(course, boss.id, state.lessons)
          const reward = boss.stages.length * XP.bossStage + XP.bossClear
          return (
            <li key={boss.id} className={cx('flex flex-wrap items-center gap-5 p-5', !open && 'opacity-60')}>
              <Monster id={boss.id} size={84} defeated={done} />
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color="var(--color-ice)">{LANG_LABEL[course.id]}</Tag>
                  <span className="text-xs text-mute">{unit.title}</span>
                  {done && <Tag color="var(--color-ok)"><Check size={11} strokeWidth={3} />Defeated</Tag>}
                </div>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{boss.title}</h2>
                <p className="mt-0.5 line-clamp-2 text-sm text-mute">{boss.story}</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right text-sm">
                  <p className="tnum flex items-center justify-end gap-1 font-semibold"><Zap size={14} className="text-gold-dark" fill="currentColor" />{reward} XP</p>
                  <p className="text-xs text-mute">{boss.stages.length} stages</p>
                </div>
                {open ? (
                  <LinkButton to={stepPath(boss.id)} variant={done ? 'secondary' : 'primary'}><Swords size={16} />{done ? 'Rematch' : 'Fight'}</LinkButton>
                ) : (
                  <span className="flex h-10 items-center gap-2 rounded-[10px] border-2 border-line px-4 text-sm text-mute"><Lock size={15} />Finish the unit</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
