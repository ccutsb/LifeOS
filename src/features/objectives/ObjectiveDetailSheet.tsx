import { useMemo, useState } from 'react'
import { Plus, Pencil, Target } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { shortDate } from '@/lib/dates'
import { scoreTask, isActive, isDoneToday } from '@/lib/planner'
import { useTasks, useCompleteTask } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { TaskFormSheet } from '@/features/tasks/TaskFormSheet'
import { useAreas } from '@/features/areas/hooks'
import { ObjectiveFormSheet } from './ObjectiveFormSheet'
import type { Objective, Task } from '@/types/database'

export function ObjectiveDetailSheet({
  objective,
  onClose,
}: {
  objective: Objective
  onClose: () => void
}) {
  const { data: tasks = [] } = useTasks()
  const { data: areas = [] } = useAreas()
  const complete = useCompleteTask()

  const [editObjective, setEditObjective] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState(false)

  const area = areas.find((a) => a.id === objective.area_id)
  const own = useMemo(() => tasks.filter((t) => t.objective_id === objective.id), [tasks, objective.id])
  const done = own.filter((t) => t.status === 'done').length
  const pending = own
    .filter((t) => isActive(t) && !isDoneToday(t))
    .map((t) => scoreTask(t, {}))
    .sort((a, b) => b.score - a.score)
  const total = own.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const nextStep = pending[0]?.task

  return (
    <Sheet open onClose={onClose} title={`🎯 ${objective.title}`}>
      <div className="flex flex-col gap-4">
        {/* Progreso */}
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {area ? `${area.icon} ${area.name}` : 'Sin área'}
              {objective.target_date && ` · meta: ${shortDate(objective.target_date)}`}
            </span>
            <span className="font-semibold">
              {done}/{total}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: area?.color ?? '#6366f1' }}
            />
          </div>
          {objective.status !== 'active' && (
            <p className="mt-2 text-xs text-warning">
              {objective.status === 'done' ? '✓ Objetivo logrado' : '⏸ En pausa (no empuja el plan)'}
            </p>
          )}
        </div>

        {/* Siguiente paso */}
        {nextStep && (
          <div className="rounded-xl border border-brand/40 bg-brand/10 px-3 py-2.5 text-sm">
            <span className="text-muted">Siguiente paso: </span>
            <span className="font-medium">{nextStep.title}</span>
            {nextStep.estimated_minutes != null && (
              <span className="text-muted"> (~{nextStep.estimated_minutes}m)</span>
            )}
          </div>
        )}

        {/* Tareas */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Tareas</h3>
            <button onClick={() => setNewTask(true)} className="flex items-center gap-1 text-sm text-brand">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
          {own.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">
              Divide el objetivo en pasos pequeños y concretos.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map(({ task }) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  accent={area?.color}
                  onToggle={() => complete.mutate({ task, done: true })}
                  onTap={() => setEditTask(task)}
                />
              ))}
              {own
                .filter((t) => t.status === 'done')
                .map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    accent={area?.color}
                    onToggle={() => complete.mutate({ task: t, done: false })}
                    onTap={() => setEditTask(t)}
                  />
                ))}
            </div>
          )}
        </section>

        <button
          onClick={() => setEditObjective(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted active:bg-surface-2"
        >
          <Pencil className="h-4 w-4" /> Editar objetivo
        </button>
      </div>

      {editObjective && <ObjectiveFormSheet objective={objective} onClose={() => setEditObjective(false)} />}
      {newTask && (
        <TaskFormSheet
          preset={{ objective_id: objective.id, area_id: objective.area_id ?? undefined }}
          onClose={() => setNewTask(false)}
        />
      )}
      {editTask && <TaskFormSheet task={editTask} onClose={() => setEditTask(null)} />}
    </Sheet>
  )
}
