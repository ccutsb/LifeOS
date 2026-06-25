import { useState } from 'react'
import { Plus, Target, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { shortDate } from '@/lib/dates'
import { useTasks } from '@/features/tasks/hooks'
import { useHabits } from '@/features/habits/hooks'
import { useLifeGoals } from './hooks'
import { ObjectiveFormSheet } from './ObjectiveFormSheet'
import { ObjectiveDetailSheet } from './ObjectiveDetailSheet'
import { AREAS } from './areas'
import type { LifeGoal } from '@/types/database'

export function ObjectivesPage() {
  const { data: goals = [], isLoading } = useLifeGoals()
  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()

  const [showNew, setShowNew] = useState(false)
  const [detail, setDetail] = useState<LifeGoal | null>(null)
  const [edit, setEdit] = useState<LifeGoal | null>(null)

  const progressOf = (goalId: string) => {
    const linked = tasks.filter((t) => t.goal_id === goalId && t.status !== 'cancelled')
    if (linked.length === 0) return null
    return Math.round((linked.filter((t) => t.status === 'done').length / linked.length) * 100)
  }
  const linkCount = (goalId: string) =>
    tasks.filter((t) => t.goal_id === goalId).length + habits.filter((h) => h.goal_id === goalId).length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Objetivos"
        subtitle="Tu norte: conecta tareas y hábitos"
        action={
          <Button onClick={() => setShowNew(true)} className="!px-3" aria-label="Nuevo objetivo">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-10 w-10" />}
          title="Aún no tienes objetivos"
          hint="Define hacia dónde vas (ej. 'Aprobar el semestre', 'Ahorrar para un viaje') y vincula tus tareas y hábitos para verlo avanzar."
          action={
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Nuevo objetivo
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {goals.map((g) => {
            const pct = progressOf(g.id)
            const Icon = AREAS[g.area].icon
            const isDone = g.status === 'done'
            return (
              <li key={g.id}>
                <button
                  onClick={() => setDetail(g)}
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-left active:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${g.color}22` }}>
                      <Icon className="h-5 w-5" style={{ color: g.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${isDone ? 'text-muted line-through' : ''}`}>{g.title}</p>
                      <p className="text-xs text-muted">
                        {AREAS[g.area].label}
                        {g.target_date ? ` · ${shortDate(g.target_date)}` : ''}
                        {` · ${linkCount(g.id)} vinculados`}
                      </p>
                    </div>
                    {isDone && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
                  </div>
                  {pct != null && !isDone && (
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showNew && <ObjectiveFormSheet onClose={() => setShowNew(false)} />}
      {edit && <ObjectiveFormSheet goal={edit} onClose={() => setEdit(null)} />}
      {detail && (
        <ObjectiveDetailSheet
          goal={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEdit(detail)
            setDetail(null)
          }}
        />
      )}
    </div>
  )
}
