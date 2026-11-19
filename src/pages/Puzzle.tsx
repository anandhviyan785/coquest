import { ArrowLeft, Check, Heart, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Confetti } from '../components/Confetti'
import { LangLogo } from '../components/LangLogo'
import { LanguagePicker } from '../components/LanguagePicker'
import { useRewardToasts } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { PuzzleBoard, emptyAnswer, isAnswered } from '../components/PuzzleBoard'
import type { Answer } from '../components/PuzzleBoard'
import { BoltIcon, GemIcon, PuzzleIcon } from '../components/icons'
import { Button, Prose, cx } from '../components/ui'
import { LANG_LABEL, courseById } from '../content'
import { DIFFICULTY_NAME, HARD_BONUS_GEMS, KIND_LABEL, MAX_ATTEMPTS, PUZZLE_XP, puzzleById, puzzleForDay, puzzleStreak, seenPuzzles, typedMatches } from '../content/puzzles'
import type { Puzzle } from '../content/puzzles'
import { dayKey, shortDate } from '../lib/dates'
import { levelFromXp } from '../lib/gamification'
import { play } from '../lib/sfx'
import type { LangId } from '../lib/types'
import { useApp } from '../state/AppContext'

type Phase = 'intro' | 'playing' | 'finished'

const isCorrect = (p: Puzzle, a: Answer): boolean => {
  if (p.kind === 'order') return a.kind === 'order' && a.value.every((v, i) => p.lines[v] === p.lines[i]) && a.value.length === p.lines.length
  if (p.kind === 'type') return a.kind === 'text' && typedMatches(a.value, p.accepted)
  return a.kind === 'index' && a.value === p.answer
}

function Hearts({ left }: { left: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${left} tries left`}>
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
        <Heart key={i} size={22} strokeWidth={2.4} className={cx('transition-all duration-300', i < left ? 'fill-bad text-bad' : 'scale-75 text-line')} />
      ))}
    </span>
  )
}

function History() {
  const { state } = useApp()
  const days = Object.entries(state.puzzles).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7)
  if (days.length === 0) return null
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold text-ink">Recent puzzles</h2>
      <ol className="soft-card overflow-hidden">
        {days.map(([day, r]) => (
          <li key={day} className="flex items-center gap-3 border-b-2 border-line px-4 py-3 last:border-b-0">
            <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white', r.solved ? 'bg-ok' : 'bg-faint')}>{r.solved ? <Check size={16} strokeWidth={3.5} /> : <X size={16} strokeWidth={3.5} />}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold text-body">{puzzleById(r.puzzleId)?.title ?? 'Puzzle'}</span>
              <span className="block text-[12px] text-faint">{shortDate(day)} · {LANG_LABEL[r.lang]}</span>
            </span>
            <span className="tnum text-[14px] font-bold text-gold-dark">+{r.xp} XP</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function PuzzlePage() {
  const { state, patch, finishPuzzle, notify } = useApp()
  const reward = useRewardToasts()
  const today = dayKey()
  const lang: LangId = state.profile.language ?? 'python'
  const done = state.puzzles[today]
  const puzzle = done ? puzzleById(done.puzzleId) ?? puzzleForDay(lang, levelFromXp(state.xp), seenPuzzles(state, today)) : puzzleForDay(lang, levelFromXp(state.xp), seenPuzzles(state, today))

  const [phase, setPhase] = useState<Phase>(done ? 'finished' : 'intro')
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(puzzle))
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null)
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const left = MAX_ATTEMPTS - attempts
  const streak = puzzleStreak(state, today)

  const finish = async (solved: boolean, used: number) => {
    setBusy(true)
    try {
      const outcome = await finishPuzzle(puzzle, lang, solved, used)
      if (outcome) {
        reward(outcome)
        if (outcome.gems > 0) setTimeout(() => play('gem'), 500)
      }
      setPhase('finished')
    } catch (err) {
      notify({ kind: 'error', title: 'Could not save your puzzle', body: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const check = () => {
    const used = attempts + 1
    setAttempts(used)
    if (isCorrect(puzzle, answer)) {
      setFeedback('right')
      play('solve')
      setCelebrate(true)
      void finish(true, used)
      return
    }
    setFeedback('wrong')
    play('wrong')
    if (used >= MAX_ATTEMPTS) void finish(false, used)
  }

  const retry = () => {
    setFeedback(null)
    setAnswer(emptyAnswer(puzzle))
  }

  const changeLanguage = (id: LangId) => {
    setPicking(false)
    if (id === lang) return
    patch({ profile: { ...state.profile, language: id } })
    setAnswer({ kind: 'index', value: null })
    setPhase('intro')
  }

  const course = courseById(lang)
  const header = (
    <div className="mb-5 flex items-center justify-between gap-3">
      <Link to="/practice" className="label inline-flex items-center gap-2 text-[13px] text-blue hover:brightness-90"><ArrowLeft size={16} strokeWidth={3} />Practice</Link>
      <span className="flex items-center gap-2 text-[13px] font-bold text-mute">{streak > 0 && <>Puzzle run: <span className="tnum text-flame">{streak}</span></>}</span>
    </div>
  )

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-xl">
        {header}
        <section className="grad-hero glow-purple relative overflow-hidden rounded-[28px] p-6 text-center text-white">
          <span className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[26px] bg-white shadow-xl"><PuzzleIcon size={64} className="piece-rock" /></span>
          <h1 className="mt-3 text-3xl font-extrabold">Daily Puzzle</h1>
          <p className="mt-1 text-[15px] font-bold text-white/85">A new {LANG_LABEL[lang]} puzzle every day. Three tries.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[13px] font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1.5">{KIND_LABEL[puzzle.kind]}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">{DIFFICULTY_NAME[puzzle.difficulty]}</span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5"><BoltIcon size={16} />Up to {PUZZLE_XP[puzzle.difficulty]} XP</span>
            {puzzle.difficulty === 3 && <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5"><GemIcon size={16} />+{HARD_BONUS_GEMS} gems</span>}
          </div>
          <Button variant="gold" size="lg" className="mt-6 w-full" data-sfx="open" onClick={() => setPhase('playing')}>Start puzzle</Button>
        </section>
        <button onClick={() => setPicking(true)} data-sfx="open" className="press soft-card mt-4 flex w-full items-center gap-3 p-3.5 text-left">
          {course && <LangLogo lang={course.id} size={30} />}
          <span className="flex-1 text-[15px] font-bold text-body">Puzzle language: {LANG_LABEL[lang]}</span>
          <span className="label text-[12px] text-blue">Change</span>
        </button>
        <History />
        <LanguagePicker open={picking} current={lang} onPick={changeLanguage} onClose={() => setPicking(false)} />
      </div>
    )
  }

  if (phase === 'finished') {
    const result = state.puzzles[today]
    const solved = result?.solved ?? feedback === 'right'
    return (
      <div className="mx-auto max-w-xl">
        {header}
        <section className="soft-card relative overflow-hidden p-6 text-center">
          {celebrate && <Confetti />}
          <Mascot expression={solved ? 'victorious' : 'determined'} motion={solved ? 'jump' : 'nod'} size={120} className="mx-auto" />
          <h1 className="mt-2 text-2xl font-extrabold text-ink">{solved ? 'Puzzle solved!' : 'Good effort!'}</h1>
          <p className="mt-1 text-[15px] text-mute">{solved ? `Solved in ${result?.attempts ?? attempts} ${(result?.attempts ?? attempts) === 1 ? 'try' : 'tries'}.` : 'Here is how it works. A new puzzle arrives tomorrow.'}</p>
          {result && (
            <div className="mt-4 flex justify-center gap-3">
              <span className="animate-spring flex items-center gap-1.5 rounded-2xl bg-notice px-4 py-2 text-[16px] font-extrabold text-gold-dark"><BoltIcon size={22} />+{result.xp} XP</span>
              {result.gems > 0 && <span className="animate-spring flex items-center gap-1.5 rounded-2xl bg-blue-soft px-4 py-2 text-[16px] font-extrabold text-blue"><GemIcon size={22} />+{result.gems}</span>}
            </div>
          )}
        </section>
        <section className="soft-card mt-4 p-5">
          <p className="label mb-1 text-[12px] text-faint">{KIND_LABEL[puzzle.kind]} · {puzzle.title}</p>
          <p className="mb-4 text-[16px] font-bold text-ink">{puzzle.prompt}</p>
          <PuzzleBoard puzzle={puzzle} answer={answer} onChange={setAnswer} locked reveal />
          <div className="mt-4 rounded-2xl bg-blue-soft p-4"><Prose text={puzzle.explain} className="!text-[15px]" /></div>
        </section>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link to="/" className="press soft-card p-4 text-center font-bold text-blue">Back to your path</Link>
          <Link to="/rewards" className="press soft-card p-4 text-center font-bold text-blue">Daily Rewards</Link>
        </div>
        <History />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      {header}
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-bold text-mute">
          {course && <LangLogo lang={course.id} size={22} />}{KIND_LABEL[puzzle.kind]} · {DIFFICULTY_NAME[puzzle.difficulty]}
        </span>
        <Hearts left={left} />
      </div>
      <section className={cx('soft-card p-5', feedback === 'wrong' && 'animate-shake')}>
        <div className="mb-4 flex items-start gap-3">
          <Mascot expression={feedback === 'wrong' ? 'disappointed' : feedback === 'right' ? 'excited' : 'thinking'} size={58} motion={feedback === 'right' ? 'jump' : 'tilt'} />
          <div>
            <h1 className="text-xl font-extrabold text-ink">{puzzle.title}</h1>
            <p className="text-[15px] text-body">{puzzle.prompt}</p>
          </div>
        </div>
        <PuzzleBoard puzzle={puzzle} answer={answer} onChange={(a) => { setFeedback(null); setAnswer(a) }} locked={busy || feedback === 'right'} reveal={false} />
      </section>

      <div className={cx('mt-4 rounded-2xl p-4 transition-colors', feedback === 'wrong' ? 'bg-bad-soft' : feedback === 'right' ? 'bg-green-soft' : '')} aria-live="polite">
        {feedback === 'wrong' && left > 0 && <p className="mb-3 text-[15px] font-bold text-bad-dark">Not quite. {left} {left === 1 ? 'try' : 'tries'} left. Look closely and try again.</p>}
        {feedback === 'right' && <p className="mb-3 text-[15px] font-bold text-ok">Correct!</p>}
        {feedback === 'wrong' && left > 0 ? (
          <Button size="lg" variant="secondary" className="w-full" onClick={retry}>Try again</Button>
        ) : (
          <Button size="lg" className="w-full" disabled={!isAnswered(puzzle, answer) || busy || feedback !== null} onClick={check} data-sfx="none">{busy ? 'Saving…' : 'Check'}</Button>
        )}
      </div>
    </div>
  )
}
