import { useState } from 'react'
import { GraduationCap, CheckSquare, Flame, Wallet, Target, Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { useProfile } from '@/hooks/useProfile'
import { requestNotifPermission, sendTestNotification, notifPermission } from '@/lib/notify'
import { enablePush } from '@/lib/push'
import { useCompleteOnboarding } from './hooks'

const PILLARS = [
  { icon: GraduationCap, label: 'Universidad', hint: 'Notas y horario', color: '#6366f1' },
  { icon: CheckSquare, label: 'Tareas', hint: 'Captura y prioriza', color: '#06b6d4' },
  { icon: Flame, label: 'Hábitos', hint: 'Rachas diarias', color: '#22c55e' },
  { icon: Wallet, label: 'Finanzas', hint: 'Plata y ahorro', color: '#f59e0b' },
  { icon: Target, label: 'Objetivos', hint: 'Tu norte', color: '#a855f7' },
  { icon: Bell, label: 'Avisos', hint: 'No se te pasa nada', color: '#ec4899' },
]

/**
 * Onboarding de primer uso (regla de oro: cero curva de aprendizaje).
 * Una sola pantalla: muestra los pilares, ofrece activar avisos y entra a la app.
 * Se muestra solo mientras profile.onboarding_done sea false.
 */
export function OnboardingOverlay() {
  const { data: profile } = useProfile()
  const complete = useCompleteOnboarding()
  const [hidden, setHidden] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [notifReady, setNotifReady] = useState(notifPermission() === 'granted')

  if (hidden || !profile || profile.onboarding_done) return null

  const name = profile.display_name?.split(' ')[0]

  const enableNotifs = async () => {
    setEnabling(true)
    try {
      const p = await requestNotifPermission()
      if (p === 'granted') {
        await enablePush()
        await sendTestNotification()
        setNotifReady(true)
        toast.success('Avisos activados 🔔')
      } else if (p === 'denied') {
        toast.error('Permiso denegado. Puedes activarlo luego desde la campana.')
      }
    } finally {
      setEnabling(false)
    }
  }

  const start = () => {
    setHidden(true)
    complete.mutate()
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-safe pb-safe">
        <div className="flex flex-1 flex-col justify-center gap-7 py-10">
          <div>
            <p className="text-sm text-muted">Bienvenido{name ? `, ${name}` : ''} 👋</p>
            <h1 className="mt-1 text-3xl font-bold">Tu vida, en orden.</h1>
            <p className="mt-2 text-muted">
              LifeOS ya viene armado: sin configurar nada, empieza a usarlo. Esto es lo que tienes a un toque:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map((p) => (
              <div key={p.label} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${p.color}22` }}>
                  <p.icon className="h-5 w-5" style={{ color: p.color }} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.label}</p>
                  <p className="truncate text-xs text-muted">{p.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-6">
          {!notifReady && (
            <Button variant="secondary" fullWidth onClick={enableNotifs} disabled={enabling}>
              <Bell className="h-4 w-4" /> {enabling ? 'Activando…' : 'Activar avisos (recomendado)'}
            </Button>
          )}
          <Button fullWidth onClick={start}>
            Comenzar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
