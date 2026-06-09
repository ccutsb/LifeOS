import { dateKey } from './dates'

/**
 * Racha actual = días consecutivos cumplidos hasta hoy.
 * Hoy cuenta como "gracia": si aún no lo marcas hoy, la racha sigue contando desde ayer.
 */
export function currentStreak(doneDates: string[], today: Date = new Date()): number {
  const set = new Set(doneDates)
  const d = new Date(today)
  d.setHours(0, 0, 0, 0)
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1) // gracia para hoy
  let streak = 0
  while (set.has(dateKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/** Racha más larga histórica. */
export function longestStreak(doneDates: string[]): number {
  if (doneDates.length === 0) return 0
  const sorted = [...new Set(doneDates)].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const cur = new Date(sorted[i])
    const diff = (cur.getTime() - prev.getTime()) / 86_400_000
    if (Math.round(diff) === 1) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}
