import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Star, Clock } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { toDateTimeLocal, fromDateTimeLocal } from '@/lib/dates'
import { useCourses } from '@/features/university/hooks'
import { useCreateTask, useUpdateTask } from './hooks'
import type { Task } from '@/types/database'

export function TaskFormSheet({ task, onClose }: { task?: Task; onClose: () => void }) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const { data: courses = [] } = useCourses()
  const editing = Boolean(task)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [courseId, setCourseId] = useState(task?.course_id ?? '')
  const [due, setDue] = useState(toDateTimeLocal(task?.due_at ?? null))
  const [important, setImportant] = useState(task?.is_important ?? false)
  const [urgent, setUrgent] = useState(task?.is_urgent ?? false)
  const [nextAction, setNextAction] = useState(task?.next_action ?? '')

  const saving = create.isPending || update.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const status = editing ? (task!.status === 'inbox' ? 'pending' : task!.status) : 'pending'
    const values = {
      title: title.trim(),
      description: description.trim() || null,
      course_id: courseId || null,
      due_at: fromDateTimeLocal(due),
      is_important: important,
      is_urgent: urgent,
      next_action: nextAction.trim() || null,
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
          <Field label="Fecha límite">
            <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Toggle active={important} onClick={() => setImportant((v) => !v)} icon={<Star className="h-4 w-4" />} label="Importante" tone="brand" />
          <Toggle active={urgent} onClick={() => setUrgent((v) => !v)} icon={<Clock className="h-4 w-4" />} label="Urgente" tone="danger" />
        </div>

        <Field label="Notas">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Opcional" />
        </Field>

        <Button type="submit" fullWidth disabled={saving} className="mt-1">
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear tarea'}
        </Button>
      </form>
    </Sheet>
  )
}

function Toggle({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  tone: 'brand' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition',
        active
          ? tone === 'brand'
            ? 'border-brand bg-brand/15 text-brand'
            : 'border-danger bg-danger/15 text-danger'
          : 'border-border bg-surface-2 text-muted',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
