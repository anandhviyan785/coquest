import { ArrowLeft, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { LangLogo } from '../components/LangLogo'
import { cx } from '../components/ui'
import { courseById } from '../content'
import { CODING_BASICS, DEV_TERMS, GLOSSARIES } from '../content/glossary'
import type { GlossaryTerm } from '../content/glossary'

const matches = (t: GlossaryTerm, q: string): boolean =>
  !q || `${t.term} ${t.definition} ${t.example ?? ''}`.toLowerCase().includes(q)

function TermList({ title, terms }: { title: string; terms: GlossaryTerm[] }) {
  if (terms.length === 0) return null
  return (
    <section className="mb-9">
      <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
      <dl className="overflow-hidden rounded-2xl border-2 border-line">
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
  const q = query.trim().toLowerCase()

  const own = useMemo(() => (course ? GLOSSARIES[course.id].filter((t) => matches(t, q)) : []), [course, q])
  const basics = useMemo(() => CODING_BASICS.filter((t) => matches(t, q)), [q])
  const dev = useMemo(() => DEV_TERMS.filter((t) => matches(t, q)), [q])

  if (!course) return <Navigate to="/" replace />

  return (
    <div>
      <Link to={`/learn/${course.id}`} className="label mb-5 inline-flex items-center gap-2 text-[13px] text-blue hover:brightness-90"><ArrowLeft size={16} strokeWidth={3} />Back to {course.name}</Link>

      <header className="mb-6 flex items-center gap-4">
        <LangLogo lang={course.id} size={52} />
        <div>
          <h1 className="text-2xl font-bold text-ink">{course.name} glossary</h1>
          <p className="text-[15px] text-mute">Key {course.name} terms, coding basics, and the developer words you will hear everywhere.</p>
        </div>
      </header>

      <label className="relative mb-8 block">
        <Search size={20} strokeWidth={2.6} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms" aria-label="Search terms" className="h-[50px] w-full rounded-xl border-2 border-line bg-surface pl-12 pr-4 text-[17px] text-ink outline-none placeholder:text-faint focus:border-blue-line" />
      </label>

      <TermList title={`${course.name} terms`} terms={own} />
      <TermList title="Coding basics" terms={basics} />
      <TermList title="Developer terms" terms={dev} />
      {own.length === 0 && basics.length === 0 && dev.length === 0 && (
        <p className={cx('rounded-2xl border-2 border-line p-6 text-center text-[15px] text-mute')}>No terms match “{query.trim()}”.</p>
      )}
    </div>
  )
}
