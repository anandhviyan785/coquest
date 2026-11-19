import { ArrowLeft, Search } from 'lucide-react'
import { BookIcon } from '../components/icons'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { LangLogo } from '../components/LangLogo'
import { cx } from '../components/ui'
import { courseById } from '../content'
import { CODING_BASICS, DEV_TERMS, GLOSSARIES } from '../content/glossary'
import type { GlossaryTerm } from '../content/glossary'

type Group = 'all' | 'lang' | 'basics' | 'dev'

const matches = (t: GlossaryTerm, q: string): boolean =>
  !q || `${t.term} ${t.definition} ${t.example ?? ''}`.toLowerCase().includes(q)

function TermList({ title, terms }: { title: string; terms: GlossaryTerm[] }) {
  if (terms.length === 0) return null
  return (
    <section className="mb-9">
      <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
      <dl className="soft-card overflow-hidden">
        {terms.map((t) => (
          <div key={t.term} className="border-b-2 border-line px-5 py-4 last:border-b-0">
            <dt className="font-mono text-[15px] font-bold text-blue-dark">{t.term}</dt>
            <dd className="mt-1 text-[15px] leading-relaxed text-body">{t.definition}</dd>
            {t.example && <dd className="mt-2"><code className="inline-block whitespace-pre-wrap rounded-lg bg-surface px-2 py-1 font-mono text-[13px] text-ink">{t.example}</code></dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}

export function Glossary() {
  const { courseId = '' } = useParams()
  const course = courseById(courseId)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<Group>('all')
  const q = query.trim().toLowerCase()

  const show = (g: Group) => group === 'all' || group === g
  const own = useMemo(() => (course && show('lang') ? GLOSSARIES[course.id].filter((t) => matches(t, q)) : []), [course, q, group]) // eslint-disable-line react-hooks/exhaustive-deps
  const basics = useMemo(() => (show('basics') ? CODING_BASICS.filter((t) => matches(t, q)) : []), [q, group]) // eslint-disable-line react-hooks/exhaustive-deps
  const dev = useMemo(() => (show('dev') ? DEV_TERMS.filter((t) => matches(t, q)) : []), [q, group]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!course) return <Navigate to="/" replace />

  return (
    <div>
      <Link to={`/learn/${course.id}`} className="label mb-5 inline-flex items-center gap-2 text-[13px] text-blue hover:brightness-90"><ArrowLeft size={16} strokeWidth={3} />Back to {course.name}</Link>

      <header className="mb-6 flex items-center gap-4">
        <span className="relative"><LangLogo lang={course.id} size={52} /><BookIcon size={26} className="absolute -bottom-2 -right-2" /></span>
        <div>
          <h1 className="text-2xl font-bold text-ink">{course.name} glossary</h1>
          <p className="text-[15px] text-mute">Key {course.name} terms, coding basics, and the developer words you will hear everywhere.</p>
        </div>
      </header>

      <label className="relative mb-4 block">
        <Search size={20} strokeWidth={2.6} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms" aria-label="Search terms" className="h-[50px] w-full rounded-xl border-2 border-line bg-surface pl-12 pr-4 text-[17px] text-ink outline-none placeholder:text-faint focus:border-blue-line" />
      </label>

      <div className="mb-7 flex flex-wrap gap-2" role="tablist" aria-label="Filter terms">
        {([['all', 'All'], ['lang', course.name], ['basics', 'Coding basics'], ['dev', 'Developer terms']] as Array<[Group, string]>).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={group === id} onClick={() => setGroup(id)} className={cx('press rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold', group === id ? 'border-blue bg-blue text-white' : 'border-line bg-card text-mute hover:text-body')}>{label}</button>
        ))}
      </div>

      <TermList title={`${course.name} terms`} terms={own} />
      <TermList title="Coding basics" terms={basics} />
      <TermList title="Developer terms" terms={dev} />
      {own.length === 0 && basics.length === 0 && dev.length === 0 && (
        <p className={cx('rounded-2xl border-2 border-line p-6 text-center text-[15px] text-mute')}>{q ? <>No terms match “{query.trim()}”.</> : 'No terms in this group.'}</p>
      )}
    </div>
  )
}
