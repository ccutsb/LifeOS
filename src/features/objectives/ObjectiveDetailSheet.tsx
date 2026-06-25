import { CheckCircle2, RotateCcw, Pencil, Flame, ListChecks } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { shortDate, dateKey } from '@/lib/dates'
import { useTasks, useCompleteTask } from '@/features/tasks/hooks'
import { useHabits, useHabitLogs } from '@/features/habits/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { useUpdateLifeGoal } from './hooks'
import { AREAS } from './areas'
import type { LifeGoal } from '@/types/database'

export function ObjectiveDetailSheet({
  goal,
  onClose,
  onEdit,
}: {
  goal: LifeGoal
  onClose: () => void
  onEdit: () => void
}) {
  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const complete = useCompleteTask()
  const update = useUpdateLifeGoal()

  const linkedTasks = tasks.filter((t) => t.goal_id === goal.id && t.status !== 'cancelled')
  const linkedHabits = habits.filter((h) => h.goal_id === goal.id)
  const doneTasks = linkedTasks.filter((t) => t.status === 'done').length
  const hasTasks = linkedTasks.length > 0
  const progress = hasTasks ? Math.round((doneTasks / linkedTasks.length) * 100) : null

  const today = dateKey()
  const Icon = AREAS[goal.area].icon

  const setStatus = async (status: 'active' | 'done') => {
    try {
      await update.mutateAsync({ id: goal.id, values: { status } })
      toast.success(status === 'done' ? '¡Objetivo cumplido! 🎉' : 'Objetivo reactivado')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title="Objetivo">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${goal.color}22` }}>
            <Icon className="h-6 w-6" style={{ color: goal.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">{goal.title}</h3>
            <p className="text-xs text-muted">
              {AREAS[goal.area].label}
              {goal.target_date ? ` · meta ${shortDate(goal.target_date)}` : ''}
            </p>
          </div>
          <button onClick={onEdit} className="rounded-lg p-2 text-muted active:bg-surface-2" aria-label="Editar">
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {goal.motivation && (
          <p className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">“{goal.motivation}”</p>
        )}

        {/* Progreso (derivado de las tareas vinculadas) */}
        {progress != null ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">Progreso</span>
              <span className="font-semibold">
                {doneTasks}/{linkedTasks.length} tareas · {progress}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted">
            Vincula tareas y hábitos a este objetivo (desde sus formularios) para medir tu avance.
          </p>
        )}

        {/* Tareas vinculadas */}
        {hasTasks && (
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="h-4 w-4 text-brand" /> Tareas
            </h4>
            <div className="flex flex-col gap-2">
              {linkedTasks.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={() => complete.mutate({ id: t.id, done: t.status !== 'done' })} />
              ))}
            </div>
          </section>
        )}

        {/* Hábitos vinculados */}
        {linkedHabits.length > 0 && (
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4 text-warning" /> Hábitos
            </h4>
            <ul className="flex flex-col gap-1.5">
              {linkedHabits.map((h) => {
                const doneToday = logs.some((l) => l.habit_id === h.id && l.log_date === today && l.done)
                return (
                  <li key={h.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5 text-sm">
                    <span>{h.icon ?? '⭐'}</span>
                    <span className="min-w-0 flex-1 truncate">{h.name}</span>
                    <span className={doneToday ? 'text-xs text-success' : 'text-xs text-muted'}>
                      {doneToday ? 'Hecho hoy' : 'Pendiente'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {goal.status === 'done' ? (
          <Button variant="secondary" fullWidth onClick={() => setStatus('active')}>
            <RotateCcw className="h-4 w-4" /> Reactivar objetivo
          </Button>
        ) : (
          <Button fullWidth onClick={() => setStatus('done')}>
            <CheckCircle2 className="h-4 w-4" /> Marcar como cumplido
          </Button>
        )}
      </div>
    </Sheet>
  )
}
