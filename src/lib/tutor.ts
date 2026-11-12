import { supabase } from './supabase'

export interface TutorMessage { role: 'user' | 'assistant'; content: string }

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface TutorContext { level: SkillLevel; language: string; code?: string }

export const MAX_MESSAGE_CHARS = 4000
export const MAX_CODE_CHARS = 8000
const MAX_TURNS_SENT = 24

/** Skill level for the tutor, inferred from how far the learner has come. */
export const skillLevelFor = (level: number, lessonsDone: number): SkillLevel =>
  level >= 8 || lessonsDone >= 30 ? 'advanced' : level >= 3 || lessonsDone >= 8 ? 'intermediate' : 'beginner'

/** Sends the conversation to the `tutor` Edge Function, which calls Claude with the server-side API key. */
export const askTutor = async (messages: TutorMessage[], context: TutorContext): Promise<string> => {
  if (!supabase) throw new Error('The AI tutor needs a Supabase project. See the README to set one up.')
  const { data, error } = await supabase.functions.invoke('tutor', {
    body: { messages: messages.slice(-MAX_TURNS_SENT), level: context.level, language: context.language, code: context.code?.slice(0, MAX_CODE_CHARS) },
  })
  if (error) {
    // Edge Function errors carry the JSON body on error.context; surface its message when present.
    const response = (error as { context?: Response }).context
    const detail = response ? await response.json().catch(() => null) : null
    throw new Error(typeof detail?.error === 'string' ? detail.error : 'The tutor could not be reached. Check that the tutor function is deployed.')
  }
  if (typeof data?.reply !== 'string') throw new Error('The tutor sent back an empty reply. Try again.')
  return data.reply
}
