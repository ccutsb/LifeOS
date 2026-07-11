import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
// Núcleo (eager): lo que se usa a diario apenas abre la app
import { TodayPage } from '@/features/today/TodayPage'
import { NowPage } from '@/features/now/NowPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { AreasPage } from '@/features/areas/AreasPage'
import { AreaDetailPage } from '@/features/areas/AreaDetailPage'

// Secundario (lazy): se descarga solo al entrar — reduce el bundle inicial
const lazyPage = <T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[name] })))

const UniversityPage = lazyPage(() => import('@/features/university/UniversityPage'), 'UniversityPage')
const HabitsPage = lazyPage(() => import('@/features/habits/HabitsPage'), 'HabitsPage')
const CrisisPage = lazyPage(() => import('@/features/crisis/CrisisPage'), 'CrisisPage')
const MorePage = lazyPage(() => import('@/features/more/MorePage'), 'MorePage')
const FocusPage = lazyPage(() => import('@/features/focus/FocusPage'), 'FocusPage')
const RewardsPage = lazyPage(() => import('@/features/rewards/RewardsPage'), 'RewardsPage')
const FinancePage = lazyPage(() => import('@/features/finance/FinancePage'), 'FinancePage')
const CalendarPage = lazyPage(() => import('@/features/calendar/CalendarPage'), 'CalendarPage')
const ReviewPage = lazyPage(() => import('@/features/review/ReviewPage'), 'ReviewPage')
const RoutinesPage = lazyPage(() => import('@/features/routines/RoutinesPage'), 'RoutinesPage')

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'ahora', element: <NowPage /> },
      { path: 'areas', element: <AreasPage /> },
      { path: 'areas/:id', element: <AreaDetailPage /> },
      { path: 'universidad', element: <UniversityPage /> },
      { path: 'tareas', element: <TasksPage /> },
      { path: 'habitos', element: <HabitsPage /> },
      { path: 'rutinas', element: <RoutinesPage /> },
      { path: 'crisis', element: <CrisisPage /> },
      { path: 'mas', element: <MorePage /> },
      { path: 'enfoque', element: <FocusPage /> },
      { path: 'recompensas', element: <RewardsPage /> },
      { path: 'finanzas', element: <FinancePage /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'revision', element: <ReviewPage /> },
      // Ruta antigua de "objetivos de vida": ahora viven dentro de cada área
      { path: 'objetivos', element: <Navigate to="/areas" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
