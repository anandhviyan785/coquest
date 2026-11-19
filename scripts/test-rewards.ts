/**
 * Tests the Daily Rewards, bonus chests and Daily Puzzle rules, and checks every puzzle in the bank.
 *   node scripts/test-rewards.ts
 * Python and JavaScript "find the output" puzzles are run for real when python / node are available.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { PUZZLES, puzzleForDay, puzzleReward, puzzleStreak, recordPuzzle, typedMatches } from '../src/content/puzzles/index.ts'
import { addDays } from '../src/lib/dates.ts'
import { newUserState } from '../src/lib/gamification.ts'
import { CYCLE, canClaimDaily, claimDaily, cycleDayFor, cycleSlots, milestoneChests, openChest, rollLoot } from '../src/lib/rewards.ts'

let passed = 0
const test = (name: string, fn: () => void) => {
  try {
    fn()
    passed += 1
  } catch (err) {
    console.error(`FAIL ${name}`)
    throw err
  }
}

const DAY = '2026-11-19'
const fresh = () => ({ ...newUserState('tester'), onboarded: true })

// ── Daily Rewards ──────────────────────────────────────────────────────────
test('a chest can be claimed once per day', () => {
  const first = claimDaily(fresh(), 'seed', DAY)
  assert.ok(first.claim)
  assert.equal(first.claim.cycleDay, 1)
  assert.ok(first.state.xp > 0 && first.state.gems > 0)
  const second = claimDaily(first.state, 'seed', DAY)
  assert.equal(second.claim, null)
  assert.equal(second.state, first.state)
  assert.equal(canClaimDaily(first.state, DAY), false)
})

test('consecutive claims advance the 7-day cycle and day 7 is legendary', () => {
  let s = fresh()
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(DAY, i)
    assert.equal(cycleDayFor(s, day), i + 1)
    const r = claimDaily(s, 'seed', day)
    assert.equal(r.claim?.rarity, CYCLE[i])
    s = r.state
  }
  assert.equal(s.rewardClaims[addDays(DAY, 6)].rarity, 'legendary')
  assert.equal(cycleDayFor(s, addDays(DAY, 7)), 1, 'the cycle starts again after day 7')
})

test('missing a day restarts the cycle', () => {
  const s = claimDaily(fresh(), 'seed', DAY).state
  assert.equal(cycleDayFor(s, addDays(DAY, 2)), 1)
})

test('cycle slots show claimed, available and locked days', () => {
  const s = claimDaily(fresh(), 'seed', DAY).state
  const slots = cycleSlots(s, addDays(DAY, 1))
  assert.deepEqual(slots.map((x) => x.state), ['claimed', 'available', 'locked', 'locked', 'locked', 'locked', 'locked'])
})

test('loot is repeatable for the same seed and stays in range', () => {
  assert.deepEqual(rollLoot('epic', 'a'), rollLoot('epic', 'a'))
  for (let i = 0; i < 200; i += 1) {
    const l = rollLoot('legendary', `x${i}`)
    assert.ok(l.xp >= 60 && l.xp <= 90 && l.gems >= 50 && l.gems <= 80)
    assert.equal(rollLoot('rare', `x${i}`).savers, 0)
  }
})

test('claiming records gem history and caps streak savers', () => {
  const s = { ...fresh(), freezes: 5 }
  const r = claimDaily(s, 'seed', DAY)
  assert.equal(r.state.gemLog[0].amount, r.claim?.gems)
  assert.ok(r.state.freezes <= 5)
})

test('milestones give chests and a chest opens only once', () => {
  const before = fresh()
  const after = { ...before, xp: 350, streakRewards: [7] }
  const s = milestoneChests(before, after, ['first-steps'])
  assert.deepEqual(s.chests.map((c) => c.rarity).sort(), ['epic', 'legendary', 'rare', 'rare'])
  const id = s.chests[0].id
  const opened = openChest(s, id, 'seed')
  assert.ok(opened.loot)
  assert.equal(opened.state.chests.length, 3)
  assert.equal(openChest(opened.state, id, 'seed').loot, null)
})

// ── Daily Puzzle ───────────────────────────────────────────────────────────
test('puzzle rewards: full XP first try, less after misses, participation when unsolved', () => {
  assert.deepEqual(puzzleReward(1, true, 1), { xp: 15, gems: 0 })
  assert.deepEqual(puzzleReward(3, true, 1), { xp: 40, gems: 15 })
  assert.equal(puzzleReward(2, true, 3).xp, 13)
  assert.deepEqual(puzzleReward(3, false, 3), { xp: 5, gems: 0 })
})

test('a day records only one puzzle and runs are counted', () => {
  const result = { at: '', lang: 'python' as const, puzzleId: 'py-out-1', solved: true, attempts: 1, xp: 15, gems: 0 }
  const s = recordPuzzle(recordPuzzle(fresh(), result, addDays(DAY, -1)), result, DAY)
  assert.equal(recordPuzzle(s, { ...result, xp: 99 }, DAY).puzzles[DAY].xp, 15)
  assert.equal(puzzleStreak(s, DAY), 2)
})

test('today\'s puzzle is stable, matches the language and skips seen ones', () => {
  const a = puzzleForDay('cpp', 1, new Set(), DAY)
  assert.equal(a, puzzleForDay('cpp', 1, new Set(), DAY))
  assert.ok(a.id.startsWith('cpp-'))
  assert.notEqual(puzzleForDay('cpp', 1, new Set([a.id]), DAY).id, a.id)
})

test('typed answers ignore spaces and a trailing semicolon', () => {
  assert.ok(typedMatches(' len( fruits ); ', ['len(fruits)']))
  assert.ok(!typedMatches('size(fruits)', ['len(fruits)']))
})

test('every puzzle is well formed and each language has every difficulty', () => {
  const ids = new Set<string>()
  for (const [lang, bank] of Object.entries(PUZZLES)) {
    for (const d of [1, 2, 3]) assert.ok(bank.filter((p) => p.difficulty === d).length >= 3, `${lang} needs 3+ puzzles at difficulty ${d}`)
    for (const p of bank) {
      assert.ok(!ids.has(p.id), `duplicate id ${p.id}`)
      ids.add(p.id)
      assert.ok(p.explain.length > 10 && p.prompt.length > 5, p.id)
      if ('options' in p) {
        assert.ok(p.answer >= 0 && p.answer < p.options.length, p.id)
        assert.equal(new Set(p.options).size, p.options.length, `${p.id} has duplicate options`)
      }
      if (p.kind === 'bug') assert.ok(p.answer >= 0 && p.answer < p.code.split('\n').length, p.id)
      if (p.kind === 'order') assert.ok(p.lines.length >= 3, p.id)
      if (p.kind === 'type') assert.ok(p.accepted.length > 0, p.id)
    }
  }
})

// Run real code for "find the output" puzzles in Python and JavaScript.
const run = (cmd: string, args: string[], code: string): string | null => {
  const res = spawnSync(cmd, args, { input: code, encoding: 'utf8', timeout: 20_000 })
  return res.status === 0 ? res.stdout.trim().split(/\r?\n/).join(' ') : null
}
test('python and javascript output puzzles print what their answer says', () => {
  for (const p of PUZZLES.python) {
    if (p.kind !== 'output') continue
    const out = run('python', ['-'], p.code)
    if (out !== null) assert.equal(out, p.options[p.answer], p.id)
  }
  for (const p of PUZZLES.javascript) {
    if (p.kind !== 'output') continue
    const out = run('node', ['--input-type=module', '-'], p.code)
    if (out !== null) assert.equal(out, p.options[p.answer].replace(/^"|"$/g, ''), p.id)
  }
})

console.log(`${passed} reward and puzzle tests passed`)
