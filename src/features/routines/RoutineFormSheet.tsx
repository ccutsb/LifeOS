import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Plus, Trash2, X } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { WEEKDAYS_SHORT } from '@/lib/dates'
import { useSaveRoutine, useDeleteRoutine, type RoutineDraftItem } from './hooks'
import type { Routine, RoutineItem } from '@/types/database'

const TRIGGERS = [
  { value: 'morning', label: '☀️ Mañana' },
  { value: 'evening', label: '🌙 Noche' },
  { value: 'weekday', label: '📋 Día específico' },
]

export function RoutineFormSheet({
  routine,
  items = [],
  onClose,
}: {
  routine?: Routine
  items?: RoutineItem[]
  onClose: () => void
}) {
  const save = useSaveRoutine()
  const del = useDeleteRoutine()
  const editing = Boolean(routine)

  const [name, setName] = useState(routine?.name ?? '')
  const [trigger, setTrigger] = useState(routine?.trigger_kind ?? 'morning')
  const [weekdays, setWeekdays] = useState<number[]>(routine?.weekdays ?? [0, 1, 2, 3, 4, 5, 6])
  const [draft, setDraft] = useState<RoutineDraftItem[]>(
    items.length > 0 ? items.map((i) => ({ id: i.id, title: i.title })) : [{ title: '' }],
  )

  const toggleDay = (d: number) => {
    setWeekdays((prev) => {
      const set = new Set(prev)
      if (set.has(d)) set.delete(d)
      else set.add(d)
      if (set.size === 0) set.add(d)
      return [...set].sort((a, b) => a - b)
    })
  }

  const setItem = (idx: number, title: string) =>
    setDraft((prev) => prev.map((it, i) => (i === idx ? { ...it, title } : it)))
  const removeItem = (idx: number) => setDraft((prev) => prev.filter((_, i) => i !== idx))
  const addItem = () => setDraft((prev) => [...prev, { title: '' }])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cleanItems = draft.filter((i) => i.title.trim()).map((i) => ({ ...i, title: i.title.trim() }))
    if (!name.trim() || cleanItems.length === 0) {
      toast.error('Ponle nombre y al menos un paso')
      return
    }
    try {
      await save.mutateAsync({
        id: routine?.id,
        values: {
          name: name.trim(),
          icon: trigger === 'morning' ? '☀️' : trigger === 'evening' ? '🌙' : '📋',
          trigger_kind: trigger,
          weekdays,
        },
        items: cleanItems,
        originalItems: items,
      })
      toast.success(editing ? 'Rutina actualizada' : 'Rutina creada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    if (!routine || !confirm(`¿Eliminar la rutina "${routine.name}"?`)) return
    try {
      await del.mutateAsync(routine.id)
      toast.success('Rutina eliminada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar rutina' : 'Nueva rutina'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rutina de mañana" autoFocus required />
        </Field>

        <Field label="¿Cuándo?">
          <ChoiceChips options={TRIGGERS} value={trigger} onChange={(v) => setTrigger((v as typeof trigger) ?? 'morning')} />
        </Field>

        <Field label="Días">
          <div className="flex gap-1.5">
            {WEEKDAYS_SHORT.map((label, d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={clsx(
                  'h-9 w-9 rounded-full text-xs font-semibold transition',
                  weekdays.includes(d) ? 'bg-brand text-white' : 'bg-surface-2 text-muted',
                )}
              >
                {label[0]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Pasos (checklist)">
          <div className="flex flex-col gap-2">
            {draft.map((item, idx) => (
              <div key={item.id ?? `new-${idx}`} className="flex items-center gap-2">
                <Input
                  value={item.title}
                  onChange={(e) => setItem(idx, e.target.value)}
                  placeholder={idx === 0 ? 'Hacer la cama' : 'Otro paso…'}
                  className="!py-2.5"
                />
                {draft.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="rounded-lg p-2 text-muted active:bg-surface-2"
                    aria-label="Quitar paso"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1 self-start text-sm text-brand">
              <Plus className="h-4 w-4" /> Agregar paso
            </button>
          </div>
        </Field>

        <Button type="submit" fullWidth disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : editing ? 'Guardar' : 'Crear rutina'}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={remove} className="text-danger">
            <Trash2 className="h-4 w-4" /> Eliminar rutina
          </Button>
        )}
      </form>
    </Sheet>
  )
}
