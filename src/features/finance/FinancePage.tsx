import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Trash2, Target, PiggyBank, Repeat, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCLP } from '@/lib/money'
import { shortDate } from '@/lib/dates'
import {
  useTransactions,
  useAccounts,
  useBudgets,
  useSavingsGoals,
  useSavingsRules,
  useDeleteTransaction,
  useDeleteBudget,
  useDeleteGoal,
} from './hooks'
import { TransactionFormSheet } from './TransactionFormSheet'
import { GoalFormSheet } from './GoalFormSheet'
import { BudgetFormSheet } from './BudgetFormSheet'
import { AccountFormSheet } from './AccountFormSheet'
import { ContributeGoalSheet } from './ContributeGoalSheet'
import { accountIcon, accountBalance } from './accountKinds'
import type { Account, SavingsGoal, Transaction } from '@/types/database'

export function FinancePage() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: accounts = [] } = useAccounts()
  const { data: budgets = [] } = useBudgets()
  const { data: goals = [] } = useSavingsGoals()
  const { data: rules = [] } = useSavingsRules()
  const delTx = useDeleteTransaction()
  const delBudget = useDeleteBudget()
  const delGoal = useDeleteGoal()

  const [txType, setTxType] = useState<'income' | 'expense' | null>(null)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [goalForm, setGoalForm] = useState<{ goal?: SavingsGoal } | null>(null)
  const [showBudget, setShowBudget] = useState(false)
  const [accountForm, setAccountForm] = useState<{ account?: Account } | null>(null)
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null)

  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTx = transactions.filter((t) => t.occurred_on.startsWith(ym))
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense
  const spentByCat = (cat: string) =>
    monthTx.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0)
  const autoPercentOf = (goalId: string) => Number(rules.find((r) => r.goal_id === goalId)?.value ?? 0)
  const accountById = (id: string | null) => (id ? accounts.find((a) => a.id === id) : undefined)
  const totalWallets = accounts.reduce((s, a) => s + accountBalance(a, transactions), 0)

  const onContribute = (goal: SavingsGoal) => setContributeGoal(goal)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Finanzas" subtitle="Mes actual" />

      {/* Resumen */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Balance del mes</span>
          <span className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>{formatCLP(balance)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="flex items-center gap-1 text-xs text-muted">
              <TrendingUp className="h-3.5 w-3.5 text-success" /> Ingresos
            </p>
            <p className="font-semibold text-success">{formatCLP(income)}</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="flex items-center gap-1 text-xs text-muted">
              <TrendingDown className="h-3.5 w-3.5 text-danger" /> Gastos
            </p>
            <p className="font-semibold text-danger">{formatCLP(expense)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setTxType('income')}>
            <Plus className="h-4 w-4" /> Ingreso
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setTxType('expense')}>
            <Plus className="h-4 w-4" /> Gasto
          </Button>
        </div>
      </Card>

      {/* Cuentas / Billeteras */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Wallet className="h-4 w-4 text-success" /> Cuentas y billeteras
          </h3>
          <button onClick={() => setAccountForm({})} className="flex items-center gap-1 text-sm text-brand">
            <Plus className="h-4 w-4" /> Nueva
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-5 text-center text-sm text-muted">
            Crea tus cuentas (MercadoPago, Banco Ripley, Scotiabank, Pluxee beca…) para ordenar de dónde sale y entra
            cada peso.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-2.5">
              {accounts.map((a) => {
                const bal = accountBalance(a, transactions)
                const Icon = accountIcon(a.kind)
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setAccountForm({ account: a })}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left active:bg-surface-2"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{ backgroundColor: `${a.color}22` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: a.color }} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <p className={`text-sm font-semibold ${bal < 0 ? 'text-danger' : 'text-text'}`}>{formatCLP(bal)}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <span className="text-muted">Total disponible</span>
              <span className={`font-bold ${totalWallets < 0 ? 'text-danger' : 'text-success'}`}>{formatCLP(totalWallets)}</span>
            </div>
          </>
        )}
      </section>

      {/* Metas */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4 text-info" /> Metas de ahorro
          </h3>
          <button onClick={() => setGoalForm({})} className="flex items-center gap-1 text-sm text-brand">
            <Plus className="h-4 w-4" /> Nueva
          </button>
        </div>
        {goals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-5 text-center text-sm text-muted">
            Crea una meta (ej. fondo de emergencia) y activa el ahorro automático.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {goals.map((g) => {
              const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100)
              const auto = autoPercentOf(g.id)
              return (
                <li key={g.id} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setGoalForm({ goal: g })} className="text-left font-medium">
                      {g.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onContribute(g)} className="rounded-lg px-2 py-1 text-xs text-brand active:bg-surface-2">
                        Abonar
                      </button>
                      <button onClick={() => delGoal.mutate(g.id)} className="rounded-lg p-1.5 text-muted active:bg-surface-2" aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
                    <span>
                      {formatCLP(Number(g.current_amount))} / {formatCLP(Number(g.target_amount))}
                    </span>
                    {auto > 0 && (
                      <span className="flex items-center gap-1 text-info">
                        <Repeat className="h-3 w-3" /> {auto}% auto
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Presupuestos */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <PiggyBank className="h-4 w-4 text-warning" /> Presupuestos
          </h3>
          <button onClick={() => setShowBudget(true)} className="flex items-center gap-1 text-sm text-brand">
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
        {budgets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-5 text-center text-sm text-muted">
            Define cuánto quieres gastar por categoría al mes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {budgets.map((b) => {
              const spent = spentByCat(b.category)
              const pct = Math.min(100, (spent / Number(b.amount)) * 100)
              const over = spent > Number(b.amount)
              return (
                <li key={b.id} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={over ? 'text-danger' : 'text-muted'}>
                        {formatCLP(spent)} / {formatCLP(Number(b.amount))}
                      </span>
                      <button onClick={() => delBudget.mutate(b.id)} className="rounded-lg p-1 text-muted active:bg-surface-2" aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className={`h-full rounded-full transition-all ${over ? 'bg-danger' : 'bg-warning'}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Movimientos recientes */}
      <section>
        <h3 className="mb-2 font-semibold">Movimientos</h3>
        {transactions.length === 0 ? (
          <EmptyState title="Sin movimientos" hint="Registra tu primer ingreso o gasto con los botones de arriba." />
        ) : (
          <ul className="flex flex-col gap-2">
            {transactions.slice(0, 20).map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <span className={`h-8 w-1 rounded-full ${t.type === 'income' ? 'bg-success' : 'bg-danger'}`} />
                <button onClick={() => setEditTx(t)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description || t.category || (t.type === 'income' ? 'Ingreso' : 'Gasto')}</p>
                    <p className="text-xs text-muted">
                      {t.category ? `${t.category} · ` : ''}
                      {accountById(t.account_id) ? `${accountById(t.account_id)!.name} · ` : ''}
                      {shortDate(t.occurred_on)}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '−'}
                    {formatCLP(Number(t.amount))}
                  </span>
                </button>
                <button onClick={() => delTx.mutate(t.id)} className="rounded-lg p-1.5 text-muted active:bg-surface-2" aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {txType && <TransactionFormSheet initialType={txType} onClose={() => setTxType(null)} />}
      {editTx && (
        <TransactionFormSheet initialType={editTx.type} transaction={editTx} onClose={() => setEditTx(null)} />
      )}
      {contributeGoal && <ContributeGoalSheet goal={contributeGoal} onClose={() => setContributeGoal(null)} />}
      {goalForm && (
        <GoalFormSheet
          goal={goalForm.goal}
          initialAutoPercent={goalForm.goal ? autoPercentOf(goalForm.goal.id) : 0}
          onClose={() => setGoalForm(null)}
        />
      )}
      {showBudget && <BudgetFormSheet onClose={() => setShowBudget(false)} />}
      {accountForm && <AccountFormSheet account={accountForm.account} onClose={() => setAccountForm(null)} />}
    </div>
  )
}
