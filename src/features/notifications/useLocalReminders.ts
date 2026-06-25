import { useEffect, useRef } from 'react'
import { dateKey } from '@/lib/dates'
import { notifPermission, showLocalNotification } from '@/lib/notify'
import { useHabits, useHabitLogs } from '@/features/habits/hooks'
import { useAlerts, type Alert } from './alerts'

interface Notifiable {
  id: string
  title: string
  body?: string
  to: string
}

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
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()

  // Refs para que el intervalo lea siempre los datos más recientes sin re-suscribirse.
  const alertsRef = useRef<Alert[]>(alerts)
  alertsRef.current = alerts
  const habitsRef = useRef(habits)
  habitsRef.current = habits
  const logsRef = useRef(habitLogs)
  logsRef.current = habitLogs

  useEffect(() => {
    // Hábitos cuyo recordatorio ya tocó hoy, del día correcto y aún sin cumplir.
    const dueHabitReminders = (): Notifiable[] => {
      const now = new Date()
      const today = dateKey(now)
      const weekday = now.getDay()
      const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      return habitsRef.current
        .filter((h) => {
          if (!h.reminder_time) return false
          if (!h.weekdays.includes(weekday)) return false
          if (h.reminder_time.slice(0, 5) > nowHM) return false // aún no es la hora
          const doneToday = logsRef.current.some((l) => l.habit_id === h.id && l.log_date === today && l.done)
          return !doneToday
        })
        .map((h) => ({
          id: `habit-${h.id}`,
          title: `Hábito: ${h.name}`,
          body: h.cue ?? 'Es momento de tu hábito',
          to: '/habitos',
        }))
    }

    const fire = async () => {
      if (notifPermission() !== 'granted') return
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

      const today = dateKey()
      const sent = readSent()
      let changed = false

      // Avisos relevantes (alta/media prioridad) + recordatorios de hábitos vencidos hoy.
      const notifiables: Notifiable[] = [
        ...alertsRef.current.filter((x) => x.severity !== 'low'),
        ...dueHabitReminders(),
      ]
      for (const a of notifiables) {
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
