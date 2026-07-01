import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { AlertTriangle } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { formatCLP } from '@/lib/money'
import { dateKey } from '@/lib/dates'
import {
  useCreateTransaction,
  useUpdateTransaction,
  useCreateTransfer,
  useAccounts,
  useTransactions,
  useTransfers,
} from './hooks'
import { accountBalance } from './accountKinds'
import type { Transaction } from '@/types/database'

const EXPENSE_CATS = ['Comida', 'Transporte', 'Universidad', 'Arriendo', 'Servicios', 'Ocio', 'Salud', 'Otro']
const INCOME_CATS = ['Sueldo', 'Beca', 'Freelance', 'Otro']

type Mode = 'expense' | 'income' | 'transfer'

const MODE_LABEL: Record<Mode, string> = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' }
const MODE_ACTIVE: Record<Mode, string> = {
  expense: 'bg-danger text-white',
  income: 'bg-success text-white',
  transfer: 'bg-info text-white',
}

export function TransactionFormSheet({
  initialType,
  initialAccountId,
  transaction,
  onClose,
}: {
  initialType: 'income' | 'expense'
  initialAccountId?: string
  transaction?: Transaction
  onClose: () => void
}) {
  const create = useCreateTransaction()
  const update = useUpdateTransaction()
  const createTransfer = useCreateTransfer()
  const { data: accounts = [] } = useAccounts()
  const { data: transactions = [] } = useTransactions()
  const { data: transfers = [] } = useTransfers()
  const editing = Boolean(transaction)

  const [mode, setMode] = useState<Mode>(transaction?.type ?? initialType)
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [category, setCategory] = useState(transaction?.category ?? '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [date, setDate] = useState(transaction?.occurred_on ?? dateKey())
  const [accountId, setAccountId] = useState(transaction?.account_id ?? initialAccountId ?? '')
  // Solo para transferencias
  const [fromId, setFromId] = useState(initialAccountId ?? '')
  const [toId, setToId] = useState('')

  const cats = mode === 'income' ? INCOME_CATS : EXPENSE_CATS
  const amountNum = Number(amount) || 0
  const pending = create.isPending || update.isPending || createTransfer.isPending

  // Modos disponibles: al editar solo gasto/ingreso; al crear también transferencia.
  const modes: Mode[] = editing ? ['expense', 'income'] : ['expense', 'income', 'transfer']

  // Advertencia (no bloqueante) si la cuenta origen no tiene saldo suficiente.
  const fromAccount = accounts.find((a) => a.id === fromId)
  const fromBalance = fromAccount ? accountBalance(fromAccount, transactions, transfers) : null
  const insufficient = mode === 'transfer' && fromBalance != null && amountNum > fromBalance

  const submitTransfer = async () => {
    if (!fromId || !toId || fromId === toId) {
      toast.error('Elige dos cuentas distintas')
      return
    }
    await createTransfer.mutateAsync({
      from_account_id: fromId,
      to_account_id: toId,
      amount: amountNum,
      description: description.trim() || null,
      occurred_on: date,
    })
    toast.success('Transferencia registrada')
    onClose()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (amountNum <= 0) return
    try {
      if (mode === 'transfer') {
        await submitTransfer()
        return
      }
      const values = {
        type: mode,
        amount: amountNum,
        category: category || null,
        description: description.trim() || null,
        occurred_on: date,
        account_id: accountId || null,
      }
      if (editing && transaction) {
        await update.mutateAsync({ id: transaction.id, values })
        toast.success('Movimiento actualizado')
      } else {
        const { autoSaved } = await create.mutateAsync(values)
        toast.success(mode === 'income' ? 'Ingreso registrado' : 'Gasto registrado')
        if (autoSaved > 0) toast.success(`Ahorro automático: ${formatCLP(autoSaved)} 💰`)
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={clsx(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition',
                mode === m ? MODE_ACTIVE[m] : 'text-muted',
              )}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        <Field label="Monto (CLP)">
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25000"
            autoFocus
            required
          />
          {amountNum > 0 && <span className="mt-1 block text-xs text-muted">{formatCLP(amountNum)}</span>}
        </Field>

        {mode === 'transfer' ? (
          <>
            {accounts.length < 2 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">
                Necesitas al menos dos cuentas para transferir. Crea otra billetera desde Finanzas.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="¿Desde qué cuenta?">
                  <Select
                    value={fromId}
                    onChange={(e) => {
                      setFromId(e.target.value)
                      if (e.target.value === toId) setToId('')
                    }}
                  >
                    <option value="">Elegir…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="¿Hacia qué cuenta?">
                  <Select value={toId} onChange={(e) => setToId(e.target.value)}>
                    <option value="">Elegir…</option>
                    {accounts
                      .filter((a) => a.id !== fromId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </Select>
                </Field>
              </div>
            )}

            {insufficient && (
              <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {fromAccount?.name} quedaría en saldo negativo ({formatCLP((fromBalance ?? 0) - amountNum)}). Puedes
                registrarla igual si es lo que quieres.
              </p>
            )}

            <Field label="Fecha">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field label="Descripción">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Aporte semanal Ripley" />
            </Field>
          </>
        ) : (
          <>
            <Field label={mode === 'income' ? '¿A qué cuenta entró?' : '¿De qué cuenta salió?'}>
              {accounts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">
                  Aún no tienes cuentas. Crea una billetera (MercadoPago, banco, beca…) desde Finanzas para asignar tus
                  movimientos.
                </p>
              ) : (
                <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Sin cuenta</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoría">
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Sin categoría</option>
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>

            <Field label="Descripción">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
            </Field>
          </>
        )}

        <Button type="submit" fullWidth disabled={pending} className="mt-1">
          {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar'}
        </Button>
      </form>
    </Sheet>
  )
}
