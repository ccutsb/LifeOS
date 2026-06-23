import { describe, it, expect } from 'vitest'
import { projectGrade, gradeColor } from '../grades'
import type { Evaluation } from '@/types/database'

// Helper: construye una evaluación mínima (projectGrade solo usa grade y weight).
const ev = (grade: number | null, weight: number) =>
  ({ grade, weight } as unknown as Evaluation)

describe('projectGrade', () => {
  it('sin evaluaciones calificadas devuelve promedio nulo', () => {
    const p = projectGrade([], 4, 7)
    expect(p.currentAverage).toBeNull()
    expect(p.gradedWeight).toBe(0)
    expect(p.remainingWeight).toBe(100)
  })

  it('calcula promedio ponderado, proyección y nota necesaria', () => {
    const p = projectGrade([ev(5.0, 30), ev(6.0, 20)], 4, 7)
    expect(p.currentAverage).toBe(5.4) // (5*30 + 6*20) / 50
    expect(p.securedPoints).toBe(2.7) // 270 / 100
    expect(p.gradedWeight).toBe(50)
    expect(p.remainingWeight).toBe(50)
    expect(p.neededToPass).toBeCloseTo(2.6, 5) // (4 - 2.7) * 100 / 50
    expect(p.projectedFinal).toBe(5.4)
    expect(p.canStillPass).toBe(true)
    expect(p.willPass).toBe(true)
  })

  it('detecta cuando ya es imposible aprobar', () => {
    // 80% calificado con 2.0; faltan 20%: necesita (4 - 1.6)*100/20 = 12.0 > 7.0
    const p = projectGrade([ev(2.0, 80)], 4, 7)
    expect(p.canStillPass).toBe(false)
  })

  it('con todo calificado, willPass depende de los puntos asegurados', () => {
    const p = projectGrade([ev(4.0, 50), ev(5.0, 50)], 4, 7)
    expect(p.remainingWeight).toBe(0)
    expect(p.securedPoints).toBe(4.5)
    expect(p.willPass).toBe(true)
  })

  it('ignora evaluaciones sin nota o sin ponderación', () => {
    const p = projectGrade([ev(6.0, 40), ev(null, 30), ev(7.0, 0)], 4, 7)
    expect(p.gradedWeight).toBe(40)
    expect(p.currentAverage).toBe(6.0)
  })
})

describe('gradeColor', () => {
  it('nulo → muted; reprobado → danger; holgado → success', () => {
    expect(gradeColor(null)).toBe('text-muted')
    expect(gradeColor(3.5, 4)).toBe('text-danger')
    expect(gradeColor(4.5, 4)).toBe('text-text')
    expect(gradeColor(6.0, 4)).toBe('text-success')
  })
})
