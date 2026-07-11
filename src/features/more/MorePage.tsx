import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  Timer,
  Gift,
  Wallet,
  Calendar,
  ClipboardCheck,
  LifeBuoy,
  LogOut,
  Flame,
  ListChecks,
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useAreas, useUpdateArea } from '@/features/areas/hooks'
import { useUpdate } from '@/lib/crud'
import { qk } from '@/lib/queryKeys'
import { useTheme, type ThemeChoice } from '@/lib/theme'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { exportBackup, importBackup } from '@/features/backup/backup'
import type { Profile } from '@/types/database'

const tiles = [
  { to: '/enfoque', label: 'Enfoque', hint: 'Pomodoro', icon: Timer, color: '#6366f1' },
  { to: '/rutinas', label: 'Rutinas', hint: 'Mañana / noche', icon: ListChecks, color: '#06b6d4' },
  { to: '/habitos', label: 'Hábitos', hint: 'Rachas diarias', icon: Flame, color: '#f97316' },
  { to: '/recompensas', label: 'Recompensas', hint: 'Tus puntos', icon: Gift, color: '#f59e0b' },
  { to: '/finanzas', label: 'Finanzas', hint: 'Plata y ahorro', icon: Wallet, color: '#22c55e' },
  { to: '/calendario', label: 'Calendario', hint: 'Día / semana / mes', icon: Calendar, color: '#0ea5e9' },
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
  const { data: profile } = useProfile()
  const { data: areas = [] } = useAreas()
  const updateProfile = useUpdate<Profile>('profiles', [qk.profile])
  const updateArea = useUpdateArea()
  const { choice, setChoice } = useTheme()

  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)

  const vacaciones = profile?.life_mode === 'vacaciones'
  const universityArea = areas.find((a) => a.kind === 'university')

  const toggleMode = async () => {
    if (!profile) return
    const next = vacaciones ? 'semestre' : 'vacaciones'
    try {
      await updateProfile.mutateAsync({ id: profile.id, values: { life_mode: next } })
      // El modo pausa/reactiva el área Universidad automáticamente
      if (universityArea) {
        await updateArea.mutateAsync({
          id: universityArea.id,
          values: { is_active: next === 'semestre' },
        })
      }
      toast.success(
        next === 'vacaciones'
          ? 'Modo vacaciones 🌴 Universidad en pausa'
          : 'Modo semestre 🎓 Universidad activa',
      )
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const onExport = async () => {
    setBusy('export')
    try {
      await exportBackup()
      toast.success('Respaldo descargado')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    if (!confirm('¿Restaurar este respaldo? Las filas con el mismo id se sobreescriben.')) return
    setBusy('import')
    try {
      const { restored, warnings } = await importBackup(file)
      toast.success(`Respaldo restaurado (${restored} registros)`)
      warnings.forEach((w) => toast.error(w))
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Más" subtitle="Herramientas y ajustes" />

      {/* Modo de vida */}
      <button
        onClick={toggleMode}
        disabled={!profile || updateProfile.isPending}
        className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left active:bg-surface-2"
      >
        <div>
          <p className="font-semibold">{vacaciones ? '🌴 Modo vacaciones' : '🎓 Modo semestre'}</p>
          <p className="mt-0.5 text-xs text-muted">
            {vacaciones
              ? 'Universidad en pausa: tu plan gira en torno al resto de tu vida.'
              : 'Universidad activa: clases y evaluaciones pesan en tu plan.'}
          </p>
        </div>
        <span className={clsx('relative h-7 w-12 shrink-0 rounded-full transition', vacaciones ? 'bg-warning' : 'bg-brand')}>
          <span
            className={clsx(
              'absolute top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] transition-all',
              vacaciones ? 'left-6' : 'left-1',
            )}
          >
            {vacaciones ? '🌴' : '🎓'}
          </span>
        </span>
      </button>

      {/* Apariencia */}
      <section className="mb-4">
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

      {/* Respaldo */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <p className="font-semibold">Respaldo</p>
        <p className="mt-0.5 text-xs text-muted">Todos tus datos en un archivo JSON.</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onExport}
            disabled={busy !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-2 py-2.5 text-sm font-medium active:bg-border disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {busy === 'export' ? 'Exportando…' : 'Exportar'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-2 py-2.5 text-sm font-medium active:bg-border disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {busy === 'import' ? 'Restaurando…' : 'Importar'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />
        </div>
      </div>

      <button
        onClick={signOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted active:bg-surface"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </div>
  )
}
