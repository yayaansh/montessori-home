import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell, Loading } from './Shell'
import Home from '../features/home/Home'

const Dashboard = lazy(() => import('../features/guide/Dashboard'))
const AlbumPage = lazy(() => import('../features/guide/AlbumPage'))
const LessonPage = lazy(() => import('../features/guide/LessonPage'))
const Planner = lazy(() => import('../features/guide/Planner'))
const PrintablesPage = lazy(() => import('../features/guide/PrintablesPage'))
const SearchPage = lazy(() => import('../features/guide/SearchPage'))
const SettingsPage = lazy(() => import('../features/guide/SettingsPage'))

const LearnHome = lazy(() => import('../features/learn/LearnHome'))
const Shelf = lazy(() => import('../features/learn/Shelf'))
const MaterialPage = lazy(() => import('../features/learn/MaterialPage'))
const Words = lazy(() => import('../features/learn/Words'))
const Problems = lazy(() => import('../features/learn/Problems'))
const ProblemSet = lazy(() => import('../features/learn/ProblemSet'))
const Experiments = lazy(() => import('../features/learn/Experiments'))
const WorkLog = lazy(() => import('../features/learn/WorkLog'))
const Pathways = lazy(() => import('../features/learn/Pathways'))
const PathwayPage = lazy(() => import('../features/learn/PathwayPage'))
const ChildLesson = lazy(() => import('../features/learn/ChildLesson'))

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guide" element={<Shell mode="guide" />}>
            <Route index element={<Dashboard />} />
            <Route path="album/:albumId" element={<AlbumPage />} />
            <Route path="lesson/:nodeId" element={<LessonPage />} />
            <Route path="plan" element={<Planner />} />
            <Route path="printables" element={<PrintablesPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/learn" element={<Shell mode="learn" />}>
            <Route index element={<LearnHome />} />
            <Route path="path" element={<Pathways />} />
            <Route path="path/:album" element={<PathwayPage />} />
            <Route path="lesson/:nodeId" element={<ChildLesson />} />
            <Route path="materials" element={<Shelf />} />
            <Route path="materials/:materialId" element={<MaterialPage />} />
            <Route path="words" element={<Words />} />
            <Route path="problems" element={<Problems />} />
            <Route path="problems/:setId" element={<ProblemSet />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="work" element={<WorkLog />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
