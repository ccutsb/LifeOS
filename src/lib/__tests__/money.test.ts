import { describe, it, expect } from 'vitest'
import { formatCLP, formatNumber } from '../money'

describe('formatCLP', () => {
  it('formatea pesos chilenos con separador de miles y sin decimales', () => {
    const out = formatCLP(12345)
    expect(out).toContain('12.345')
    expect(out).not.toContain(',') // CLP no usa decimales
  })

  it('maneja 0 y null/undefined sin romper', () => {
    expect(formatCLP(0)).toContain('0')
    expect(formatCLP(undefined as unknown as number)).toContain('0')
  })

  it('formatea montos negativos', () => {
    expect(formatCLP(-5000)).toContain('5.000')
  })
})

describe('formatNumber', () => {
  it('agrupa miles', () => {
    expect(formatNumber(1000000)).toContain('1.000.000')
  })
})
