import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useSaveGoal } from './hooks'
import type { SavingsGoal } from '@/types/database'

const COLORS = ['#06b6d4', '#22c55e', '#6366f1', '#f59e0b', '#ec4899', '#a855f7']

export function GoalFormSheet({
  goal,
  initialAutoPercent = 0,
  onClose,
}: {
  goal?: SavingsGoal
  initialAutoPercent?: number
  onClose: () => void
}) {
  const save = useSaveGoal()
  const editing = Boolean(goal)
  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal?.target_amount?.toString() ?? '')
  const [current, setCurrent] = useState(goal?.current_amount?.toString() ?? '0')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [color, setColor] = useState(goal?.color ?? COLORS[0])
  const [autoPercent, setAutoPercent] = useState(initialAutoPercent.toString())

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !Number(target)) return
    try {
      await save.mutateAsync({
        id: goal?.id,
        values: {
          name: name.trim(),
          target_amount: Number(target),
          current_amount: Number(current) || 0,
          deadline: deadline || null,
          color,
        },
        autoPercent: Number(autoPercent) || 0,
      })
      toast.success(editing ? 'Meta actualizada' : 'Meta creada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar meta' : 'Nueva meta de ahorro'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fondo de emergencia" autoFocus required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Meta (CLP)">
            <Input type="number" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="500000" required />
          </Field>
          <Field label="Ahorrado">
            <Input type="number" inputMode="numeric" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
        </div>
        <Field label="Fecha objetivo">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Ahorro automático" hint="% de cada ingreso que se guarda aquí (0 = desactivado)">
          <Input type="number" inputMode="numeric" min="0" max="100" value={autoPercent} onChange={(e) => setAutoPercent(e.target.value)} placeholder="10" />
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={clsx('h-9 w-9 rounded-full border-2', color === c ? 'border-white' : 'border-transparent')}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <Button type="submit" fullWidth disabled={save.isPending} className="mt-1">
          {save.isPending ? 'Guardando…' : editing ? 'Guardar' : 'Crear meta'}
        </Button>
      </form>
    </Sheet>
  )
}
