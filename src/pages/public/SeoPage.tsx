import { Link } from 'react-router-dom'
import { Mascot } from '../../components/Mascot'
import { LinkButton } from '../../components/ui'
import { PUBLIC_PAGES } from '../../content/seo'
import type { PublicPage } from '../../content/seo'
import { useSeo } from '../../lib/useSeo'
import { PublicShell, useStartLink } from './PublicShell'

/** One of the public landing pages (see content/seo.ts), laid out in the app's own style. */
export function SeoPage({ page }: { page: PublicPage }) {
  useSeo({ title: page.title, description: page.description, path: page.path })
  const { to, signedIn } = useStartLink()
  const related = page.related.map((path) => PUBLIC_PAGES.find((p) => p.path === path)).filter((p): p is PublicPage => p !== undefined)
  const cta = signedIn ? 'Continue your quest' : page.cta

  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-4xl px-5">
        <nav aria-label="Breadcrumb" className="pt-2 text-[14px] text-faint">
          <Link to="/" className="font-semibold hover:text-blue">CoQuest</Link> <span aria-hidden="true">/</span> <span className="text-mute">{page.label}</span>
        </nav>

        <section className="grid items-center gap-6 pb-8 pt-6 md:grid-cols-[1fr_auto]">
          <div>
            <h1 className="text-[34px] font-extrabold leading-[1.15] tracking-tight text-ink sm:text-[42px]">{page.h1}</h1>
            <p className="mt-4 text-[18px] leading-relaxed text-body">{page.lead}</p>
            <div className="mt-6"><LinkButton to={to} size="lg">{cta}</LinkButton></div>
          </div>
          <Mascot expression="happy" motion="sway" size={150} className="mx-auto" />
        </section>

        {page.sections.map((section) => (
          <section key={section.heading} className="py-6">
            <h2 className="text-[26px] font-extrabold tracking-tight text-ink">{section.heading}</h2>
            {section.body.map((paragraph) => <p key={paragraph} className="mt-3 text-[17px] leading-relaxed text-body">{paragraph}</p>)}
            {section.bullets && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 rounded-xl border-2 border-line bg-card px-4 py-3 text-[16px] font-semibold text-body">
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />{bullet}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="py-6" aria-labelledby="faq">
          <h2 id="faq" className="text-[26px] font-extrabold tracking-tight text-ink">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {page.faq.map((item) => (
              <details key={item.question} className="group rounded-2xl border-2 border-line bg-card px-5 py-4">
                <summary className="cursor-pointer list-none text-[17px] font-bold text-ink">{item.question}</summary>
                <p className="mt-2 text-[16px] leading-relaxed text-mute">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="my-8 flex flex-col items-center gap-3 rounded-3xl bg-blue px-6 py-9 text-center text-white">
          <h2 className="text-[26px] font-extrabold tracking-tight">Your coding adventure starts here.</h2>
          <Link to={to} className="label inline-flex h-[52px] items-center rounded-2xl border-b-4 border-line bg-white px-8 text-[15px] text-blue">{cta}</Link>
        </section>

        <section className="pb-4" aria-labelledby="more">
          <h2 id="more" className="text-[22px] font-extrabold tracking-tight text-ink">Keep exploring</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {related.map((p) => (
              <li key={p.path}><Link to={p.path} className="block h-full rounded-2xl border-2 border-b-4 border-line bg-card p-4 text-[16px] font-bold text-blue hover:bg-surface">{p.label}</Link></li>
            ))}
          </ul>
        </section>
      </main>
    </PublicShell>
  )
}
