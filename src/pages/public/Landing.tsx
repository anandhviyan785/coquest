import { Link } from 'react-router-dom'
import { BoltIcon, ChestIcon, DuelIcon, FlameIcon, GemIcon } from '../../components/icons'
import { LangLogo } from '../../components/LangLogo'
import { Mascot } from '../../components/Mascot'
import { LinkButton } from '../../components/ui'
import { HOME, HOME_DESCRIPTION, HOME_TITLE, PUBLIC_PAGES, SITE } from '../../content/seo'
import { useSeo } from '../../lib/useSeo'
import { PublicShell, useStartLink } from './PublicShell'

const COURSES = [
  { lang: 'python', name: 'Python', path: '/learn-python-for-beginners', text: 'Readable, friendly and powerful. The best-loved first language.' },
  { lang: 'javascript', name: 'JavaScript', path: '/learn-javascript-for-beginners', text: 'Make the web interactive, from variables to classes.' },
  { lang: 'html', name: 'HTML and CSS', path: '/learn-html-and-css', text: 'Build and style real pages in a live editor.' },
] as const

const STEPS = [
  { title: 'Pick a language', text: 'Start with Python, JavaScript, HTML and CSS, SQL, Java or C++.' },
  { title: 'Learn in tiny steps', text: 'Read a short explanation, answer a few questions, then write real code.' },
  { title: 'Level up', text: 'Earn XP, keep your streak, beat boss battles and collect achievements.' },
] as const

function HeroArt() {
  return (
    <div className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center sm:h-[380px] sm:w-[380px]" aria-hidden="true">
      <span className="absolute inset-4 rounded-full bg-blue-soft" />
      <Mascot expression="happy" motion="wave" size={250} className="relative" />
      <span className="animate-bob absolute left-0 top-10 flex items-center gap-1.5 rounded-2xl border-2 border-b-4 border-line bg-card px-3 py-2 text-[15px] font-bold text-flame"><FlameIcon size={22} />7 day streak</span>
      <span className="animate-bob absolute right-0 top-24 flex items-center gap-1.5 rounded-2xl border-2 border-b-4 border-line bg-card px-3 py-2 text-[15px] font-bold text-gold-dark [animation-delay:0.8s]"><BoltIcon size={22} />+10 XP</span>
      <span className="animate-bob absolute bottom-8 left-6 flex items-center gap-1.5 rounded-2xl border-2 border-b-4 border-line bg-card px-3 py-2 text-[15px] font-bold text-blue [animation-delay:1.6s]"><GemIcon size={22} />Level up!</span>
    </div>
  )
}

/** The public home page, shown to visitors who are not signed in. */
export function Landing() {
  useSeo({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: '/' })
  const { to, signedIn } = useStartLink()

  return (
    <PublicShell>
      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pb-6 pt-6 lg:grid-cols-2 lg:pt-12">
          <div className="text-center lg:text-left">
            <p className="label mb-4 inline-block rounded-full bg-blue-soft px-4 py-1.5 text-[13px] text-blue">{SITE.subTagline}</p>
            <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[52px]">{HOME.h1}</h1>
            <p className="mx-auto mt-5 max-w-xl text-[18px] leading-relaxed text-body lg:mx-0">{HOME.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <LinkButton to={to} size="lg">{signedIn ? 'Continue your quest' : HOME.primaryCta}</LinkButton>
              <a href="#courses" className="label inline-flex h-[52px] items-center justify-center rounded-2xl border-2 border-b-4 border-line px-6 text-[15px] text-blue hover:bg-surface">{HOME.secondaryCta}</a>
            </div>
          </div>
          <HeroArt />
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-12" aria-labelledby="why">
          <h2 id="why" className="text-center text-[30px] font-extrabold tracking-tight text-ink">Coding that feels like play</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {HOME.points.map((p, i) => (
              <li key={p.title} className="rounded-2xl border-2 border-b-4 border-line bg-card p-6">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft">{[<ChestIcon key="c" size={32} />, <BoltIcon key="b" size={32} />, <DuelIcon key="d" size={32} />][i]}</span>
                <h3 className="text-[19px] font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-mute">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="courses" className="mx-auto w-full max-w-6xl scroll-mt-6 px-5 py-12" aria-labelledby="courses-heading">
          <h2 id="courses-heading" className="text-center text-[30px] font-extrabold tracking-tight text-ink">Start with a course</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-[17px] text-mute">Short lessons, real code and a clear path from your first line to your first boss battle.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {COURSES.map((c) => (
              <li key={c.path}>
                <Link to={c.path} className="flex h-full flex-col rounded-2xl border-2 border-b-4 border-line bg-card p-6 transition-colors hover:bg-surface active:translate-y-0.5 active:border-b-2">
                  <LangLogo lang={c.lang} size={48} />
                  <h3 className="mt-4 text-[20px] font-bold text-ink">{c.name}</h3>
                  <p className="mt-1 flex-1 text-[16px] text-mute">{c.text}</p>
                  <span className="label mt-4 text-[13px] text-blue">Explore the course</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-12" aria-labelledby="how">
          <h2 id="how" className="text-center text-[30px] font-extrabold tracking-tight text-ink">How CoQuest works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-surface p-6">
                <span className="label flex h-9 w-9 items-center justify-center rounded-full bg-blue text-[15px] text-white">{i + 1}</span>
                <h3 className="mt-3 text-[19px] font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-[16px] text-mute">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-blue px-6 py-10 text-center text-white">
            <Mascot expression="excited" motion="jump" size={110} />
            <h2 className="text-[30px] font-extrabold tracking-tight">Ready for your first quest?</h2>
            <p className="max-w-md text-[17px] text-white/90">Create a free account and write your first line of code in a couple of minutes.</p>
            <Link to={to} className="label inline-flex h-[52px] items-center rounded-2xl border-b-4 border-line bg-white px-8 text-[15px] text-blue">{signedIn ? 'Continue your quest' : HOME.primaryCta}</Link>
          </div>
          <p className="mt-6 text-center text-[15px] text-mute">
            New to programming? Read <Link to={PUBLIC_PAGES[3].path} className="font-bold text-blue">how to learn coding online</Link> or see
            {' '}<Link to={PUBLIC_PAGES[4].path} className="font-bold text-blue">coding lessons for beginners</Link>.
          </p>
        </section>
      </main>
    </PublicShell>
  )
}
