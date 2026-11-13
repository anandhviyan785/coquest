import { Link } from 'react-router-dom'
import { Mascot } from '../../components/Mascot'
import { LinkButton } from '../../components/ui'
import { PUBLIC_PAGES } from '../../content/seo'
import { useSeo } from '../../lib/useSeo'
import { PublicShell } from './PublicShell'

/** The message itself. Used inside the app's layout when a signed-in player opens a bad address. */
export function NotFoundBody({ home = '/' }: { home?: string }) {
  useSeo({ title: 'Page not found | CoQuest', description: 'This page does not exist.', path: '/404', noindex: true })
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-16 text-center">
      <Mascot expression="thinking" motion="tilt" size={150} />
      <p className="label mt-6 text-[13px] text-faint">Error 404</p>
      <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-ink">This quest path does not exist</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-mute">QUEST looked everywhere, but the page you wanted is not here. It may have moved, or the address may have a typo.</p>
      <div className="mt-6"><LinkButton to={home} size="lg">Back to the start</LinkButton></div>
      <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[15px]">
        {PUBLIC_PAGES.slice(0, 4).map((p) => <li key={p.path}><Link to={p.path} className="font-bold text-blue hover:underline">{p.label}</Link></li>)}
      </ul>
    </main>
  )
}

/** A full 404 page for visitors who are not signed in. */
export function NotFound() {
  return <PublicShell><NotFoundBody /></PublicShell>
}
