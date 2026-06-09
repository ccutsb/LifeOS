import { useState } from 'react'
import { Plus, GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { projectGrade, gradeColor } from '@/lib/grades'
import { useCourses, useEvaluations } from './hooks'
import { CourseFormSheet } from './CourseFormSheet'
import { CourseDetailSheet } from './CourseDetailSheet'

export function UniversityPage() {
  const { data: courses = [], isLoading } = useCourses()
  const { data: evals = [] } = useEvaluations()

  const [formOpen, setFormOpen] = useState(false)
  const [formCourseId, setFormCourseId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const formCourse = formCourseId ? courses.find((c) => c.id === formCourseId) : undefined
  const detailCourse = detailId ? courses.find((c) => c.id === detailId) : undefined

  const openNew = () => {
    setFormCourseId(null)
    setFormOpen(true)
  }
  const openEdit = (id: string) => {
    setFormCourseId(id)
    setFormOpen(true)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Universidad"
        subtitle="Ramos, evaluaciones y notas"
        action={
          <Button onClick={openNew} className="!px-3" aria-label="Agregar ramo">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10" />}
          title="Aún no hay ramos"
          hint="Agrega tu primer ramo para llevar tus notas, entregas y horario."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Agregar ramo
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {courses.map((c) => {
            const proj = projectGrade(
              evals.filter((e) => e.course_id === c.id),
              c.passing_grade,
              c.grade_max,
            )
            return (
              <li key={c.id}>
                <Card
                  onClick={() => setDetailId(c.id)}
                  className="flex cursor-pointer items-center gap-3 active:bg-surface-2"
                >
                  <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {c.code || 'Sin código'} · {proj.gradedWeight}% calificado
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${gradeColor(proj.currentAverage, c.passing_grade)}`}>
                      {proj.currentAverage?.toFixed(1) ?? '—'}
                    </p>
                    {!proj.canStillPass && proj.remainingWeight > 0 && (
                      <p className="text-[10px] font-semibold text-danger">en riesgo</p>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {formOpen && <CourseFormSheet course={formCourse} onClose={() => setFormOpen(false)} />}
      {detailCourse && (
        <CourseDetailSheet
          course={detailCourse}
          onClose={() => setDetailId(null)}
          onEdit={() => openEdit(detailCourse.id)}
        />
      )}
    </div>
  )
}
