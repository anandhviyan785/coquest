import { Database } from 'lucide-react'
import cppLogo from '../assets/langs/cpp.svg'
import cssLogo from '../assets/langs/css.svg'
import htmlLogo from '../assets/langs/html.svg'
import javaLogo from '../assets/langs/java.svg'
import javascriptLogo from '../assets/langs/javascript.svg'
import pythonLogo from '../assets/langs/python.svg'
import { LANG_LABEL } from '../content'
import type { LangId } from '../lib/types'

/**
 * Official language logos (from the MIT-licensed Devicon set; each logo remains its owner's
 * trademark and is used only to identify the language). SQL is a standard with no official
 * logo, so it gets a neutral database icon.
 */
const LOGOS: Partial<Record<LangId, string>> = {
  python: pythonLogo,
  javascript: javascriptLogo,
  cpp: cppLogo,
  java: javaLogo,
  html: htmlLogo,
  css: cssLogo,
}

export function LangLogo({ lang, size = 28 }: { lang: LangId; size?: number }) {
  const src = LOGOS[lang]
  if (!src) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#336791] text-white" style={{ width: size, height: size }} role="img" aria-label={`${LANG_LABEL[lang]} logo`}>
        <Database size={Math.round(size * 0.62)} strokeWidth={2.4} />
      </span>
    )
  }
  return <img src={src} alt={`${LANG_LABEL[lang]} logo`} width={size} height={size} className="shrink-0" style={{ width: size, height: size }} />
}
