import type { ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from '@/lib/queryClient'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { Toaster } from '@/components/feedback/Toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </PersistQueryClientProvider>
  )
}
