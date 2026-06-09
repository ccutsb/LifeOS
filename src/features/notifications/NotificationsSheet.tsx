import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/stores/toast'
import { enablePush } from '@/lib/push'
import { useAlerts, type AlertSeverity } from './alerts'

const tone: Record<AlertSeverity, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-info',
}

export function NotificationsSheet({ onClose }: { onClose: () => void }) {
  const alerts = useAlerts()
  const navigate = useNavigate()

  const go = (to: string) => {
    navigate(to)
    onClose()
  }

  const enableSystem = async () => {
    const res = await enablePush()
    if (res.ok) {
      toast.success(res.message)
      return
    }
    // Si aún no configuras VAPID, al menos activamos avisos locales
    if (res.message.includes('VAPID') && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        toast.success('Avisos locales activados')
        return
      }
    }
    toast.error(res.message)
  }

  return (
    <Sheet open onClose={onClose} title="Avisos">
      {alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="Sin avisos"
          hint="Cuando tengas entregas, evaluaciones o clases cerca, aparecerán aquí automáticamente."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => go(a.to)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left active:bg-surface-2"
              >
                <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${tone[a.severity]}`} />
                <div className="min-w-0">
                  <p className="font-medium">{a.title}</p>
                  {a.body && <p className="text-xs text-muted">{a.body}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" fullWidth onClick={enableSystem} className="mt-4">
        <Bell className="h-4 w-4" /> Activar avisos del sistema
      </Button>
      <p className="mt-2 text-center text-xs text-muted">
        En iPhone, los avisos con la app cerrada requieren instalar la PWA (iOS 16.4+). Las notificaciones push
        programadas llegan en la Fase 4.
      </p>
    </Sheet>
  )
}
