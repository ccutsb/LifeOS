import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Spinner } from '@/components/ui/Spinner'
import { QuickCaptureSheet } from '@/features/capture/QuickCaptureSheet'

export function AppShell() {
  const [capturing, setCapturing] = useState(false)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-4 pt-safe">
        <div className="pb-32 pt-5">
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
      <BottomNav onCapture={() => setCapturing(true)} />
      {capturing && <QuickCaptureSheet onClose={() => setCapturing(false)} />}
    </div>
  )
}
