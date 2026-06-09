import { useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { toDateTimeLocal, fromDateTimeLocal } from '@/lib/dates'
import { useCreateEvaluation, useUpdateEvaluation } from './hooks'
import type { Evaluation, EvaluationType } from '@/types/database'

const TYPES: { value: EvaluationType; label: string }[] = [
  { value: 'prueba', label: 'Prueba' },
  { value: 'examen', label: 'Examen' },
  { value: 'control', label: 'Control' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'tarea', label: 'Tarea' },
  { value: 'otro', label: 'Otro' },
]

export function EvaluationFormSheet({
  courseId,
  evaluation,
  onClose,
}: {
  courseId: string
  evaluation?: Evaluation
  onClose: () => void
}) {
  const create = useCreateEvaluation()
  const update = useUpdateEvaluation()
  const editing = Boolean(evaluation)

  const [title, setTitle] = useState(evaluation?.title ?? '')
  const [type, setType] = useState<EvaluationType>(evaluation?.type ?? 'prueba')
  const [weight, setWeight] = useState(evaluation?.weight?.toString() ?? '')
  const [grade, setGrade] = useState(evaluation?.grade?.toString() ?? '')
  const [dueAt, setDueAt] = useState(toDateTimeLocal(evaluation?.due_at ?? null))

  const saving = create.isPending || update.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const values = {
      course_id: courseId,
      title: title.trim(),
      type,
      weight: weight ? Number(weight) : 0,
      grade: grade ? Number(grade) : null,
      due_at: fromDateTimeLocal(dueAt),
    }
    try {
      if (editing && evaluation) {
        await update.mutateAsync({ id: evaluation.id, values })
        toast.success('Evaluación actualizada')
      } else {
        await create.mutateAsync(values)
        toast.success('Evaluación agregada')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar evaluación' : 'Nueva evaluación'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Título">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prueba 1" autoFocus required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={type} onChange={(e) => setType(e.target.value as EvaluationType)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ponderación %">
            <Input type="number" inputMode="numeric" min="0" max="100" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="30" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nota (1.0–7.0)" hint="Déjalo vacío si aún no rindes">
            <Input type="number" step="0.1" min="1" max="7" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="—" />
          </Field>
          <Field label="Fecha">
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" fullWidth disabled={saving} className="mt-1">
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Agregar evaluación'}
        </Button>
      </form>
    </Sheet>
  )
}
