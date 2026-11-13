import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { GOAL_PRESETS, MAX_GOAL, MIN_GOAL } from '../lib/gamification'
import { OptionButton } from './OptionButton'

const isPreset = (xp: number | null): boolean => GOAL_PRESETS.some((p) => p.xp === xp)

/** Parses a custom goal, or returns null when it is not a whole number inside the allowed range. */
const parseGoal = (text: string): number | null => {
  const n = Number(text)
  return Number.isInteger(n) && n >= MIN_GOAL && n <= MAX_GOAL ? n : null
}

interface Props {
  value: number | null
  /** Called with the chosen goal, or null while a custom value is missing or out of range. */
  onChange: (goal: number | null) => void
}

/** Daily-goal choices: four presets and a custom amount. Shared by the welcome flow and Settings. */
export function GoalPicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState(() => value !== null && !isPreset(value))
  const [text, setText] = useState(() => (value !== null && !isPreset(value) ? String(value) : ''))
  const invalid = custom && text !== '' && parseGoal(text) === null

  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Daily goal">
      {GOAL_PRESETS.map((preset) => (
        <OptionButton
          key={preset.xp}
          selected={!custom && value === preset.xp}
          onClick={() => {
            setCustom(false)
            onChange(preset.xp)
          }}
          title={`${preset.xp} XP a day`}
          hint={preset.time}
          right={preset.label}
        />
      ))}
      <OptionButton
        selected={custom}
        onClick={() => {
          setCustom(true)
          onChange(parseGoal(text))
        }}
        icon={<Pencil size={22} strokeWidth={2.6} />}
        title="Custom"
        hint={`Pick your own, from ${MIN_GOAL} to ${MAX_GOAL} XP`}
      />
      {custom && (
        <div className="animate-rise">
          <label className="flex items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 py-3 focus-within:border-blue-line">
            <span className="whitespace-nowrap text-[15px] font-bold text-mute">My goal</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_GOAL}
              max={MAX_GOAL}
              step={10}
              value={text}
              autoFocus
              onChange={(e) => {
                setText(e.target.value)
                onChange(parseGoal(e.target.value))
              }}
              aria-label="Custom daily goal in XP"
              aria-invalid={invalid}
              className="w-full min-w-0 bg-transparent text-right text-[19px] font-bold text-ink outline-none focus-visible:outline-none"
            />
            <span className="text-[15px] font-bold text-mute">XP</span>
          </label>
          {invalid && <p className="mt-2 px-1 text-[13px] font-bold text-bad-dark" role="alert">Choose a whole number from {MIN_GOAL} to {MAX_GOAL}.</p>}
        </div>
      )}
    </div>
  )
}
