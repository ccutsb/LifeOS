import { RouterProvider } from 'react-router-dom'
import { env } from '@/lib/env'
import { Providers } from './providers'
import { router } from './router'

export function App() {
  if (!env.isConfigured) return <SetupNotice />
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}

/** Pantalla amable mientras no haya .env configurado. */
function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pt-safe pb-safe">
      <div>
        <h1 className="text-3xl font-bold">LifeOS</h1>
        <p className="mt-1 text-muted">Falta conectar tu base de datos para empezar.</p>
      </div>
      <ol className="space-y-3 text-sm">
        <li className="rounded-xl border border-border bg-surface p-4">
          <span className="font-semibold text-brand">1.</span> Crea un proyecto gratis en{' '}
          <span className="font-mono">supabase.com</span> y corre{' '}
          <span className="font-mono text-text">supabase/schema.sql</span> en el SQL Editor.
        </li>
        <li className="rounded-xl border border-border bg-surface p-4">
          <span className="font-semibold text-brand">2.</span> Copia{' '}
          <span className="font-mono">.env.example</span> a{' '}
          <span className="font-mono">.env</span> y pega tu{' '}
          <span className="font-mono">VITE_SUPABASE_URL</span> y{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>.
        </li>
        <li className="rounded-xl border border-border bg-surface p-4">
          <span className="font-semibold text-brand">3.</span> Reinicia{' '}
          <span className="font-mono">npm run dev</span>.
        </li>
      </ol>
      <p className="text-xs text-muted">
        Guía completa en <span className="font-mono">docs/DEPLOYMENT.md</span>.
      </p>
    </div>
  )
}
