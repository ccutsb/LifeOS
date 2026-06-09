import { useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useCreateBudget } from './hooks'

const CATS = ['Comida', 'Transporte', 'Universidad', 'Arriendo', 'Servicios', 'Ocio', 'Salud', 'Otro']

export function BudgetFormSheet({ onClose }: { onClose: () => void }) {
  const create = useCreateBudget()
  const [category, setCategory] = useState('Comida')
  const [amount, setAmount] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!(Number(amount) > 0)) return
    try {
      await create.mutateAsync({ category, amount: Number(amount), period: 'monthly' })
      toast.success('Presupuesto guardado')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title="Nuevo presupuesto mensual">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Categoría">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Límite mensual (CLP)">
          <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" autoFocus required />
        </Field>
        <Button type="submit" fullWidth disabled={create.isPending} className="mt-1">
          {create.isPending ? 'Guardando…' : 'Guardar presupuesto'}
        </Button>
      </form>
    </Sheet>
  )
}
