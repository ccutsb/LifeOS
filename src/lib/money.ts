const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

/** Formatea un monto en pesos chilenos: 12345 -> "$12.345" */
export const formatCLP = (n: number) => clp.format(n ?? 0)

export const formatNumber = (n: number) => new Intl.NumberFormat('es-CL').format(n ?? 0)
