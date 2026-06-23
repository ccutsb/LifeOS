import { Landmark, Wallet, Banknote, Gift, CreditCard, PiggyBank, Coins, type LucideIcon } from 'lucide-react'
import type { Account, AccountKind, Transaction } from '@/types/database'

/** Metadatos de cada tipo de cuenta: etiqueta legible e ícono. */
export const ACCOUNT_KINDS: Record<AccountKind, { label: string; icon: LucideIcon }> = {
  bank: { label: 'Banco', icon: Landmark },
  wallet: { label: 'Billetera digital', icon: Wallet },
  cash: { label: 'Efectivo', icon: Banknote },
  benefit: { label: 'Beca / Beneficio', icon: Gift },
  credit: { label: 'Tarjeta de crédito', icon: CreditCard },
  savings: { label: 'Ahorro', icon: PiggyBank },
  other: { label: 'Otra', icon: Coins },
}

export const ACCOUNT_KIND_OPTIONS = (Object.keys(ACCOUNT_KINDS) as AccountKind[]).map((k) => ({
  value: k,
  label: ACCOUNT_KINDS[k].label,
}))

export const accountIcon = (kind: AccountKind): LucideIcon => ACCOUNT_KINDS[kind]?.icon ?? Coins

/** Saldo actual de una cuenta = saldo inicial + ingresos − gastos asignados a ella. */
export function accountBalance(account: Account, transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => {
    if (t.account_id !== account.id) return sum
    return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount))
  }, Number(account.initial_balance))
}
