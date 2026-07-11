import { useState, type FormEvent } from 'react'
import { Star, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { toDateTimeLocal, fromDateTimeLocal } from '@/lib/dates'
import { firstDue } from '@/lib/recurrence'
import { useCourses } from '@/features/university/hooks'
import { useAreas } from '@/features/areas/hooks'
import { useObjectives } from '@/features/objectives/hooks'
import { RecurrencePicker } from '@/features/capture/RecurrencePicker'
import { useCreateTask, useUpdateTask, useDeleteTask } from './hooks'
import type { Energy, Recurrence, Task } from '@/types/database'

const DURATIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
]
const ENERGIES: { value: Energy; label: string }[] = [
  { value: 'low', label: '🪫 Baja' },
  { value: 'medium', label: '◐ Media' },
  { value: 'high', label: '🔋 Alta' },
]

export function TaskFormSheet({
  task,
  preset,
  onClose,
}: {
  task?: Task
  preset?: { area_id?: string; objective_id?: string }
  onClose: () => void
}) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const del = useDeleteTask()
  const { data: courses = [] } = useCourses()
  const { data: areas = [] } = useAreas()
  const { data: objectives = [] } = useObjectives()
  const editing = Boolean(task)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [areaId, setAreaId] = useState(task?.area_id ?? preset?.area_id ?? '')
  const [objectiveId, setObjectiveId] = useState(task?.objective_id ?? preset?.objective_id ?? '')
  const [courseId, setCourseId] = useState(task?.course_id ?? '')
  const [due, setDue] = useState(toDateTimeLocal(task?.due_at ?? null))
  const [important, setImportant] = useState(task?.is_important ?? false)
  const [nextAction, setNextAction] = useState(task?.next_action ?? '')
  const [minutes, setMinutes] = useState<number | null>(task?.estimated_minutes ?? null)
  const [energy, setEnergy] = useState<Energy | null>(task?.energy ?? null)
  const [recurrence, setRecurrence] = useState<Recurrence | null>(task?.recurrence ?? null)

  const saving = create.isPending || update.isPending
  const universityArea = areas.find((a) => a.kind === 'university')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const status = editing ? (task!.status === 'inbox' ? 'pending' : task!.status) : 'pending'
    // La recurrencia manda sobre la fecha manual; un ramo sin área cae en Universidad
    const due_at = recurrence ? firstDue(recurrence).toISOString() : fromDateTimeLocal(due)
    const objectiveArea = objectiveId ? objectives.find((o) => o.id === objectiveId)?.area_id : null
    const area_id = areaId || objectiveArea || (courseId ? (universityArea?.id ?? null) : null)
    const values = {
      title: title.trim(),
      description: description.trim() || null,
      area_id,
      objective_id: objectiveId || null,
      course_id: courseId || null,
      due_at,
      is_important: important,
      next_action: nextAction.trim() || null,
      estimated_minutes: minutes,
      energy,
      recurrence,
      status,
    }
    try {
      if (editing && task) {
        await update.mutateAsync({ id: task.id, values })
        toast.success('Tarea actualizada')
      } else {
        await create.mutateAsync(values)
        toast.success('Tarea creada')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    if (!task || !confirm(`¿Eliminar "${task.title}"?`)) return
    try {
      await del.mutateAsync(task.id)
      toast.success('Tarea eliminada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar tarea' : 'Nueva tarea'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="¿Qué hay que hacer?">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entregar informe de lab" autoFocus required />
        </Field>

        <Field label="Próxima acción (GTD)" hint="El primer paso físico y concreto">
          <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Abrir la plantilla y escribir el título" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Área">
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Sin área</option>
              {areas
                .filter((a) => a.is_active || a.id === areaId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Ramo">
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Sin ramo</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {(objectives.some((o) => o.status === 'active') || objectiveId) && (
          <Field label="Objetivo" hint="Las tareas de un objetivo activo suben en el plan">
            <Select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
              <option value="">Sin objetivo</option>
              {objectives
                .filter((o) => o.status === 'active' || o.id === objectiveId)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    🎯 {o.title}
                  </option>
                ))}
            </Select>
          </Field>
        )}

        <Field label="¿Se repite?">
          <RecurrencePicker value={recurrence} onChange={setRecurrence} />
        </Field>

        {!recurrence && (
          <Field label="Fecha límite">
            <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        )}

        <Field label="Duración estimada">
          <ChoiceChips options={DURATIONS} value={minutes} onChange={setMinutes} allowDeselect />
        </Field>

        <Field label="Energía que requiere">
          <ChoiceChips options={ENERGIES} value={energy} onChange={setEnergy} allowDeselect />
        </Field>

        <button
          type="button"
          onClick={() => setImportant((v) => !v)}
          className={clsx(
            'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition',
            important ? 'border-brand bg-brand/15 text-brand' : 'border-border bg-surface-2 text-muted',
          )}
        >
          <Star className="h-4 w-4" />
          {important ? 'Importante ✓' : 'Marcar como importante'}
        </button>

        <Field label="Notas">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Opcional" />
        </Field>

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear tarea'}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={remove} className="text-danger">
            <Trash2 className="h-4 w-4" /> Eliminar tarea
          </Button>
        )}
      </form>
    </Sheet>
  )
}
