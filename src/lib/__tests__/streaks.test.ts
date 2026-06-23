import { describe, it, expect } from 'vitest'
import { currentStreak, longestStreak } from '../streaks'
import { dateKey } from '../dates'

// Día relativo a hoy ('YYYY-MM-DD'), offset en días hacia atrás.
const day = (offset: number) => dateKey(new Date(Date.now() - offset * 86_400_000))

describe('currentStreak', () => {
  it('cuenta días consecutivos hasta hoy', () => {
    expect(currentStreak([day(0), day(1), day(2)])) .toBe(3)
  })

  it('da gracia a hoy: si no lo marcaste hoy pero sí ayer, sigue contando', () => {
    expect(currentStreak([day(1), day(2)])).toBe(2)
  })

  it('lista vacía → 0', () => {
    expect(currentStreak([])).toBe(0)
  })

  it('un hueco rompe la racha', () => {
    expect(currentStreak([day(3), day(4)])).toBe(0)
  })

  it('ignora días duplicados', () => {
    expect(currentStreak([day(0), day(0), day(1)])).toBe(2)
  })
})

describe('longestStreak', () => {
  it('encuentra la racha consecutiva más larga', () => {
    expect(longestStreak([day(0), day(1), day(2), day(5), day(6)])).toBe(3)
  })

  it('lista vacía → 0', () => {
    expect(longestStreak([])).toBe(0)
  })

  it('un solo día → 1', () => {
    expect(longestStreak([day(2)])).toBe(1)
  })
})
