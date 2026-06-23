import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { Spinner } from '@/components/ui/Spinner'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

// La pantalla de inicio y el login se cargan de inmediato (camino crítico).
// El resto de módulos se cargan bajo demanda (code-splitting) para abrir más rápido.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const UniversityPage = lazy(() => import('@/features/university/UniversityPage').then((m) => ({ default: m.UniversityPage })))
const TasksPage = lazy(() => import('@/features/tasks/TasksPage').then((m) => ({ default: m.TasksPage })))
const HabitsPage = lazy(() => import('@/features/habits/HabitsPage').then((m) => ({ default: m.HabitsPage })))
const CrisisPage = lazy(() => import('@/features/crisis/CrisisPage').then((m) => ({ default: m.CrisisPage })))
const MorePage = lazy(() => import('@/features/more/MorePage').then((m) => ({ default: m.MorePage })))
const FocusPage = lazy(() => import('@/features/focus/FocusPage').then((m) => ({ default: m.FocusPage })))
const RewardsPage = lazy(() => import('@/features/rewards/RewardsPage').then((m) => ({ default: m.RewardsPage })))
const FinancePage = lazy(() => import('@/features/finance/FinancePage').then((m) => ({ default: m.FinancePage })))
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const ReviewPage = lazy(() => import('@/features/review/ReviewPage').then((m) => ({ default: m.ReviewPage })))

/** Envuelve una página perezosa con un fallback de carga centrado. */
function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'universidad', element: <Lazy><UniversityPage /></Lazy> },
      { path: 'tareas', element: <Lazy><TasksPage /></Lazy> },
      { path: 'habitos', element: <Lazy><HabitsPage /></Lazy> },
      { path: 'crisis', element: <Lazy><CrisisPage /></Lazy> },
      { path: 'mas', element: <Lazy><MorePage /></Lazy> },
      { path: 'enfoque', element: <Lazy><FocusPage /></Lazy> },
      { path: 'recompensas', element: <Lazy><RewardsPage /></Lazy> },
      { path: 'finanzas', element: <Lazy><FinancePage /></Lazy> },
      { path: 'calendario', element: <Lazy><CalendarPage /></Lazy> },
      { path: 'revision', element: <Lazy><ReviewPage /></Lazy> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
