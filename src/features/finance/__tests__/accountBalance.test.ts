import { describe, it, expect } from 'vitest'
import { accountBalance } from '../accountKinds'
import type { Account, Transaction, Transfer } from '@/types/database'

const acc = (id: string, initial = 0): Account =>
  ({ id, initial_balance: initial, kind: 'bank' } as unknown as Account)

const transfer = (from: string, to: string, amount: number): Transfer =>
  ({ from_account_id: from, to_account_id: to, amount } as unknown as Transfer)

describe('accountBalance con transferencias', () => {
  const scotia = acc('scotia', 0)
  const ripley = acc('ripley', 0)
  const txs: Transaction[] = []

  it('transferir 25.000 de Scotiabank a Ripley: origen −25.000, destino +25.000', () => {
    const trs = [transfer('scotia', 'ripley', 25000)]
    expect(accountBalance(scotia, txs, trs)).toBe(-25000)
    expect(accountBalance(ripley, txs, trs)).toBe(25000)
  })

  it('el total entre ambas cuentas no cambia con la transferencia', () => {
    const trs = [transfer('scotia', 'ripley', 25000)]
    const total = accountBalance(scotia, txs, trs) + accountBalance(ripley, txs, trs)
    expect(total).toBe(0)
  })

  it('combina saldo inicial, ingresos/gastos y transferencias', () => {
    const a = acc('a', 100000)
    const b = acc('b', 0)
    const transactions: Transaction[] = [
      { account_id: 'a', type: 'income', amount: 50000 } as unknown as Transaction,
      { account_id: 'a', type: 'expense', amount: 20000 } as unknown as Transaction,
    ]
    const trs = [transfer('a', 'b', 30000)]
    // a: 100.000 + 50.000 − 20.000 − 30.000 = 100.000 ; b: 0 + 30.000 = 30.000
    expect(accountBalance(a, transactions, trs)).toBe(100000)
    expect(accountBalance(b, transactions, trs)).toBe(30000)
  })

  it('sin transferencias se comporta como antes (retrocompatible)', () => {
    const a = acc('a', 10000)
    expect(accountBalance(a, [])).toBe(10000)
  })
})
