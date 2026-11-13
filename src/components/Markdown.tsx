import type { ReactNode } from 'react'

/** A small, safe Markdown renderer for tutor replies: fenced code, headings, lists, bold and inline code. No HTML is ever injected. */

const inline = (text: string): ReactNode[] =>
  text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="rounded-md border-2 border-line bg-surface px-1.5 py-0.5 font-mono text-[13px] text-ice">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    return <span key={i}>{part}</span>
  })

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.replace(/\r/g, '').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trimStart().startsWith('```')) {
      const code: string[] = []
      i += 1
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) code.push(lines[i++])
      i += 1
      blocks.push(<pre key={blocks.length} className="overflow-x-auto rounded-xl border-2 border-line bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-ink"><code>{code.join('\n')}</code></pre>)
    } else if (/^#{1,4}\s/.test(line)) {
      blocks.push(<p key={blocks.length} className="font-semibold text-ink">{inline(line.replace(/^#{1,4}\s/, ''))}</p>)
      i += 1
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\.\s/.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s/, ''))
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={blocks.length} className={`space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-faint`}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</List>)
    } else if (line.trim() === '') {
      i += 1
    } else {
      const para: string[] = []
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].trimStart().startsWith('```') && !/^\s*([-*]|\d+\.)\s/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i])) para.push(lines[i++])
      blocks.push(<p key={blocks.length}>{inline(para.join(' '))}</p>)
    }
  }
  return <div className="space-y-3 text-[15px] leading-relaxed text-body">{blocks}</div>
}
