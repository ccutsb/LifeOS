import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, AlertTriangle, CheckCircle2, Send, Share } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/stores/toast'
import { enablePush } from '@/lib/push'
import {
  notifPermission,
  requestNotifPermission,
  sendTestNotification,
  isStandalone,
  isIOS,
} from '@/lib/notify'
import { useAlerts, type AlertSeverity } from './alerts'

const tone: Record<AlertSeverity, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-info',
}

export function NotificationsSheet({ onClose }: { onClose: () => void }) {
  const alerts = useAlerts()
  const navigate = useNavigate()
  const [perm, setPerm] = useState(notifPermission())
  const [busy, setBusy] = useState(false)

  const standalone = isStandalone()
  const ios = isIOS()
  const needsInstall = ios && !standalone

  const go = (to: string) => {
    navigate(to)
    onClose()
  }

  // Activa las notificaciones: pide permiso (avisos locales del día) y, si hay
  // VAPID configurado, registra el push real para que lleguen con la app cerrada.
  const enable = async () => {
    setBusy(true)
    try {
      const p = await requestNotifPermission()
      setPerm(p)
      if (p === 'unsupported') {
        toast.error('Tu navegador no soporta notificaciones')
        return
      }
      if (p !== 'granted') {
        toast.error('Permiso de notificaciones denegado')
        return
      }
      // Avisos locales ya quedan activos. Intentamos también el push real.
      const res = await enablePush()
      if (res.ok) toast.success(res.message)
      else toast.success('Avisos activados en este dispositivo')
      // Confirmación inmediata para que el usuario la vea funcionar.
      await sendTestNotification()
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    if (perm !== 'granted') {
      toast.error('Primero activa las notificaciones')
      return
    }
    const ok = await sendTestNotification()
    if (ok) toast.success('Notificación enviada 🔔')
    else toast.error('No se pudo mostrar la notificación')
  }

  return (
    <Sheet open onClose={onClose} title="Avisos">
      {/* Estado de las notificaciones del sistema */}
      <div className="mb-4 rounded-2xl border border-border bg-surface-2 p-3">
        {perm === 'granted' ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" /> Notificaciones activadas
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <BellRing className="h-5 w-5 shrink-0" />
            {perm === 'denied' ? 'Notificaciones bloqueadas' : 'Notificaciones desactivadas'}
          </p>
        )}

        {needsInstall ? (
          <p className="mt-2 flex items-start gap-2 text-xs text-warning">
            <Share className="mt-0.5 h-4 w-4 shrink-0" />
            En iPhone, primero instala la app: toca <span className="font-semibold">Compartir</span> →{' '}
            <span className="font-semibold">Añadir a inicio</span>, y ábrela desde el ícono.
          </p>
        ) : perm === 'denied' ? (
          <p className="mt-2 text-xs text-muted">
            Las bloqueaste antes. Actívalas desde Ajustes del teléfono → LifeOS → Notificaciones.
          </p>
        ) : null}

        <div className="mt-3 flex gap-2">
          {perm !== 'granted' && (
            <Button fullWidth onClick={enable} disabled={busy || needsInstall || perm === 'denied'}>
              <Bell className="h-4 w-4" /> {busy ? 'Activando…' : 'Activar'}
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={test} disabled={perm !== 'granted'}>
            <Send className="h-4 w-4" /> Probar
          </Button>
        </div>
      </div>

      {/* Bandeja de avisos in-app */}
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

      <p className="mt-4 text-center text-xs text-muted">
        Los avisos del día llegan estando la app abierta. Para recibirlos con la app cerrada en iPhone (iOS 16.4+),
        instala la PWA y configura el push real (ver docs/DEPLOYMENT.md).
      </p>
    </Sheet>
  )
}
