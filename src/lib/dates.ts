import { format, isToday, isTomorrow, isPast, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'

/** Clave de fecha local 'YYYY-MM-DD' (segura ante zonas horarias). */
export const dateKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const longDate = (d: Date = new Date()) =>
  format(d, "EEEE d 'de' MMMM", { locale: es })

export const shortDate = (d: Date | string) =>
  format(typeof d === 'string' ? new Date(d) : d, 'd MMM', { locale: es })

export const timeOf = (d: Date | string) =>
  format(typeof d === 'string' ? new Date(d) : d, 'HH:mm')

export function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Texto relativo para fechas de entrega: Hoy / Mañana / Vencida / d MMM */
export function relativeDue(dueAt: string | null): { label: string; overdue: boolean; soon: boolean } | null {
  if (!dueAt) return null
  const d = new Date(dueAt)
  const overdue = isPast(d) && !isToday(d)
  const days = differenceInCalendarDays(d, new Date())
  let label: string
  if (overdue) label = 'Vencida'
  else if (isToday(d)) label = 'Hoy'
  else if (isTomorrow(d)) label = 'Mañana'
  else label = format(d, "d MMM", { locale: es })
  return { label, overdue, soon: !overdue && days <= 2 }
}

export const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** ISO -> valor para <input type="datetime-local"> (hora local). */
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Valor de <input datetime-local> -> ISO (UTC) para guardar en Supabase. */
export const fromDateTimeLocal = (v: string): string | null => (v ? new Date(v).toISOString() : null)

export { isToday, isTomorrow, isPast, format }
