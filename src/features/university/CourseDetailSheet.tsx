import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, MapPin } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { projectGrade, gradeColor } from '@/lib/grades'
import { relativeDue, WEEKDAYS_SHORT } from '@/lib/dates'
import { EvaluationFormSheet } from './EvaluationFormSheet'
import { ScheduleFormSheet } from './ScheduleFormSheet'
import {
  useEvaluations,
  useSchedule,
  useDeleteEvaluation,
  useDeleteSchedule,
  useDeleteCourse,
} from './hooks'
import type { Course, Evaluation } from '@/types/database'

export function CourseDetailSheet({
  course,
  onClose,
  onEdit,
}: {
  course: Course
  onClose: () => void
  onEdit: () => void
}) {
  const { data: allEvals = [] } = useEvaluations()
  const { data: allSchedule = [] } = useSchedule()
  const delEval = useDeleteEvaluation()
  const delSched = useDeleteSchedule()
  const delCourse = useDeleteCourse()

  const evals = allEvals.filter((e) => e.course_id === course.id)
  const schedule = allSchedule.filter((s) => s.course_id === course.id)
  const proj = projectGrade(evals, course.passing_grade, course.grade_max)

  const exempt =
    course.exemption_grade != null &&
    proj.currentAverage != null &&
    proj.currentAverage >= course.exemption_grade

  const [evalForm, setEvalForm] = useState<{ evaluation?: Evaluation } | null>(null)
  const [schedOpen, setSchedOpen] = useState(false)

  const removeCourse = async () => {
    if (!confirm(`¿Eliminar "${course.name}" y todas sus evaluaciones?`)) return
    try {
      await delCourse.mutateAsync(course.id)
      toast.success('Ramo eliminado')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={course.name}>
      <div className="flex flex-col gap-5">
        {/* Resumen de notas */}
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Promedio actual</p>
              <p className={`text-4xl font-bold ${gradeColor(proj.currentAverage, course.passing_grade)}`}>
                {proj.currentAverage?.toFixed(1) ?? '—'}
              </p>
            </div>
            {exempt && (
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                Eximido/a ✓
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <Stat label="Proyectada" value={proj.projectedFinal?.toFixed(1) ?? '—'} />
            <Stat
              label="Para aprobar"
              value={proj.remainingWeight > 0 && proj.neededToPass != null ? proj.neededToPass.toFixed(1) : '—'}
            />
            <Stat label="Calificado" value={`${proj.gradedWeight}%`} />
          </div>
          {!proj.canStillPass && proj.remainingWeight > 0 && (
            <p className="mt-3 text-center text-xs text-danger">
              Con la ponderación restante ya no alcanza para {course.passing_grade.toFixed(1)}. Enfócate en el examen/recuperación.
            </p>
          )}
          {proj.neededToPass != null && proj.canStillPass && proj.remainingWeight > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Necesitas promediar <b className="text-text">{proj.neededToPass.toFixed(1)}</b> en el {proj.remainingWeight}% que falta.
            </p>
          )}
        </div>

        {/* Evaluaciones */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Evaluaciones</h3>
            <button onClick={() => setEvalForm({})} className="flex items-center gap-1 text-sm text-brand">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
          {evals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">
              Sin evaluaciones todavía.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {evals.map((ev) => {
                const due = relativeDue(ev.due_at)
                return (
                  <li key={ev.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                    <button onClick={() => setEvalForm({ evaluation: ev })} className="min-w-0 flex-1 text-left">
                      <p className="truncate font-medium">{ev.title}</p>
                      <p className="text-xs text-muted">
                        {ev.weight}%{due ? ` · ${due.label}` : ''}
                      </p>
                    </button>
                    <span className={`text-lg font-bold ${gradeColor(ev.grade, course.passing_grade)}`}>
                      {ev.grade?.toFixed(1) ?? '—'}
                    </span>
                    <button
                      onClick={() => delEval.mutate(ev.id)}
                      className="rounded-lg p-1.5 text-muted active:bg-surface-2"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Horario */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Horario</h3>
            <button onClick={() => setSchedOpen(true)} className="flex items-center gap-1 text-sm text-brand">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
          {schedule.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">
              Sin clases agendadas.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {schedule.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm">
                  <span className="w-10 font-semibold text-brand">{WEEKDAYS_SHORT[s.weekday]}</span>
                  <span className="flex items-center gap-1 text-muted">
                    <Clock className="h-3.5 w-3.5" /> {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </span>
                  {s.room && (
                    <span className="flex items-center gap-1 text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {s.room}
                    </span>
                  )}
                  <button
                    onClick={() => delSched.mutate(s.id)}
                    className="ml-auto rounded-lg p-1.5 text-muted active:bg-surface-2"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Editar ramo
          </Button>
          <Button variant="danger" onClick={removeCourse} disabled={delCourse.isPending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {evalForm && (
        <EvaluationFormSheet courseId={course.id} evaluation={evalForm.evaluation} onClose={() => setEvalForm(null)} />
      )}
      {schedOpen && <ScheduleFormSheet courseId={course.id} onClose={() => setSchedOpen(false)} />}
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-2">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}
