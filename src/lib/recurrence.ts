import { addDays, addMonths, endOfDay, setDate, getDaysInMonth } from 'date-fns'
import type { Recurrence } from '@/types/database'
import { WEEKDAYS_LONG } from './dates'

/**
 * Motor de recurrencia de LifeOS (subset pragmático de RRULE).
 * Las tareas recurrentes NO generan filas nuevas: la misma fila recalcula su
 * próximo due_at al completarse (ver useCompleteTask).
 * Los vencimientos se fijan al FINAL del día: una tarea "de hoy" muestra
 * "Hoy" durante todo el día y recién vence a medianoche.
 */

/** Intervalo aproximado en días (para calcular "staleness" en el planner). */
export function intervalDays(rec: Recurrence): number {
  switch (rec.freq) {
    case 'daily':
      return 1
    case 'interval':
      return Math.max(1, rec.days)
    case 'weekly':
      return Math.max(1, Math.round(7 / Math.max(1, rec.byweekday.length)))
    case 'monthly':
      return 30
  }
}

/** Día bymonthday dentro del mes de `base`, ajustado si el mes es corto (31 -> 30/28). */
function monthday(base: Date, day: number): Date {
  return setDate(base, Math.min(day, getDaysInMonth(base)))
}

function occurrence(rec: Recurrence, from: Date, includeToday: boolean): Date {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)

  switch (rec.freq) {
    case 'daily':
      return endOfDay(includeToday ? start : addDays(start, 1))

    case 'interval':
      return endOfDay(includeToday ? start : addDays(start, Math.max(1, rec.days)))

    case 'weekly': {
      const days = [...rec.byweekday].sort((a, b) => a - b)
      if (days.length === 0) return endOfDay(addDays(start, includeToday ? 0 : 7))
      for (let offset = includeToday ? 0 : 1; offset <= 7; offset++) {
        const d = addDays(start, offset)
        if (days.includes(d.getDay())) return endOfDay(d)
      }
      return endOfDay(addDays(start, 7)) // inalcanzable, por seguridad
    }

    case 'monthly': {
      const thisMonth = monthday(start, rec.bymonthday)
      const min = includeToday ? start : addDays(start, 1)
      if (thisMonth >= min) return endOfDay(thisMonth)
      return endOfDay(monthday(addMonths(start, 1), rec.bymonthday))
    }
  }
}

/** Primer vencimiento al CREAR la tarea (hoy cuenta si calza). */
export const firstDue = (rec: Recurrence, from: Date = new Date()): Date =>
  occurrence(rec, from, true)

/** Próximo vencimiento al COMPLETAR la tarea (estrictamente después de hoy). */
export const nextDue = (rec: Recurrence, from: Date = new Date()): Date =>
  occurrence(rec, from, false)

/** Descripción legible en español: "cada domingo", "cada 15 días", "el día 5 de cada mes". */
export function describeRecurrence(rec: Recurrence): string {
  switch (rec.freq) {
    case 'daily':
      return 'todos los días'
    case 'interval':
      return rec.days === 1 ? 'todos los días' : `cada ${rec.days} días`
    case 'weekly': {
      const days = [...rec.byweekday].sort((a, b) => a - b)
      if (days.length === 0) return 'cada semana'
      if (days.length === 7) return 'todos los días'
      const names = days.map((d) => WEEKDAYS_LONG[d]?.toLowerCase() ?? '')
      return `cada ${names.join(' y ')}`
    }
    case 'monthly':
      return `el día ${rec.bymonthday} de cada mes`
  }
}
