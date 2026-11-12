import type { ChoiceQuestion, CssTest, DomTest, FillQuestion, OutputTest } from '../lib/types.ts'

export const choice = (prompt: string, options: string[], answer: number, explain: string, code?: string): ChoiceQuestion => ({
  type: 'choice', prompt, options, answer, explain, code,
})

/** `code` contains ___ where the learner types; any of `answers` is accepted. */
export const fill = (prompt: string, code: string, answers: string[], explain: string): FillQuestion => ({
  type: 'fill', prompt, code, answers, explain,
})

export const out = (name: string, expected: string, extra: { stdin?: string; append?: string } = {}): OutputTest => ({
  name, expected, ...extra,
})

export const dom = (name: string, selector: string, text?: string): DomTest => ({ kind: 'dom', name, selector, text })

export const css = (name: string, selector: string, prop: string, value: string): CssTest => ({ kind: 'css', name, selector, prop, value })
