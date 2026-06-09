import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Spinner } from '@/components/ui/Spinner'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
