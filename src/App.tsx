import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Mascot } from './components/Mascot'
import { Auth } from './pages/Auth'
import { BossBattle } from './pages/BossBattle'
import { Bosses } from './pages/Bosses'
import { Daily } from './pages/Daily'
import { Dashboard } from './pages/Dashboard'
import { Duels } from './pages/Duels'
import { Leaderboard } from './pages/Leaderboard'
import { Learn } from './pages/Learn'
import { LessonPage } from './pages/Lesson'
import { Playground } from './pages/Playground'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { Stats } from './pages/Stats'
import { Tutor } from './pages/Tutor'
import { useApp } from './state/AppContext'

export default function App() {
  const { status } = useApp()

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Mascot expression="curious" size={96} float />
        <p className="text-sm text-mute">Loading your quest…</p>
      </div>
    )
  }
  if (status === 'signedOut') return <Auth />

  return (
    <Routes>
      {/* Focused, full-screen flows */}
      <Route path="/lesson/:lessonId" element={<LessonPage />} />
      <Route path="/boss/:bossId" element={<BossBattle />} />

      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:courseId" element={<Learn />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/bosses" element={<Bosses />} />
        <Route path="/duels" element={<Duels />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
