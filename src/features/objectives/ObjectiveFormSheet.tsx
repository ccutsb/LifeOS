import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useCreateLifeGoal, useUpdateLifeGoal, useDeleteLifeGoal } from './hooks'
import { AREAS, AREA_OPTIONS } from './areas'
import type { LifeGoal, LifeGoalArea } from '@/types/database'

export function ObjectiveFormSheet({ goal, onClose }: { goal?: LifeGoal; onClose: () => void }) {
  const create = useCreateLifeGoal()
  const update = useUpdateLifeGoal()
  const remove = useDeleteLifeGoal()
  const editing = Boolean(goal)

  const [title, setTitle] = useState(goal?.title ?? '')
  const [area, setArea] = useState<LifeGoalArea>(goal?.area ?? 'academico')
  const [motivation, setMotivation] = useState(goal?.motivation ?? '')
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '')

  const saving = create.isPending || update.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    // El color sigue al área (sin fricción: una decisión menos).
    const values = {
      title: title.trim(),
      area,
      color: AREAS[area].color,
      motivation: motivation.trim() || null,
      target_date: targetDate || null,
    }
    try {
      if (editing && goal) {
        await update.mutateAsync({ id: goal.id, values })
        toast.success('Objetivo actualizado')
      } else {
        await create.mutateAsync(values)
        toast.success('Objetivo creado')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const onDelete = async () => {
    if (!goal) return
    if (!window.confirm(`¿Eliminar el objetivo "${goal.title}"? Las tareas y hábitos vinculados se conservan.`)) return
    try {
      await remove.mutateAsync(goal.id)
      toast.success('Objetivo eliminado')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar objetivo' : 'Nuevo objetivo de vida'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="¿Qué quieres lograr?">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Aprobar el semestre con promedio 5.5"
            autoFocus
            required
          />
        </Field>

        <Field label="Área de vida">
          <div className="grid grid-cols-4 gap-2">
            {AREA_OPTIONS.map((o) => {
              const Icon = AREAS[o.value as LifeGoalArea].icon
              const active = area === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setArea(o.value as LifeGoalArea)}
                  className={clsx(
                    'flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[11px] transition',
                    active ? 'border-brand bg-brand/10 text-text' : 'border-border bg-surface-2 text-muted',
                  )}
                >
                  <Icon className="h-5 w-5" style={{ color: active ? AREAS[o.value as LifeGoalArea].color : undefined }} />
                  {o.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Tu porqué" hint="La motivación que te recuerda por qué importa">
          <Textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={2}
            placeholder="Para titularme a tiempo y empezar a trabajar en lo que me gusta"
          />
        </Field>

        <Field label="Fecha objetivo (opcional)">
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>

        <Button type="submit" fullWidth disabled={saving} className="mt-1">
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear objetivo'}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" fullWidth onClick={onDelete} className="text-danger">
            Eliminar objetivo
          </Button>
        )}
      </form>
    </Sheet>
  )
}
