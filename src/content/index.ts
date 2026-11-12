import type { Boss, Course, LangId, Lesson, Unit } from '../lib/types.ts'
import { cpp } from './cpp.ts'
import { css } from './css.ts'
import { html } from './html.ts'
import { java } from './java.ts'
import { javascript } from './javascript.ts'
import { unit1 } from './python/unit1.ts'
import { unit2 } from './python/unit2.ts'
import { unit3 } from './python/unit3.ts'
import { unit4 } from './python/unit4.ts'
import { unit5 } from './python/unit5.ts'
import { unit6 } from './python/unit6.ts'
import { sql } from './sql.ts'

const python: Course = {
  id: 'python',
  name: 'Python',
  tagline: 'Readable, friendly and powerful',
  units: [unit1, unit2, unit3, unit4, unit5, unit6],
}

export const COURSES: Course[] = [python, javascript, cpp, java, html, css, sql]

export const LANG_LABEL: Record<LangId, string> = {
  python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', html: 'HTML', css: 'CSS', sql: 'SQL',
}

/** Short glyph shown on language badges. */
export const LANG_GLYPH: Record<LangId, string> = {
  python: 'Py', javascript: 'JS', cpp: 'C++', java: 'Jv', html: '<>', css: '{}', sql: 'DB',
}

export const courseById = (id: string): Course | undefined => COURSES.find((c) => c.id === id)

export interface LessonRef { course: Course; unit: Unit; lesson: Lesson; index: number }
export interface BossRef { course: Course; unit: Unit; boss: Boss }

export const findLesson = (id: string): LessonRef | undefined => {
  for (const course of COURSES) {
    for (const unit of course.units) {
      const index = unit.lessons.findIndex((l) => l.id === id)
      if (index >= 0) return { course, unit, lesson: unit.lessons[index], index }
    }
  }
  return undefined
}

export const findBoss = (id: string): BossRef | undefined => {
  for (const course of COURSES) {
    for (const unit of course.units) {
      if (unit.boss?.id === id) return { course, unit, boss: unit.boss }
    }
  }
  return undefined
}

export const allBosses = (): BossRef[] =>
  COURSES.flatMap((course) => course.units.flatMap((unit) => (unit.boss ? [{ course, unit, boss: unit.boss }] : [])))

/** Lesson and boss ids for a course, in the order they are played. */
export const courseSteps = (course: Course): string[] =>
  course.units.flatMap((unit) => [...unit.lessons.map((l) => l.id), ...(unit.boss ? [unit.boss.id] : [])])

export const courseProgress = (course: Course, done: Record<string, unknown>) => {
  const steps = courseSteps(course)
  const completed = steps.filter((id) => done[id]).length
  return { completed, total: steps.length, pct: steps.length ? Math.round((completed / steps.length) * 100) : 0 }
}

/** The first step in a course that has not been completed, or null when the course is finished. */
export const nextStep = (course: Course, done: Record<string, unknown>): string | null =>
  courseSteps(course).find((id) => !done[id]) ?? null

/** A step is playable when it is the first one or the step before it is complete. */
export const isUnlocked = (course: Course, id: string, done: Record<string, unknown>): boolean => {
  const steps = courseSteps(course)
  const at = steps.indexOf(id)
  return at <= 0 || Boolean(done[steps[at - 1]])
}

export const stepPath = (id: string): string => (id.startsWith('boss:') ? `/boss/${encodeURIComponent(id)}` : `/lesson/${id}`)

export const stepTitle = (id: string): string =>
  id.startsWith('boss:') ? findBoss(id)?.boss.title ?? 'Boss battle' : findLesson(id)?.lesson.title ?? 'Lesson'
