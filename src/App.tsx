import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Mascot } from './components/Mascot'
import { Auth } from './pages/Auth'
import { BossBattle } from './pages/BossBattle'
import { Bosses } from './pages/Bosses'
import { Daily } from './pages/Daily'
import { Duels } from './pages/Duels'
import { Glossary } from './pages/Glossary'
import { Leaderboard } from './pages/Leaderboard'
import { Learn } from './pages/Learn'
import { LessonPage } from './pages/Lesson'
import { Playground } from './pages/Playground'
import { Profile } from './pages/Profile'
import { Quests } from './pages/Quests'
import { Settings } from './pages/Settings'
import { Shop } from './pages/Shop'
import { Stats } from './pages/Stats'
import { Tutor } from './pages/Tutor'
import { useApp } from './state/AppContext'

export default function App() {
  const { status } = useApp()

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Mascot expression="curious" size={110} float />
        <p className="label text-[13px] text-faint">Loading…</p>
      </div>
    )
  }
  if (status === 'signedOut') return <Auth />

  return (
    <Routes>
      {/* Focused, full-screen flows */}
      <Route path="/lesson/:lessonId" element={<LessonPage />} />
      <Route path="/boss/:bossId" element={<BossBattle />} />

      {/* Content column with the right-hand rail, as in the kit's web layout */}
      <Route element={<Layout rail />}>
        <Route index element={<Learn />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:courseId" element={<Learn />} />
        <Route path="/learn/:courseId/glossary" element={<Glossary />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
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
        <Route path="/duels" element={<Duels />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
