/**
 * Proves the curriculum is passable: runs every exercise's reference solution against its tests.
 *   node scripts/verify-content.ts
 * Python runs with the local interpreter, JavaScript with Node, Java with a local JDK (when present).
 * SQL, HTML, CSS and C++ are structurally checked here and exercised in the browser.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CHALLENGES } from '../src/content/challenges.ts'
import { COURSES } from '../src/content/index.ts'
import type { Exercise, LangId } from '../src/lib/types.ts'

const normalise = (text: string): string => text.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim()
const has = (cmd: string, args: string[]): boolean => spawnSync(cmd, args, { encoding: 'utf8' }).status === 0
const HAS_PYTHON = has('python', ['--version'])
const HAS_JAVA = has('java', ['-version'])

const JS_PRELUDE = 'const __in = require("fs").readFileSync(0, "utf8").split("\\n"); let __i = 0; const readLine = () => (__i < __in.length ? __in[__i++] : null); const prompt = readLine;\n'

const execute = (lang: LangId, code: string, stdin: string): { stdout: string; error: string } | null => {
  const dir = mkdtempSync(join(tmpdir(), 'coquest-'))
  const run = (cmd: string, args: string[]) => {
    const res = spawnSync(cmd, args, { input: stdin, encoding: 'utf8', cwd: dir, timeout: 20_000 })
    return { stdout: res.stdout ?? '', error: res.status === 0 ? '' : (res.stderr ?? '') || `exit ${res.status}` }
  }
  if (lang === 'python' && HAS_PYTHON) {
    writeFileSync(join(dir, 'main.py'), code)
    return run('python', ['main.py'])
  }
  if (lang === 'javascript') {
    writeFileSync(join(dir, 'main.cjs'), JS_PRELUDE + code)
    return run('node', ['main.cjs'])
  }
  if (lang === 'java' && HAS_JAVA) {
    writeFileSync(join(dir, 'Main.java'), code)
    return run('java', ['Main.java'])
  }
  return null
}

let passed = 0
let skipped = 0
const failures: string[] = []

const check = (label: string, lang: LangId, exercise: Exercise): void => {
  if (!exercise.solution.trim()) failures.push(`${label}: missing solution`)
  if (exercise.tests.length === 0) failures.push(`${label}: no tests`)
  if (exercise.hints.length === 0) failures.push(`${label}: no hints`)
  if (normalise(exercise.starter) === normalise(exercise.solution)) failures.push(`${label}: starter already equals the solution`)
  for (const test of exercise.tests) {
    if (test.kind === 'dom' || test.kind === 'css') {
      skipped += 1
      continue
    }
    const source = test.append ? `${exercise.solution}\n${test.append}` : exercise.solution
    const result = execute(lang, source, test.stdin ?? '')
    if (!result) {
      skipped += 1
      continue
    }
    const actual = normalise(result.stdout)
    if (result.error || actual !== normalise(test.expected)) {
      failures.push(`${label} › ${test.name}\n    expected: ${JSON.stringify(normalise(test.expected))}\n    actual:   ${JSON.stringify(actual)}${result.error ? `\n    error:    ${result.error.trim().split('\n').pop()}` : ''}`)
    } else {
      passed += 1
    }
  }
}

const ids = new Set<string>()
const claim = (id: string): void => {
  if (ids.has(id)) failures.push(`Duplicate id: ${id}`)
  ids.add(id)
}

for (const course of COURSES) {
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      claim(lesson.id)
      if (lesson.questions.length === 0) failures.push(`${lesson.id}: no questions`)
      lesson.questions.forEach((q, i) => {
        if (q.type === 'choice' && (q.answer < 0 || q.answer >= q.options.length)) failures.push(`${lesson.id} question ${i + 1}: answer index out of range`)
        if (q.type === 'fill' && !q.code.includes('___')) failures.push(`${lesson.id} question ${i + 1}: no blank in code`)
      })
      check(lesson.id, course.id, lesson.exercise)
    }
    if (unit.boss) {
      claim(unit.boss.id)
      unit.boss.stages.forEach((stage, i) => check(`${unit.boss?.id} stage ${i + 1}`, course.id, stage))
    }
  }
}
for (const challenge of CHALLENGES) {
  claim(`challenge:${challenge.id}`)
  check(`challenge:${challenge.id}`, challenge.lang, challenge.exercise)
}

console.log(`python: ${HAS_PYTHON ? 'available' : 'missing'}, java: ${HAS_JAVA ? 'available' : 'missing'}`)
console.log(`${passed} tests passed, ${skipped} not runnable here, ${failures.length} failed`)
if (failures.length > 0) {
  console.log('\n' + failures.join('\n'))
  process.exit(1)
}
