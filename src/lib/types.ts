export type LangId = 'python' | 'javascript' | 'cpp' | 'java' | 'html' | 'css' | 'sql'

export type Expression =
  | 'happy' | 'thinking' | 'excited' | 'disappointed'
  | 'sleeping' | 'victorious' | 'curious' | 'determined'

/** Runs the learner's code (plus optional appended driver code) and compares stdout. */
export interface OutputTest { kind?: 'output'; name: string; stdin?: string; append?: string; expected: string }
/** Checks the learner's HTML for an element, optionally containing some text. */
export interface DomTest { kind: 'dom'; name: string; selector: string; text?: string }
/** Checks the learner's CSS for a declaration on a selector. */
export interface CssTest { kind: 'css'; name: string; selector: string; prop: string; value: string }
export type Test = OutputTest | DomTest | CssTest

export interface Exercise {
  prompt: string
  starter: string
  tests: Test[]
  hints: string[]
  /** Reference answer. Used by scripts/verify-content to prove the tests are passable; never shown in the UI. */
  solution: string
  /** SQL only: statements that seed the database before the learner's query. */
  setup?: string
  /** CSS only: markup the learner's stylesheet is previewed against. */
  markup?: string
}

export interface ChoiceQuestion { type: 'choice'; prompt: string; code?: string; options: string[]; answer: number; explain: string }
export interface FillQuestion { type: 'fill'; prompt: string; code: string; answers: string[]; explain: string }
export type Question = ChoiceQuestion | FillQuestion

export interface Lesson {
  id: string
  title: string
  summary: string
  explain: string[]
  example: { code: string; output?: string }
  questions: Question[]
  exercise: Exercise
}

export interface Boss {
  id: string
  title: string
  monster: string
  story: string
  stages: Exercise[]
}

export interface Unit { id: string; title: string; lessons: Lesson[]; boss?: Boss }

export interface Course { id: LangId; name: string; tagline: string; units: Unit[] }

export interface Challenge {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  lang: LangId
  exercise: Exercise
}

export interface DayLog {
  xp: number
  seconds: number
  lessons: number
  correct: number
  attempts: number
  langs: Partial<Record<LangId, number>>
}

export interface LessonResult { at: string; accuracy: number; xp: number; perfect: boolean }

export type HistoryKind = 'lesson' | 'boss' | 'daily' | 'duel' | 'reward'
export interface HistoryItem { at: string; kind: HistoryKind; title: string; xp: number }

/** What the player told QUEST in the welcome flow. */
export interface Profile {
  language: LangId | null
  reason: string | null
  level: string | null
  /** True when the player allowed practice reminders. */
  reminders: boolean
}

export interface UserState {
  username: string
  avatar: string
  /** False until the player has finished the welcome flow. */
  onboarded: boolean
  profile: Profile
  xp: number
  streak: number
  longestStreak: number
  lastActive: string | null
  freezes: number
  dailyGoal: number
  weekStart: string
  weeklyXp: number
  lessons: Record<string, LessonResult>
  days: Record<string, DayLog>
  achievements: Record<string, string>
  daily: Record<string, { ms: number }>
  streakRewards: number[]
  duels: { played: number; won: number }
  /** Currency earned alongside XP and spent in the shop. */
  gems: number
  /** Daily quest ids already claimed, keyed by day. */
  questClaims: Record<string, string[]>
  /** An open Double or Nothing wager: the streak it was placed at and the streak that wins it. */
  wager: { base: number; target: number } | null
  history: HistoryItem[]
  createdAt: string
}
