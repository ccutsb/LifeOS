import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Timer, Gift, Wallet, Calendar, ClipboardCheck, LifeBuoy, LogOut, Target, Sun, Moon, Monitor } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme, type ThemeChoice } from '@/lib/theme'

const tiles = [
  { to: '/objetivos', label: 'Objetivos', hint: 'Tu norte', icon: Target, color: '#6366f1' },
  { to: '/enfoque', label: 'Enfoque', hint: 'Pomodoro', icon: Timer, color: '#6366f1' },
  { to: '/recompensas', label: 'Recompensas', hint: 'Tus puntos', icon: Gift, color: '#f59e0b' },
  { to: '/finanzas', label: 'Finanzas', hint: 'Plata y ahorro', icon: Wallet, color: '#22c55e' },
  { to: '/calendario', label: 'Calendario', hint: 'Día / semana / mes', icon: Calendar, color: '#06b6d4' },
  { to: '/revision', label: 'Revisión', hint: 'Resumen semanal', icon: ClipboardCheck, color: '#a855f7' },
  { to: '/crisis', label: 'Modo Crisis', hint: 'Tareas vencidas', icon: LifeBuoy, color: '#ef4444' },
]

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function MorePage() {
  const { signOut } = useAuth()
  const { choice, setChoice } = useTheme()
  return (
    <div className="animate-fade-in">
      <PageHeader title="Más" subtitle="Herramientas y vistas" />

      {/* Apariencia */}
      <section className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-muted">Apariencia</h3>
        <div className="flex gap-1 rounded-xl bg-surface p-1">
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setChoice(o.value)}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition',
                choice === o.value ? 'bg-brand text-white' : 'text-muted active:bg-surface-2',
              )}
            >
              <o.icon className="h-4 w-4" />
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 active:bg-surface-2"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: `${t.color}22` }}>
              <t.icon className="h-6 w-6" style={{ color: t.color }} />
            </span>
            <div>
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-muted">{t.hint}</p>
            </div>
          </Link>
        ))}
      </div>
      <button
        onClick={signOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted active:bg-surface"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </div>
  )
}
