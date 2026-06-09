import type { Evaluation } from '@/types/database'

const round = (n: number, decimals = 2) => {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

export interface GradeProjection {
  /** Promedio ponderado de lo ya calificado (escala 1.0–7.0). */
  currentAverage: number | null
  /** Puntos ya asegurados hacia la nota final (asumiendo ponderaciones sobre 100%). */
  securedPoints: number
  /** % de la nota ya calificado. */
  gradedWeight: number
  /** % de la nota pendiente. */
  remainingWeight: number
  /** Nota final proyectada si lo pendiente sale igual al promedio actual. */
  projectedFinal: number | null
  /** Nota promedio necesaria en lo pendiente para aprobar. */
  neededToPass: number | null
  /** ¿Es alcanzable aprobar? (false = ya es imposible con el máximo). */
  canStillPass: boolean
  willPass: boolean | null
}

/**
 * Cálculo de notas escala chilena 1.0–7.0 con ponderaciones en %.
 * Asume que las ponderaciones del ramo suman 100%.
 */
export function projectGrade(
  evals: Evaluation[],
  passing = 4.0,
  maxGrade = 7.0,
): GradeProjection {
  const graded = evals.filter((e) => e.grade != null && Number(e.weight) > 0)
  const gradedWeight = graded.reduce((s, e) => s + Number(e.weight), 0)
  const contribution = graded.reduce((s, e) => s + Number(e.grade) * Number(e.weight), 0)

  const currentAverage = gradedWeight > 0 ? round(contribution / gradedWeight) : null
  const securedPoints = round(contribution / 100) // aporte a la nota final
  const remainingWeight = Math.max(0, 100 - gradedWeight)

  const neededToPass =
    remainingWeight > 0 ? round(((passing - securedPoints) * 100) / remainingWeight) : null

  const projectedFinal =
    currentAverage != null ? round(securedPoints + (currentAverage * remainingWeight) / 100) : null

  const canStillPass = remainingWeight > 0 ? (neededToPass ?? 0) <= maxGrade : securedPoints >= passing

  const willPass =
    remainingWeight === 0
      ? securedPoints >= passing
      : projectedFinal != null
        ? projectedFinal >= passing
        : null

  return {
    currentAverage,
    securedPoints,
    gradedWeight: round(gradedWeight),
    remainingWeight: round(remainingWeight),
    projectedFinal,
    neededToPass,
    canStillPass,
    willPass,
  }
}

/** Color semántico para una nota según si aprueba. */
export function gradeColor(grade: number | null, passing = 4.0): string {
  if (grade == null) return 'text-muted'
  if (grade >= passing + 1.5) return 'text-success'
  if (grade >= passing) return 'text-text'
  return 'text-danger'
}
