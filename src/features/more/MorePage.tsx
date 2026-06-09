import { Link } from 'react-router-dom'
import { Timer, Gift, Wallet, Calendar, ClipboardCheck, LifeBuoy, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'

const tiles = [
  { to: '/enfoque', label: 'Enfoque', hint: 'Pomodoro', icon: Timer, color: '#6366f1' },
  { to: '/recompensas', label: 'Recompensas', hint: 'Tus puntos', icon: Gift, color: '#f59e0b' },
  { to: '/finanzas', label: 'Finanzas', hint: 'Plata y ahorro', icon: Wallet, color: '#22c55e' },
  { to: '/calendario', label: 'Calendario', hint: 'Día / semana / mes', icon: Calendar, color: '#06b6d4' },
  { to: '/revision', label: 'Revisión', hint: 'Resumen semanal', icon: ClipboardCheck, color: '#a855f7' },
  { to: '/crisis', label: 'Modo Crisis', hint: 'Tareas vencidas', icon: LifeBuoy, color: '#ef4444' },
]

export function MorePage() {
  const { signOut } = useAuth()
  return (
    <div className="animate-fade-in">
      <PageHeader title="Más" subtitle="Herramientas y vistas" />
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
