import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { UniversityPage } from '@/features/university/UniversityPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { HabitsPage } from '@/features/habits/HabitsPage'
import { CrisisPage } from '@/features/crisis/CrisisPage'
import { MorePage } from '@/features/more/MorePage'
import { FocusPage } from '@/features/focus/FocusPage'
import { RewardsPage } from '@/features/rewards/RewardsPage'
import { FinancePage } from '@/features/finance/FinancePage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { ReviewPage } from '@/features/review/ReviewPage'

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
      { index: true, element: <DashboardPage /> },
      { path: 'universidad', element: <UniversityPage /> },
      { path: 'tareas', element: <TasksPage /> },
      { path: 'habitos', element: <HabitsPage /> },
      { path: 'crisis', element: <CrisisPage /> },
      { path: 'mas', element: <MorePage /> },
      { path: 'enfoque', element: <FocusPage /> },
      { path: 'recompensas', element: <RewardsPage /> },
      { path: 'finanzas', element: <FinancePage /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'revision', element: <ReviewPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
