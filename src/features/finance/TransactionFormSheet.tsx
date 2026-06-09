import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { formatCLP } from '@/lib/money'
import { dateKey } from '@/lib/dates'
import { useCreateTransaction } from './hooks'

const EXPENSE_CATS = ['Comida', 'Transporte', 'Universidad', 'Arriendo', 'Servicios', 'Ocio', 'Salud', 'Otro']
const INCOME_CATS = ['Sueldo', 'Beca', 'Freelance', 'Otro']

export function TransactionFormSheet({ initialType, onClose }: { initialType: 'income' | 'expense'; onClose: () => void }) {
  const create = useCreateTransaction()
  const [type, setType] = useState<'income' | 'expense'>(initialType)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(dateKey())

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const amountNum = Number(amount) || 0

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (amountNum <= 0) return
    try {
      const { autoSaved } = await create.mutateAsync({
        type,
        amount: amountNum,
        category: category || null,
        description: description.trim() || null,
        occurred_on: date,
      })
      toast.success(type === 'income' ? 'Ingreso registrado' : 'Gasto registrado')
      if (autoSaved > 0) toast.success(`Ahorro automático: ${formatCLP(autoSaved)} 💰`)
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title="Nuevo movimiento">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition',
                type === t ? (t === 'income' ? 'bg-success text-white' : 'bg-danger text-white') : 'text-muted',
              )}
            >
              {t === 'income' ? 'Ingreso' : 'Gasto'}
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

        <Button type="submit" fullWidth disabled={create.isPending} className="mt-1">
          {create.isPending ? 'Guardando…' : 'Registrar'}
        </Button>
      </form>
    </Sheet>
  )
}
