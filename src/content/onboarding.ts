import { AppWindow, Briefcase, Gamepad2, GraduationCap, Rocket, Smile, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LangId } from '../lib/types'

export interface Reason { id: string; label: string; icon: LucideIcon; wow: string }

/** Why people learn to code. `wow` is QUEST's encouraging reaction to the choice. */
export const REASONS: Reason[] = [
  { id: 'apps', label: 'Build apps and websites', icon: AppWindow, wow: 'Building your own apps is a brilliant goal. Every app you use started with a single line of code.' },
  { id: 'games', label: 'Make games', icon: Gamepad2, wow: 'A game maker in the making! Every great game began with someone typing their very first line.' },
  { id: 'career', label: 'Boost my career', icon: Briefcase, wow: 'Smart move. Coding is one of the most useful skills you can add to almost any job.' },
  { id: 'school', label: 'School or exams', icon: GraduationCap, wow: 'Great plan! A little practice each day and you will be ready for anything they throw at you.' },
  { id: 'automate', label: 'Automate tasks and use data', icon: Workflow, wow: 'You are going to save so much time. Code can do the boring jobs for you while you do the fun ones.' },
  { id: 'fun', label: 'Just for fun', icon: Smile, wow: 'Curiosity is the best reason of all. You are going to love working things out, one puzzle at a time.' },
]

export interface Level { id: string; label: string; bars: 1 | 2 | 3 | 4 }

export const LEVELS: Level[] = [
  { id: 'new', label: 'I am new to coding', bars: 1 },
  { id: 'basics', label: 'I know a few basics', bars: 2 },
  { id: 'simple', label: 'I can write simple programs', bars: 3 },
  { id: 'comfortable', label: 'I am comfortable coding', bars: 4 },
]

/** What the chosen language lets you do, for the "what you can do with code" screen. */
export const WITH_CODE: Record<LangId, string> = {
  python: 'Automate boring tasks, analyse data and build AI tools.',
  javascript: 'Bring web pages to life and build web apps.',
  cpp: 'Create fast games and powerful software.',
  java: 'Build Android apps and large business systems.',
  html: 'Build the structure of every web page.',
  css: 'Make websites look beautiful on any screen.',
  sql: 'Ask questions of data and get answers in seconds.',
}

export interface Benefit { icon: LucideIcon; title: string; body: string }

export const GENERAL_BENEFITS: Benefit[] = [
  { icon: Rocket, title: 'Build things people use', body: 'Turn your ideas into real apps, sites and games.' },
  { icon: Briefcase, title: 'Open new doors', body: 'Coding skills are valued in almost every industry.' },
]
