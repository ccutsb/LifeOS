import type { AreaKind } from '@/types/database'

/** Ejemplo de objetivo acorde a cada área de vida (evita repetir siempre el mismo ejemplo). */
const OBJECTIVE_EXAMPLE: Record<AreaKind, string> = {
  university: 'Aprobar el semestre con promedio 5.5+',
  work: 'Ascender a Senior',
  home: 'Dejar la casa completamente ordenada',
  health: 'Correr 10 km sin parar',
  finance: 'Armar un fondo de emergencia',
  growth: 'Certificación AWS',
  projects: 'Lanzar mi proyecto personal',
  leisure: 'Leer 12 libros este año',
  custom: 'Una meta grande dividida en pasos pequeños',
}

export const objectiveExampleFor = (kind: AreaKind | undefined | null): string =>
  OBJECTIVE_EXAMPLE[kind ?? 'custom'] ?? OBJECTIVE_EXAMPLE.custom
