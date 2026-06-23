import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useLocalReminders } from '@/features/notifications/useLocalReminders'

export function AppShell() {
  // Dispara avisos locales en el dispositivo para entregas/evaluaciones del día.
  useLocalReminders()
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-4 pt-safe">
        <div className="pb-32 pt-5">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
