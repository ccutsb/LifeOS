import { useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { formatCLP } from '@/lib/money'
import { useContributeGoal } from './hooks'
import type { SavingsGoal } from '@/types/database'

/** Abono manual a una meta de ahorro (reemplaza el window.prompt). */
export function ContributeGoalSheet({ goal, onClose }: { goal: SavingsGoal; onClose: () => void }) {
  const contribute = useContributeGoal()
  const [amount, setAmount] = useState('')
  const amountNum = Number(amount) || 0
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (amountNum <= 0) return
    try {
      await contribute.mutateAsync({ goal, amount: amountNum })
      toast.success(`Abonaste ${formatCLP(amountNum)} a "${goal.name}" 💰`)
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={`Abonar a "${goal.name}"`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Llevas {formatCLP(Number(goal.current_amount))} de {formatCLP(Number(goal.target_amount))}.
          {remaining > 0 ? ` Te faltan ${formatCLP(remaining)}.` : ' ¡Meta alcanzada! 🎉'}
        </p>
        <Field label="¿Cuánto abonar? (CLP)">
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000"
            autoFocus
            required
          />
          {amountNum > 0 && <span className="mt-1 block text-xs text-muted">{formatCLP(amountNum)}</span>}
        </Field>
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setAmount(String(remaining))}
            className="self-start rounded-lg px-2 py-1 text-xs text-brand active:bg-surface-2"
          >
            Completar la meta ({formatCLP(remaining)})
          </button>
        )}
        <Button type="submit" fullWidth disabled={contribute.isPending} className="mt-1">
          {contribute.isPending ? 'Guardando…' : 'Abonar'}
        </Button>
      </form>
    </Sheet>
  )
}
