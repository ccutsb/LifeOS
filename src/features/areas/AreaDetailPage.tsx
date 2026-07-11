import { useMemo, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Target } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { isActive, isDoneToday, scoreTask } from '@/lib/planner'
import { usePlannerContext } from '@/hooks/usePlannerContext'
import { useTasks, useCompleteTask } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { TaskFormSheet } from '@/features/tasks/TaskFormSheet'
import { useObjectives } from '@/features/objectives/hooks'
import { ObjectiveFormSheet } from '@/features/objectives/ObjectiveFormSheet'
import { ObjectiveDetailSheet } from '@/features/objectives/ObjectiveDetailSheet'
import { useAreas } from './hooks'
import { AreaFormSheet } from './AreaFormSheet'
import type { Objective, Task } from '@/types/database'

export function AreaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: areas = [], isLoading } = useAreas()
  const { data: tasks = [] } = useTasks()
  const { data: objectives = [] } = useObjectives()
  const complete = useCompleteTask()
  const plannerCtx = usePlannerContext()

  const [editArea, setEditArea] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [newObjective, setNewObjective] = useState(false)
  const [openObjective, setOpenObjective] = useState<Objective | null>(null)

  const area = areas.find((a) => a.id === id)

  const pending = useMemo(() => {
    if (!area) return []
    return tasks
      .filter((t) => t.area_id === area.id && isActive(t) && !isDoneToday(t))
      .map((t) => scoreTask(t, plannerCtx))
      .sort((a, b) => b.score - a.score)
  }, [tasks, area, plannerCtx])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!area) return <Navigate to="/areas" replace />
  if (area.kind === 'university') return <Navigate to="/universidad" replace />

  const areaObjectives = objectives.filter((o) => o.area_id === area.id && o.status !== 'dropped')
  const progressOf = (o: Objective) => {
    const own = tasks.filter((t) => t.objective_id === o.id)
    const done = own.filter((t) => t.status === 'done').length
    return { done, total: own.length }
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate('/areas')} className="rounded-full p-2 text-muted active:bg-surface" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ backgroundColor: `${area.color}22` }}>
          {area.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{area.name}</h1>
          <p className="text-xs text-muted">
            {area.is_active ? `${pending.length} pendientes` : '💤 área en pausa'}
            {area.priority > 0 && ' · ★ prioritaria'}
          </p>
        </div>
        <button onClick={() => setEditArea(true)} className="rounded-full p-2 text-muted active:bg-surface" aria-label="Editar área">
          <Pencil className="h-5 w-5" />
        </button>
      </header>

      {/* Objetivos del área */}
      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4" style={{ color: area.color }} /> Objetivos
          </h3>
          <button onClick={() => setNewObjective(true)} className="flex items-center gap-1 text-sm text-brand">
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
        {areaObjectives.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted">
            Una meta grande dividida en pasos pequeños. Ej: "Certificación AWS".
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {areaObjectives.map((o) => {
              const { done, total } = progressOf(o)
              const pct = total > 0 ? (done / total) * 100 : 0
              return (
                <li key={o.id}>
                  <button
                    onClick={() => setOpenObjective(o)}
                    className="w-full rounded-2xl border border-border bg-surface p-3 text-left active:bg-surface-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        🎯 {o.title}
                        {o.status === 'done' && ' ✓'}
                        {o.status === 'paused' && ' ⏸'}
                      </span>
                      <span className="text-muted">
                        {done}/{total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: area.color }} />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Tareas del área */}
      <section>
        <h3 className="mb-2 font-semibold">Tareas</h3>
        {pending.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl">{area.icon}</span>}
            title="Nada pendiente en esta área"
            hint="Captura una tarea con el botón + y asígnala aquí."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map(({ task }) => (
              <TaskRow
                key={task.id}
                task={task}
                accent={area.color}
                onToggle={() => complete.mutate({ task, done: true })}
                onTap={() => setEditTask(task)}
              />
            ))}
          </div>
        )}
      </section>

      {editArea && <AreaFormSheet area={area} onClose={() => setEditArea(false)} />}
      {editTask && <TaskFormSheet task={editTask} onClose={() => setEditTask(null)} />}
      {newObjective && <ObjectiveFormSheet presetAreaId={area.id} onClose={() => setNewObjective(false)} />}
      {openObjective && <ObjectiveDetailSheet objective={openObjective} onClose={() => setOpenObjective(null)} />}
    </div>
  )
}
