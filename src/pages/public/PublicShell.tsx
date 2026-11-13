import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PUBLIC_PAGES, SITE } from '../../content/seo'
import { useApp } from '../../state/AppContext'

/** Where the main call to action sends a visitor: into the app if they are signed in, otherwise to sign-up. */
export const useStartLink = (): { to: string; signedIn: boolean } => {
  const { status } = useApp()
  const signedIn = status === 'ready'
  return { to: signedIn ? '/learn' : '/login?signup=1', signedIn }
}

/** The logo mark (not the text wordmark) next to the plain brand name. */
function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <img src="/favicon.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px]" />
      <span className="text-[20px] font-extrabold tracking-tight text-ink">{SITE.name}</span>
    </Link>
  )
}

/** Header, footer and page width shared by the home page and every public landing page. */
export function PublicShell({ children }: { children: ReactNode }) {
  const { to, signedIn } = useStartLink()
  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Brand />
        <nav className="flex items-center gap-2" aria-label="Account">
          <Link to="/learn-coding-online" className="label hidden px-3 py-2 text-[13px] text-mute hover:text-body sm:block">Courses</Link>
          <Link to={signedIn ? '/learn' : '/login'} className="label rounded-xl border-2 border-b-4 border-line px-4 py-2 text-[13px] text-blue hover:bg-surface">{signedIn ? 'Continue' : 'Log in'}</Link>
          {!signedIn && <Link to={to} className="label hidden rounded-xl border-b-4 border-blue-dark bg-blue px-4 py-2.5 text-[13px] text-white sm:block">Sign up</Link>}
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-16 border-t-2 border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-[15px] text-mute">{SITE.subTagline}</p>
          </div>
          <nav aria-label="Guides">
            <p className="label mb-3 text-[13px] text-faint">Learn with CoQuest</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PUBLIC_PAGES.map((p) => (
                <li key={p.path}><Link to={p.path} className="text-[15px] font-semibold text-body hover:text-blue">{p.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}
