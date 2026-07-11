import { describe, it, expect } from 'vitest'
import { quadrantOf, isUrgentByDate } from '../eisenhower'

describe('quadrantOf', () => {
  it('mapea urgencia/importancia a los 4 cuadrantes', () => {
    expect(quadrantOf(true, true)).toBe('do')
    expect(quadrantOf(false, true)).toBe('schedule')
    expect(quadrantOf(true, false)).toBe('delegate')
    expect(quadrantOf(false, false)).toBe('eliminate')
  })
})

describe('isUrgentByDate', () => {
  it('null nunca es urgente', () => {
    expect(isUrgentByDate(null)).toBe(false)
  })

  it('vencer dentro del umbral es urgente', () => {
    const in10h = new Date(Date.now() + 10 * 3_600_000).toISOString()
    expect(isUrgentByDate(in10h, 48)).toBe(true)
  })

  it('vencer más allá del umbral no es urgente', () => {
    const in5d = new Date(Date.now() + 5 * 24 * 3_600_000).toISOString()
    expect(isUrgentByDate(in5d, 48)).toBe(false)
  })

  it('una fecha ya vencida es urgente', () => {
    const yesterday = new Date(Date.now() - 24 * 3_600_000).toISOString()
    expect(isUrgentByDate(yesterday, 48)).toBe(true)
  })
})
