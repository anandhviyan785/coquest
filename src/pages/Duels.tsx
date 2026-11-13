import { Check, Clock, Copy, LoaderCircle, Swords, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { useRewardToasts } from '../components/Layout'
import { Mascot } from '../components/Mascot'
import { Bar, Button, PageHeader, Panel, PanelTitle, Tag, cx } from '../components/ui'
import { Workbench } from '../components/Workbench'
import type { CheckSummary } from '../components/Workbench'
import { CHALLENGES, challengeById } from '../content/challenges'
import { formatClock } from '../lib/dates'
import { DUEL_COUNTDOWN_MS, DUEL_DURATION_MS, accuracyOf, emptyScore, judge, newRoomCode, openDuelLink } from '../lib/duel'
import type { DuelLink, DuelMessage, Player, Score, Verdict } from '../lib/duel'
import { XP } from '../lib/gamification'
import type { Challenge } from '../lib/types'
import { useApp } from '../state/AppContext'

type Phase = 'lobby' | 'waiting' | 'joining' | 'countdown' | 'playing' | 'result'

interface Match { problem: Challenge; startAt: number; endAt: number; opponent: Player }

function ScoreCard({ player, score, you, leading }: { player: Player; score: Score; you?: boolean; leading: boolean }) {
  const accuracy = accuracyOf(score)
  return (
    <div className={cx('flex-1 rounded-xl border p-4', leading ? 'border-cyan/60 bg-cyan/[0.06]' : 'border-line bg-card')}>
      <div className="flex items-center gap-3">
        <Avatar avatar={player.avatar} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{player.name}{you && <span className="ml-1.5 text-xs font-normal text-mute">you</span>}</p>
          <p className="tnum text-xs text-mute">{score.finishedMs !== null ? `Finished in ${formatClock(score.finishedMs)}` : `${score.checks} check${score.checks === 1 ? '' : 's'}`}</p>
        </div>
        <p className="tnum ml-auto text-2xl font-semibold">{score.passed}<span className="text-sm font-medium text-mute">/{score.total || '–'}</span></p>
      </div>
      <Bar value={score.passed} max={score.total || 1} className="mt-3 h-1.5" color={score.finishedMs !== null ? 'var(--color-ok)' : 'var(--color-cyan)'} />
      <p className="tnum mt-2 text-xs text-mute">Accuracy {accuracy === null ? '—' : `${accuracy}%`}</p>
    </div>
  )
}

export function Duels() {
  const { state, earn, cloud } = useApp()
  const reward = useRewardToasts()
  const me: Player = { name: state.username, avatar: state.avatar }

  const [phase, setPhase] = useState<Phase>('lobby')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [mine, setMine] = useState<Score>(emptyScore)
  const [theirs, setTheirs] = useState<Score>(emptyScore)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [earned, setEarned] = useState(0)
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(Date.now())

  const link = useRef<DuelLink | null>(null)
  const role = useRef<'host' | 'guest' | null>(null)
  const phaseRef = useRef<Phase>('lobby')
  const mineRef = useRef(mine)
  const theirsRef = useRef(theirs)
  const settled = useRef(false)
  phaseRef.current = phase
  mineRef.current = mine
  theirsRef.current = theirs

  const settle = useCallback((myScore: Score, theirScore: Score, forfeit = false) => {
    if (settled.current) return
    settled.current = true
    const outcome: Verdict = forfeit ? 'win' : judge(myScore, theirScore)
    const xp = outcome === 'win' ? XP.duelWin : XP.duelPlay
    const result = earn(
      { xp, kind: 'duel', title: outcome === 'win' ? 'Won a coding duel' : outcome === 'draw' ? 'Drew a coding duel' : 'Played a coding duel', lang: 'python', correct: myScore.testsPassed, attempts: myScore.testsRun },
      (s) => ({ ...s, duels: { played: s.duels.played + 1, won: s.duels.won + (outcome === 'win' ? 1 : 0) } }),
    )
    reward(result)
    setEarned(result.xp)
    setVerdict(outcome)
    setPhase('result')
  }, [earn, reward])

  const beginMatch = useCallback((problemId: string, startsInMs: number, durationMs: number, opponent: Player) => {
    const problem = challengeById(problemId)
    if (!problem) {
      setError('This duel uses a problem your version of PyQuest does not have.')
      return
    }
    const startAt = Date.now() + startsInMs
    settled.current = false
    setMine(emptyScore())
    setTheirs(emptyScore())
    setVerdict(null)
    setOpponentLeft(false)
    setMatch({ problem, startAt, endAt: startAt + durationMs, opponent })
    setPhase('countdown')
  }, [])

  const handle = useCallback((msg: DuelMessage) => {
    if (msg.t === 'join' && role.current === 'host' && phaseRef.current === 'waiting') {
      const problem = CHALLENGES[crypto.getRandomValues(new Uint32Array(1))[0] % CHALLENGES.length]
      link.current?.send({ t: 'start', host: me, problemId: problem.id, startsInMs: DUEL_COUNTDOWN_MS, durationMs: DUEL_DURATION_MS })
      beginMatch(problem.id, DUEL_COUNTDOWN_MS, DUEL_DURATION_MS, msg.player)
    } else if (msg.t === 'start' && role.current === 'guest' && phaseRef.current === 'joining') {
      beginMatch(msg.problemId, msg.startsInMs, msg.durationMs, msg.host)
    } else if (msg.t === 'score') {
      setTheirs(msg.score)
      if (msg.score.finishedMs !== null && phaseRef.current === 'playing') settle(mineRef.current, msg.score)
    } else if (msg.t === 'leave') {
      setOpponentLeft(true)
      if (phaseRef.current === 'playing' || phaseRef.current === 'countdown') settle(mineRef.current, theirsRef.current, true)
    }
  }, [beginMatch, me, settle])

  const handleRef = useRef(handle)
  handleRef.current = handle

  const disconnect = useCallback(() => {
    link.current?.send({ t: 'leave' })
    link.current?.close()
    link.current = null
    role.current = null
  }, [])

  useEffect(() => disconnect, [disconnect])

  // Drive the countdown, the match clock and the time-out.
  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'playing') return
    const timer = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (!match) return
      if (phaseRef.current === 'countdown' && t >= match.startAt) setPhase('playing')
      if (phaseRef.current === 'playing' && t >= match.endAt) settle(mineRef.current, theirsRef.current)
    }, 200)
    return () => clearInterval(timer)
  }, [phase, match, settle])

  const connect = async (room: string, as: 'host' | 'guest') => {
    setError(null)
    disconnect()
    const opened = openDuelLink(room, (msg) => handleRef.current(msg))
    link.current = opened
    role.current = as
    setCode(room)
    setPhase(as === 'host' ? 'waiting' : 'joining')
    try {
      await opened.ready
      if (as === 'guest') opened.send({ t: 'join', player: me })
    } catch (err) {
      disconnect()
      setPhase('lobby')
      setError(err instanceof Error ? err.message : 'Could not connect.')
    }
  }

  const join = (event: FormEvent) => {
    event.preventDefault()
    const room = joinCode.trim().toUpperCase()
    if (room.length !== 5) {
      setError('Room codes are 5 characters long.')
      return
    }
    void connect(room, 'guest')
  }

  const leave = () => {
    disconnect()
    setMatch(null)
    setPhase('lobby')
  }

  const onCheck = (check: CheckSummary) => {
    if (!match || phaseRef.current !== 'playing') return
    const prev = mineRef.current
    const next: Score = {
      passed: Math.max(prev.passed, check.passedCount),
      total: check.total,
      checks: prev.checks + 1,
      testsPassed: prev.testsPassed + check.passedCount,
      testsRun: prev.testsRun + check.total,
      finishedMs: check.passed ? Date.now() - match.startAt : null,
    }
    setMine(next)
    link.current?.send({ t: 'score', score: next })
    if (check.passed) settle(next, theirsRef.current)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Clipboard unavailable', err)
    }
  }

  const winRate = state.duels.played > 0 ? Math.round((state.duels.won / state.duels.played) * 100) : null

  return (
    <div>
      <PageHeader title="Coding Duels" subtitle="Two players, one problem, five minutes. First to pass every test wins." />

      {phase === 'lobby' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <Panel className="overflow-hidden">
            <div className="grid sm:grid-cols-2">
              <div className="border-b-2 border-line p-6 sm:border-b-0 sm:border-r">
                <h2 className="text-lg font-semibold">Host a duel</h2>
                <p className="mt-1 text-sm text-mute">Create a room and share its code with your opponent.</p>
                <Button size="lg" className="mt-5" onClick={() => void connect(newRoomCode(), 'host')}><Swords size={17} />Create room</Button>
              </div>
              <form onSubmit={join} className="p-6">
                <h2 className="text-lg font-semibold">Join a duel</h2>
                <p className="mt-1 text-sm text-mute">Enter the 5-character code your opponent sent you.</p>
                <div className="mt-5 flex gap-2">
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} placeholder="CODE" aria-label="Room code" spellCheck={false} className="h-12 w-32 rounded-xl border-2 border-line bg-surface text-center font-mono text-lg font-bold tracking-[0.25em] outline-none placeholder:tracking-normal placeholder:text-faint focus:border-sky" />
                  <Button type="submit" size="lg" variant="secondary" disabled={joinCode.length !== 5}>Join</Button>
                </div>
              </form>
            </div>
            {error && <p className="border-t border-bad/40 bg-bad/10 px-6 py-3 text-sm text-bad" role="alert">{error}</p>}
            <p className="border-t-2 border-line bg-surface px-6 py-3.5 text-[13px] leading-relaxed text-mute">
              {cloud
                ? 'Rooms connect over the internet, so your opponent can be anywhere.'
                : 'Local mode: rooms connect between tabs of this browser, so you can duel a friend on this computer by opening PyQuest in a second tab. Add Supabase keys to duel over the internet.'}
            </p>
          </Panel>

          <Panel className="p-5">
            <PanelTitle>Your record</PanelTitle>
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div><dd className="tnum text-2xl font-semibold">{state.duels.played}</dd><dt className="text-xs text-mute">Played</dt></div>
              <div><dd className="tnum text-2xl font-semibold text-blue">{state.duels.won}</dd><dt className="text-xs text-mute">Won</dt></div>
              <div><dd className="tnum text-2xl font-semibold">{winRate === null ? '—' : `${winRate}%`}</dd><dt className="text-xs text-mute">Win rate</dt></div>
            </dl>
            <p className="mt-4 flex items-center gap-1.5 border-t-2 border-line pt-4 text-xs text-mute"><Zap size={13} className="text-gold-dark" fill="currentColor" />{XP.duelWin} XP for a win, {XP.duelPlay} XP for taking part</p>
          </Panel>
        </div>
      )}

      {(phase === 'waiting' || phase === 'joining') && (
        <Panel className="mx-auto flex max-w-md flex-col items-center p-8 text-center">
          <Mascot expression="thinking" size={110} />
          {phase === 'waiting' ? (
            <>
              <p className="mt-4 text-sm text-mute">Share this code with your opponent</p>
              <button onClick={copy} className="mt-2 flex items-center gap-3 rounded-xl border-2 border-line bg-surface px-5 py-3 font-mono text-3xl font-bold tracking-[0.3em] hover:border-sky" aria-label={`Room code ${code}. Copy`}>
                {code}{copied ? <Check size={18} className="text-ok" /> : <Copy size={18} className="text-mute" />}
              </button>
              <p className="mt-4 flex items-center gap-2 text-sm text-mute"><LoaderCircle size={15} className="animate-spin" />Waiting for someone to join…</p>
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-mute"><LoaderCircle size={15} className="animate-spin" />Joining room {code}. Waiting for the host…</p>
          )}
          <Button variant="ghost" className="mt-5" onClick={leave}>Cancel</Button>
        </Panel>
      )}

      {phase === 'countdown' && match && (
        <Panel className="mx-auto flex max-w-md flex-col items-center p-10 text-center">
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center gap-2"><Avatar avatar={me.avatar} size={64} /><span className="text-sm font-semibold">{me.name}</span></div>
            <Swords size={26} className="text-faint" />
            <div className="flex flex-col items-center gap-2"><Avatar avatar={match.opponent.avatar} size={64} /><span className="text-sm font-semibold">{match.opponent.name}</span></div>
          </div>
          <p key={Math.ceil((match.startAt - now) / 1000)} className="animate-pop tnum mt-8 text-7xl font-bold text-ice">{Math.max(1, Math.ceil((match.startAt - now) / 1000))}</p>
          <p className="mt-3 text-sm text-mute">Get ready…</p>
        </Panel>
      )}

      {phase === 'playing' && match && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <ScoreCard player={me} score={mine} you leading={mine.passed > theirs.passed} />
            <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-line bg-card px-5 py-3">
              <Clock size={16} className={match.endAt - now < 30_000 ? 'text-bad' : 'text-cyan'} />
              <span className={cx('tnum mt-1 text-xl font-semibold', match.endAt - now < 30_000 && 'text-bad')}>{formatClock(match.endAt - now)}</span>
            </div>
            <ScoreCard player={match.opponent} score={theirs} leading={theirs.passed > mine.passed} />
          </div>
          <Panel className="p-6">
            <div className="mb-3 flex items-center gap-2.5"><Tag color="var(--color-ice)">{match.problem.difficulty}</Tag><h2 className="text-lg font-semibold">{match.problem.title}</h2></div>
            <Workbench lang={match.problem.lang} exercise={match.problem.exercise} onCheck={onCheck} showHints={false} />
          </Panel>
          <div className="text-right"><Button variant="danger" size="sm" onClick={leave}>Forfeit</Button></div>
        </div>
      )}

      {phase === 'result' && match && verdict && (
        <Panel className="mx-auto max-w-xl p-8 text-center">
          <Mascot expression={verdict === 'win' ? 'victorious' : verdict === 'draw' ? 'determined' : 'disappointed'} size={140} float={verdict === 'win'} className="mx-auto" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{verdict === 'win' ? `${me.name} wins` : verdict === 'draw' ? 'It is a draw' : `${match.opponent.name} wins`}</h2>
          <p className="mt-1.5 text-sm text-mute">{opponentLeft ? `${match.opponent.name} left the duel.` : match.problem.title}</p>
          <div className="mt-6 flex flex-col gap-3 text-left sm:flex-row">
            <ScoreCard player={me} score={mine} you leading={verdict === 'win'} />
            <ScoreCard player={match.opponent} score={theirs} leading={verdict === 'loss'} />
          </div>
          <p className="tnum mx-auto mt-6 flex w-fit items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 font-semibold text-gold-dark"><Zap size={16} fill="currentColor" />+{earned} XP</p>
          <Button size="lg" className="mt-6" onClick={leave}>Back to the lobby</Button>
        </Panel>
      )}
    </div>
  )
}
