import { differenceInCalendarDays } from 'date-fns'
import type { Energy, Task } from '@/types/database'
import { intervalDays } from './recurrence'

/**
 * Motor de priorización de LifeOS 2.0 (docs/EVOLUTION.md §3.4).
 * Determinista, puro y explicable: cada tarea recibe un score 0–100 y una
 * lista de razones legibles ("vence hoy", "coincide con tu energía"...).
 *
 *   score = urgencia (0–40) + importancia (0–20) + staleness (0–15)
 *         + fit energía (0–10) + fit tiempo (0–10) + variedad (0–5)
 */

export interface PlanContext {
  now?: Date
  /** Energía actual del usuario (null = desconocida, neutro). */
  energy?: Energy | null
  /** Minutos disponibles (null = sin límite). En "Ahora" es filtro duro. */
  availableMinutes?: number | null
  /** area_id -> priority (>0 = área prioritaria). */
  areaPriority?: Map<string, number>
  /** Objetivos activos (las tareas que empujan un objetivo suben). */
  activeObjectiveIds?: Set<string>
  /** Áreas ya trabajadas hoy (para premiar variedad). */
  areasDoneToday?: Set<string>
  /** Presupuesto de minutos del plan del día. */
  dayBudgetMinutes?: number
  /** Tareas descartadas en esta sesión de "Ahora". */
  excludeIds?: Set<string>
}

export interface ScoredTask {
  task: Task
  score: number
  reasons: string[]
}

const ACTIVE_STATUSES = new Set(['inbox', 'pending', 'in_progress'])
const ENERGY_RANK: Record<Energy, number> = { low: 0, medium: 1, high: 2 }
const DEFAULT_MINUTES = 30
const DEFAULT_DAY_BUDGET = 240

export const isActive = (t: Task) => ACTIVE_STATUSES.has(t.status)

/** Una recurrente completada hoy ya cumplió: no debe volver a sugerirse. */
export function isDoneToday(t: Task, now: Date = new Date()): boolean {
  if (!t.recurrence || !t.last_completed_at) return false
  return differenceInCalendarDays(now, new Date(t.last_completed_at)) === 0
}

export function scoreTask(task: Task, ctx: PlanContext = {}): ScoredTask {
  const now = ctx.now ?? new Date()
  const reasons: string[] = []
  let score = 0

  // ── Urgencia (0–40): decae exponencialmente con los días hasta vencer ──
  if (task.due_at) {
    const days = differenceInCalendarDays(new Date(task.due_at), now)
    if (days < 0) {
      score += 40
      reasons.push('está vencida')
    } else {
      score += 40 * Math.exp(-days / 4)
      if (days === 0) reasons.push('vence hoy')
      else if (days === 1) reasons.push('vence mañana')
      else if (days <= 5) reasons.push(`vence en ${days} días`)
    }
  }

  // ── Importancia (0–20) ──
  let importance = 0
  if (task.is_important) importance += 20
  if (task.objective_id && ctx.activeObjectiveIds?.has(task.objective_id)) importance += 12
  if (task.area_id && (ctx.areaPriority?.get(task.area_id) ?? 0) > 0) importance += 8
  importance = Math.min(20, importance)
  score += importance
  if (importance >= 12) {
    reasons.push(task.is_important ? 'la marcaste importante' : 'empuja un objetivo')
  }

  // ── Staleness (0–15): tiempo sin hacerse ──
  if (task.recurrence) {
    const last = task.last_completed_at ?? task.created_at
    const daysSince = Math.max(0, differenceInCalendarDays(now, new Date(last)))
    const ratio = daysSince / intervalDays(task.recurrence)
    const pts = Math.min(15, ratio * 7.5)
    score += pts
    if (ratio >= 2) reasons.push(`llevas ${daysSince} días sin hacerla`)
  } else {
    const daysInList = Math.max(0, differenceInCalendarDays(now, new Date(task.created_at)))
    score += Math.min(8, daysInList / 7)
  }

  // ── Fit de energía (0–10) ──
  if (ctx.energy && task.energy) {
    const diff = Math.abs(ENERGY_RANK[ctx.energy] - ENERGY_RANK[task.energy])
    score += diff === 0 ? 10 : diff === 1 ? 5 : 0
    if (diff === 0) reasons.push('coincide con tu energía')
  } else {
    score += 5 // neutro cuando falta información
  }

  // ── Fit de tiempo (0–10) ──
  if (ctx.availableMinutes != null && task.estimated_minutes != null) {
    if (task.estimated_minutes <= ctx.availableMinutes) {
      score += 10
      reasons.push('cabe en tu tiempo libre')
    }
  } else {
    score += 5
  }

  // ── Variedad (0–5): premia áreas no tocadas hoy ──
  if (task.area_id && ctx.areasDoneToday && ctx.areasDoneToday.size > 0 && !ctx.areasDoneToday.has(task.area_id)) {
    score += 5
  }

  return { task, score, reasons }
}

/** Candidatas: activas, no descartadas y no cumplidas hoy. */
function candidates(tasks: Task[], ctx: PlanContext): Task[] {
  const now = ctx.now ?? new Date()
  return tasks.filter(
    (t) => isActive(t) && !isDoneToday(t, now) && !ctx.excludeIds?.has(t.id),
  )
}

/**
 * Plan del día: top de tareas por score hasta llenar el presupuesto de minutos.
 * Las tareas sin duración estimada cuentan como 30 min.
 */
export function buildDayPlan(tasks: Task[], ctx: PlanContext = {}): ScoredTask[] {
  const budget = ctx.dayBudgetMinutes ?? DEFAULT_DAY_BUDGET
  const scored = candidates(tasks, ctx)
    .map((t) => scoreTask(t, ctx))
    .sort((a, b) => b.score - a.score)

  const plan: ScoredTask[] = []
  let used = 0
  for (const s of scored) {
    const min = s.task.estimated_minutes ?? DEFAULT_MINUTES
    if (used + min > budget && plan.length > 0) continue
    plan.push(s)
    used += min
    if (plan.length >= 8) break
  }
  return plan
}

/**
 * "¿Qué hago ahora?": UNA recomendación.
 * Energía opuesta y tareas que no caben en el tiempo disponible son FILTROS
 * DUROS; entre las 2 mejores desempata al azar (evita fatiga de repetición).
 */
export function recommendNow(
  tasks: Task[],
  ctx: PlanContext = {},
  rng: () => number = Math.random,
): ScoredTask | null {
  const pool = candidates(tasks, ctx).filter((t) => {
    if (ctx.availableMinutes != null && t.estimated_minutes != null && t.estimated_minutes > ctx.availableMinutes) {
      return false
    }
    if (ctx.energy && t.energy && Math.abs(ENERGY_RANK[ctx.energy] - ENERGY_RANK[t.energy]) === 2) {
      return false
    }
    return true
  })
  if (pool.length === 0) return null

  const ranked = pool.map((t) => scoreTask(t, ctx)).sort((a, b) => b.score - a.score)
  if (ranked.length >= 2 && ranked[0].score - ranked[1].score < 5 && rng() < 0.4) {
    return ranked[1]
  }
  return ranked[0]
}
