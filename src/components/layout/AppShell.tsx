import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
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
