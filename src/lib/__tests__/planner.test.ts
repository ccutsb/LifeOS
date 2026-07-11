import { describe, it, expect } from 'vitest'
import { scoreTask, buildDayPlan, recommendNow, isDoneToday } from '../planner'
import type { Task } from '@/types/database'

// Base fija: jueves 9 de julio de 2026, 10:00
const NOW = new Date(2026, 6, 9, 10, 0, 0)
const iso = (d: Date) => d.toISOString()
const daysFromNow = (n: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() + n)
  return d
}

let seq = 0
function makeTask(partial: Partial<Task>): Task {
  seq++
  return {
    id: `t${seq}`,
    user_id: 'u1',
    course_id: null,
    evaluation_id: null,
    area_id: null,
    objective_id: null,
    goal_id: null,
    title: `Tarea ${seq}`,
    description: null,
    due_at: null,
    status: 'pending',
    is_important: false,
    is_urgent: false,
    quadrant: 'eliminate',
    next_action: null,
    estimated_minutes: null,
    energy: null,
    recurrence: null,
    last_completed_at: null,
    completed_at: null,
    sort_order: 0,
    created_at: iso(daysFromNow(-1)),
    updated_at: iso(NOW),
    ...partial,
  }
}

describe('planner: scoreTask', () => {
  it('una vencida supera a una sin fecha', () => {
    const overdue = scoreTask(makeTask({ due_at: iso(daysFromNow(-2)) }), { now: NOW })
    const dateless = scoreTask(makeTask({}), { now: NOW })
    expect(overdue.score).toBeGreaterThan(dateless.score)
    expect(overdue.reasons).toContain('está vencida')
  })

  it('vencer hoy supera a vencer en una semana', () => {
    const today = scoreTask(makeTask({ due_at: iso(daysFromNow(0)) }), { now: NOW })
    const nextWeek = scoreTask(makeTask({ due_at: iso(daysFromNow(7)) }), { now: NOW })
    expect(today.score).toBeGreaterThan(nextWeek.score)
    expect(today.reasons).toContain('vence hoy')
  })

  it('importante supera a no importante en igualdad de condiciones', () => {
    const imp = scoreTask(makeTask({ is_important: true }), { now: NOW })
    const normal = scoreTask(makeTask({}), { now: NOW })
    expect(imp.score - normal.score).toBeGreaterThanOrEqual(19)
  })

  it('la energía coincidente premia; la opuesta castiga', () => {
    const ctx = { now: NOW, energy: 'high' as const }
    const match = scoreTask(makeTask({ energy: 'high' }), ctx)
    const opposite = scoreTask(makeTask({ energy: 'low' }), ctx)
    expect(match.score - opposite.score).toBeCloseTo(10, 5)
    expect(match.reasons).toContain('coincide con tu energía')
  })

  it('una recurrente muy atrasada acumula staleness', () => {
    const stale = scoreTask(
      makeTask({ recurrence: { freq: 'daily' }, last_completed_at: iso(daysFromNow(-5)) }),
      { now: NOW },
    )
    const fresh = scoreTask(
      makeTask({ recurrence: { freq: 'daily' }, last_completed_at: iso(daysFromNow(-1)) }),
      { now: NOW },
    )
    expect(stale.score).toBeGreaterThan(fresh.score)
  })
})

describe('planner: buildDayPlan', () => {
  it('respeta el presupuesto de minutos', () => {
    const tasks = [
      makeTask({ estimated_minutes: 60, due_at: iso(daysFromNow(0)) }),
      makeTask({ estimated_minutes: 60, due_at: iso(daysFromNow(1)) }),
      makeTask({ estimated_minutes: 60, due_at: iso(daysFromNow(2)) }),
    ]
    const plan = buildDayPlan(tasks, { now: NOW, dayBudgetMinutes: 120 })
    expect(plan).toHaveLength(2)
  })

  it('excluye recurrentes ya cumplidas hoy', () => {
    const done = makeTask({
      recurrence: { freq: 'daily' },
      last_completed_at: iso(NOW),
      due_at: iso(daysFromNow(1)),
    })
    expect(isDoneToday(done, NOW)).toBe(true)
    const plan = buildDayPlan([done], { now: NOW })
    expect(plan).toHaveLength(0)
  })

  it('excluye tareas done y canceladas', () => {
    const plan = buildDayPlan(
      [makeTask({ status: 'done' }), makeTask({ status: 'cancelled' })],
      { now: NOW },
    )
    expect(plan).toHaveLength(0)
  })
})

describe('planner: recommendNow', () => {
  it('filtra duro por tiempo disponible', () => {
    const big = makeTask({ estimated_minutes: 120, due_at: iso(daysFromNow(0)) })
    const small = makeTask({ estimated_minutes: 15 })
    const rec = recommendNow([big, small], { now: NOW, availableMinutes: 30 }, () => 1)
    expect(rec?.task.id).toBe(small.id)
  })

  it('filtra duro la energía opuesta', () => {
    const heavy = makeTask({ energy: 'high', due_at: iso(daysFromNow(0)) })
    const light = makeTask({ energy: 'low' })
    const rec = recommendNow([heavy, light], { now: NOW, energy: 'low' }, () => 1)
    expect(rec?.task.id).toBe(light.id)
  })

  it('respeta los descartes y devuelve null si no queda nada', () => {
    const only = makeTask({})
    const rec = recommendNow([only], { now: NOW, excludeIds: new Set([only.id]) }, () => 1)
    expect(rec).toBeNull()
  })

  it('sin candidatas devuelve null', () => {
    expect(recommendNow([], { now: NOW })).toBeNull()
  })
})
