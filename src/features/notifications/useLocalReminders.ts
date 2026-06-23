import { useEffect, useRef } from 'react'
import { dateKey } from '@/lib/dates'
import { notifPermission, showLocalNotification } from '@/lib/notify'
import { useAlerts, type Alert } from './alerts'

const STORE_KEY = 'lifeos:notified'

/** Lee el registro de avisos ya notificados (mapa alertId -> fecha 'YYYY-MM-DD'). */
function readSent(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeSent(map: Record<string, string>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map))
  } catch {
    /* almacenamiento lleno o no disponible: ignorar */
  }
}

/**
 * Dispara notificaciones locales en el dispositivo para los avisos importantes del día
 * (tareas vencidas/de hoy, evaluaciones próximas) mientras la app está abierta.
 * Cada aviso se notifica como máximo una vez por día. No requiere servidor: funciona
 * en el iPhone con la PWA instalada, complementando el push real cuando esté configurado.
 */
export function useLocalReminders() {
  const alerts = useAlerts()
  const alertsRef = useRef<Alert[]>(alerts)
  alertsRef.current = alerts

  useEffect(() => {
    const fire = async () => {
      if (notifPermission() !== 'granted') return
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

      const today = dateKey()
      const sent = readSent()
      let changed = false

      // Solo avisos relevantes (alta/media prioridad) para no saturar.
      for (const a of alertsRef.current.filter((x) => x.severity !== 'low')) {
        if (sent[a.id] === today) continue
        const ok = await showLocalNotification(a.title, { body: a.body, tag: a.id, url: a.to })
        if (ok) {
          sent[a.id] = today
          changed = true
        }
      }

      // Limpia entradas de días anteriores para que el almacenamiento no crezca.
      for (const key of Object.keys(sent)) {
        if (sent[key] !== today) {
          delete sent[key]
          changed = true
        }
      }

      if (changed) writeSent(sent)
    }

    // Pequeño retraso inicial para dejar que carguen los datos y el Service Worker.
    const startTimer = setTimeout(fire, 4000)
    const interval = setInterval(fire, 5 * 60 * 1000) // re-chequea cada 5 min
    const onVisible = () => {
      if (document.visibilityState === 'visible') fire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearTimeout(startTimer)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
