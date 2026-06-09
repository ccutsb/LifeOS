import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useCreateCourse, useUpdateCourse } from './hooks'
import type { Course } from '@/types/database'

const COLORS = ['#6366f1', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6']

export function CourseFormSheet({ onClose, course }: { onClose: () => void; course?: Course }) {
  const create = useCreateCourse()
  const update = useUpdateCourse()
  const editing = Boolean(course)

  const [name, setName] = useState(course?.name ?? '')
  const [code, setCode] = useState(course?.code ?? '')
  const [teacher, setTeacher] = useState(course?.teacher ?? '')
  const [color, setColor] = useState(course?.color ?? COLORS[0])
  const [credits, setCredits] = useState(course?.credits?.toString() ?? '')
  const [target, setTarget] = useState(course?.target_grade?.toString() ?? '5.0')
  const [passing, setPassing] = useState(course?.passing_grade?.toString() ?? '4.0')
  const [exemption, setExemption] = useState(course?.exemption_grade?.toString() ?? '')

  const saving = create.isPending || update.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const values = {
      name: name.trim(),
      code: code.trim() || null,
      teacher: teacher.trim() || null,
      color,
      credits: credits ? Number(credits) : null,
      target_grade: target ? Number(target) : null,
      passing_grade: passing ? Number(passing) : 4.0,
      exemption_grade: exemption ? Number(exemption) : null,
    }
    try {
      if (editing && course) {
        await update.mutateAsync({ id: course.id, values })
        toast.success('Ramo actualizado')
      } else {
        await create.mutateAsync(values)
        toast.success('Ramo agregado')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar ramo' : 'Nuevo ramo'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre del ramo">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cálculo II" autoFocus required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAT1620" />
          </Field>
          <Field label="Créditos">
            <Input type="number" inputMode="numeric" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="10" />
          </Field>
        </div>
        <Field label="Profesor(a)">
          <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Opcional" />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={clsx('h-9 w-9 rounded-full border-2 transition', color === c ? 'border-white' : 'border-transparent')}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Meta">
            <Input type="number" step="0.1" min="1" max="7" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Field label="Aprobar">
            <Input type="number" step="0.1" min="1" max="7" value={passing} onChange={(e) => setPassing(e.target.value)} />
          </Field>
          <Field label="Eximición">
            <Input type="number" step="0.1" min="1" max="7" value={exemption} onChange={(e) => setExemption(e.target.value)} placeholder="—" />
          </Field>
        </div>

        <Button type="submit" fullWidth disabled={saving} className="mt-1">
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar ramo'}
        </Button>
      </form>
    </Sheet>
  )
}
