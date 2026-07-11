import { describe, it, expect } from 'vitest'
import { firstDue, nextDue, intervalDays, describeRecurrence } from '../recurrence'
import type { Recurrence } from '@/types/database'

// Base fija: jueves 9 de julio de 2026, 10:00 (getDay() = 4)
const THU = new Date(2026, 6, 9, 10, 0, 0)

const dayOf = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

describe('recurrence: firstDue (al crear, hoy cuenta)', () => {
  it('diaria vence hoy al final del día', () => {
    const d = firstDue({ freq: 'daily' }, THU)
    expect(dayOf(d)).toBe('2026-7-9')
    expect(d.getHours()).toBe(23)
  })

  it('semanal que incluye hoy vence hoy', () => {
    const d = firstDue({ freq: 'weekly', byweekday: [4] }, THU)
    expect(dayOf(d)).toBe('2026-7-9')
  })

  it('semanal de domingo (0) cae el próximo domingo', () => {
    const d = firstDue({ freq: 'weekly', byweekday: [0] }, THU)
    expect(dayOf(d)).toBe('2026-7-12')
    expect(d.getDay()).toBe(0)
  })

  it('mensual día 5 ya pasado cae al mes siguiente', () => {
    const d = firstDue({ freq: 'monthly', bymonthday: 5 }, THU)
    expect(dayOf(d)).toBe('2026-8-5')
  })

  it('mensual día 31 se ajusta en meses cortos', () => {
    // Desde el 9 de julio pidiendo día 31 → 31 de julio existe
    const d = firstDue({ freq: 'monthly', bymonthday: 31 }, THU)
    expect(dayOf(d)).toBe('2026-7-31')
    // Desde el 1 de febrero 2026 (no bisiesto) → 28 de febrero
    const feb = firstDue({ freq: 'monthly', bymonthday: 31 }, new Date(2026, 1, 1))
    expect(dayOf(feb)).toBe('2026-2-28')
  })
})

describe('recurrence: nextDue (al completar, estrictamente después de hoy)', () => {
  it('diaria completada hoy renace mañana', () => {
    const d = nextDue({ freq: 'daily' }, THU)
    expect(dayOf(d)).toBe('2026-7-10')
  })

  it('semanal de jueves completada un jueves renace el próximo jueves', () => {
    const d = nextDue({ freq: 'weekly', byweekday: [4] }, THU)
    expect(dayOf(d)).toBe('2026-7-16')
  })

  it('cada 15 días suma 15 días', () => {
    const d = nextDue({ freq: 'interval', days: 15 }, THU)
    expect(dayOf(d)).toBe('2026-7-24')
  })

  it('mensual día 9 completada el 9 renace el 9 del mes siguiente', () => {
    const d = nextDue({ freq: 'monthly', bymonthday: 9 }, THU)
    expect(dayOf(d)).toBe('2026-8-9')
  })
})

describe('recurrence: utilidades', () => {
  it('intervalDays aproxima el ciclo', () => {
    expect(intervalDays({ freq: 'daily' })).toBe(1)
    expect(intervalDays({ freq: 'interval', days: 15 })).toBe(15)
    expect(intervalDays({ freq: 'weekly', byweekday: [0] })).toBe(7)
    expect(intervalDays({ freq: 'weekly', byweekday: [1, 3, 5] })).toBe(2)
    expect(intervalDays({ freq: 'monthly', bymonthday: 5 })).toBe(30)
  })

  it('describeRecurrence habla español', () => {
    expect(describeRecurrence({ freq: 'daily' })).toBe('todos los días')
    expect(describeRecurrence({ freq: 'weekly', byweekday: [0] })).toBe('cada domingo')
    expect(describeRecurrence({ freq: 'interval', days: 15 })).toBe('cada 15 días')
    expect(describeRecurrence({ freq: 'monthly', bymonthday: 5 })).toBe('el día 5 de cada mes')
    const rec: Recurrence = { freq: 'weekly', byweekday: [0, 1, 2, 3, 4, 5, 6] }
    expect(describeRecurrence(rec)).toBe('todos los días')
  })
})
