import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Mascot } from './components/Mascot'
import { isAppPath, pageByPath } from './content/seo'
import { applySeo } from './lib/useSeo'
import { useDailyReminder } from './lib/useDailyReminder'
import { Auth } from './pages/Auth'
import { Landing } from './pages/public/Landing'
import { NotFound, NotFoundBody } from './pages/public/NotFound'
import { SeoPage } from './pages/public/SeoPage'
import { useApp } from './state/AppContext'

/** Each page's code is loaded only when it is first visited, so the public pages stay light and fast. */
const Layout = lazy(() => import('./components/Layout').then((m) => ({ default: m.Layout })))
const BossBattle = lazy(() => import('./pages/BossBattle').then((m) => ({ default: m.BossBattle })))
const Bosses = lazy(() => import('./pages/Bosses').then((m) => ({ default: m.Bosses })))
const Daily = lazy(() => import('./pages/Daily').then((m) => ({ default: m.Daily })))
const Duels = lazy(() => import('./pages/Duels').then((m) => ({ default: m.Duels })))
const Glossary = lazy(() => import('./pages/Glossary').then((m) => ({ default: m.Glossary })))
const Leaderboard = lazy(() => import('./pages/Leaderboard').then((m) => ({ default: m.Leaderboard })))
const Learn = lazy(() => import('./pages/Learn').then((m) => ({ default: m.Learn })))
const LessonPage = lazy(() => import('./pages/Lesson').then((m) => ({ default: m.LessonPage })))
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })))
const Playground = lazy(() => import('./pages/Playground').then((m) => ({ default: m.Playground })))
const Practice = lazy(() => import('./pages/Practice').then((m) => ({ default: m.Practice })))
const PuzzlePage = lazy(() => import('./pages/Puzzle').then((m) => ({ default: m.PuzzlePage })))
const Rewards = lazy(() => import('./pages/Rewards').then((m) => ({ default: m.Rewards })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Quests = lazy(() => import('./pages/Quests').then((m) => ({ default: m.Quests })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })))
const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })))

function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <Mascot expression="curious" size={110} float />
      <p className="label text-[13px] text-faint">Loading…</p>
    </div>
  )
}

/** Everything behind the sign-in is private, so it is kept out of search results. */
function usePrivateSeo(active: boolean, path: string): void {
  useEffect(() => {
    if (active) applySeo({ title: 'CoQuest', description: 'Your CoQuest learning space.', path, noindex: true })
  }, [active, path])
}

export default function App() {
  const { status, state } = useApp()
  const { pathname } = useLocation()
  useDailyReminder()
  const publicPage = pageByPath(pathname)
  usePrivateSeo(isAppPath(pathname) && status !== 'loading', pathname)

  // Public landing pages are open to everyone, signed in or not.
  if (publicPage) return <SeoPage page={publicPage} />
  if (status === 'loading') return <Loading />
  if (status === 'signedOut') {
    if (pathname === '/') return <Landing />
    return isAppPath(pathname) ? <Auth /> : <NotFound />
  }
  // New players meet QUEST first; everyone who already has progress skips this.
  if (!state.onboarded) return <Suspense fallback={<Loading />}><Onboarding /></Suspense>

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Focused, full-screen flows */}
        {/* Signed-in players who land on the log-in page (just logged in) go to their path */}
        <Route path="/login" element={<Navigate to="/learn" replace />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/boss/:bossId" element={<BossBattle />} />

        {/* Content column with the right-hand rail, as in the kit's web layout */}
        <Route element={<Layout rail />}>
          <Route index element={<Learn />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:courseId" element={<Learn />} />
          <Route path="/learn/:courseId/glossary" element={<Glossary />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bosses" element={<Bosses />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Tools that need the full width */}
        <Route element={<Layout />}>
          <Route path="/playground" element={<Playground />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/puzzle" element={<PuzzlePage />} />
          <Route path="/duels" element={<Duels />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<NotFoundBody />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
