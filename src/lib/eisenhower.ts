export type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate'

export const QUADRANT_META: Record<
  Quadrant,
  { label: string; action: string; hint: string; color: string }
> = {
  do: { label: 'Hacer ya', action: 'Hazlo', hint: 'Urgente e importante', color: 'q-do' },
  schedule: { label: 'Agendar', action: 'Decide cuándo', hint: 'Importante, no urgente', color: 'q-schedule' },
  delegate: { label: 'Delegar', action: '¿Quién más?', hint: 'Urgente, no importante', color: 'q-delegate' },
  eliminate: { label: 'Eliminar', action: 'Suéltalo', hint: 'Ni urgente ni importante', color: 'q-eliminate' },
}

export const QUADRANT_ORDER: Quadrant[] = ['do', 'schedule', 'delegate', 'eliminate']

export function quadrantOf(isUrgent: boolean, isImportant: boolean): Quadrant {
  if (isUrgent && isImportant) return 'do'
  if (!isUrgent && isImportant) return 'schedule'
  if (isUrgent && !isImportant) return 'delegate'
  return 'eliminate'
}

/** Urgencia automática: vence dentro del umbral (horas). */
export function isUrgentByDate(dueAt: string | null, hoursThreshold = 48): boolean {
  if (!dueAt) return false
  const diff = new Date(dueAt).getTime() - Date.now()
  return diff <= hoursThreshold * 3_600_000
}
