import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useAreas } from '@/features/areas/hooks'
import { objectiveExampleFor } from '@/features/areas/examples'
import { useCreateObjective, useUpdateObjective, useDeleteObjective } from './hooks'
import type { Objective } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'En pausa' },
  { value: 'done', label: 'Logrado ✓' },
]

export function ObjectiveFormSheet({
  objective,
  presetAreaId,
  onClose,
}: {
  objective?: Objective
  presetAreaId?: string
  onClose: () => void
}) {
  const { data: areas = [] } = useAreas()
  const create = useCreateObjective()
  const update = useUpdateObjective()
  const del = useDeleteObjective()
  const editing = Boolean(objective)

  const [title, setTitle] = useState(objective?.title ?? '')
  const [areaId, setAreaId] = useState(objective?.area_id ?? presetAreaId ?? '')
  const [targetDate, setTargetDate] = useState(objective?.target_date ?? '')
  const [description, setDescription] = useState(objective?.description ?? '')
  const [status, setStatus] = useState(objective?.status ?? 'active')

  const saving = create.isPending || update.isPending
  const selectedArea = areas.find((a) => a.id === areaId)
  const titlePlaceholder = objectiveExampleFor(selectedArea?.kind)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const values = {
      title: title.trim(),
      area_id: areaId || null,
      target_date: targetDate || null,
      description: description.trim() || null,
      status,
    }
    try {
      if (editing && objective) {
        await update.mutateAsync({ id: objective.id, values })
        toast.success('Objetivo actualizado')
      } else {
        await create.mutateAsync(values)
        toast.success('Objetivo creado 🎯')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    if (!objective) return
    if (!confirm(`¿Eliminar "${objective.title}"? Sus tareas quedarán sueltas (no se borran).`)) return
    try {
      await del.mutateAsync(objective.id)
      toast.success('Objetivo eliminado')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar objetivo' : 'Nuevo objetivo'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="¿Qué quieres lograr?">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={titlePlaceholder} autoFocus required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Área">
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
              <option value="">Elige…</option>
              {areas
                .filter((a) => a.is_active || a.id === areaId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Fecha meta">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
        </div>

        {editing && (
          <Field label="Estado">
            <ChoiceChips
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus((v as typeof status) ?? 'active')}
            />
          </Field>
        )}

        <Field label="Notas">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Opcional" />
        </Field>

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear objetivo'}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={remove} className="text-danger">
            <Trash2 className="h-4 w-4" /> Eliminar objetivo
          </Button>
        )}
      </form>
    </Sheet>
  )
}
