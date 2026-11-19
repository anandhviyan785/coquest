import type { LangId } from '../../lib/types.ts'

export type Difficulty = 1 | 2 | 3

interface Base {
  id: string
  title: string
  difficulty: Difficulty
  prompt: string
  /** Shown after answering, right or wrong. */
  explain: string
}

/** What does this code print? Pick from options. */
export interface OutputPuzzle extends Base { kind: 'output'; code: string; options: string[]; answer: number }
/** Fill the blank (___) in the code. Pick from options. */
export interface MissingPuzzle extends Base { kind: 'missing'; code: string; options: string[]; answer: number }
/** Tap the line that contains the bug. `answer` is a 0-based line index of `code`. */
export interface BugPuzzle extends Base { kind: 'bug'; code: string; answer: number }
/** A concept question, optionally with code. */
export interface ChoicePuzzle extends Base { kind: 'choice'; code?: string; options: string[]; answer: number }
/** Put the lines in the right order. `lines` is the correct order; the game shuffles them. */
export interface OrderPuzzle extends Base { kind: 'order'; lines: string[] }
/** A short coding challenge: type the missing code. Any accepted answer counts (spaces are ignored). */
export interface TypePuzzle extends Base { kind: 'type'; code: string; accepted: string[] }

export type Puzzle = OutputPuzzle | MissingPuzzle | BugPuzzle | ChoicePuzzle | OrderPuzzle | TypePuzzle

export type PuzzleBank = Record<LangId, Puzzle[]>

export const KIND_LABEL: Record<Puzzle['kind'], string> = {
  output: 'Find the output',
  missing: 'Complete the code',
  bug: 'Spot the bug',
  choice: 'Quick quiz',
  order: 'Arrange the code',
  type: 'Code challenge',
}
