import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Plus, CheckSquare, ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { scoreTask, isActive, isDoneToday } from '@/lib/planner'
import { usePlannerContext } from '@/hooks/usePlannerContext'
import { useAreas } from '@/features/areas/hooks'
import { useTasks, useCompleteTask } from './hooks'
import { TaskRow } from './TaskRow'
import { TaskFormSheet } from './TaskFormSheet'
import type { Task } from '@/types/database'

export function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: areas = [] } = useAreas()
  const complete = useCompleteTask()
  const plannerCtx = usePlannerContext()

  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [showNew, setShowNew] = useState(false)

  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas])

  // Lista inteligente: el planner ordena, tú solo ejecutas
  const smartList = useMemo(() => {
    return tasks
      .filter((t) => isActive(t) && !isDoneToday(t))
      .filter((t) => !areaFilter || t.area_id === areaFilter)
      .map((t) => scoreTask(t, plannerCtx))
      .sort((a, b) => b.score - a.score)
  }, [tasks, plannerCtx, areaFilter])

  const doneList = useMemo(
    () =>
      tasks
        .filter((t) => (t.status === 'done' || isDoneToday(t)) && (!areaFilter || t.area_id === areaFilter))
        .slice(0, 30),
    [tasks, areaFilter],
  )

  const toggle = (t: Task) =>
    complete.mutate({ task: t, done: !(t.status === 'done' || isDoneToday(t)) })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tareas"
        subtitle="Ordenadas por lo que más importa"
        action={
          <Button onClick={() => setShowNew(true)} className="!px-3" aria-label="Nueva tarea">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {/* Filtro por área */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={!areaFilter} onClick={() => setAreaFilter(null)} label="Todas" />
        {areas
          .filter((a) => a.is_active)
          .map((a) => (
            <FilterChip
              key={a.id}
              active={areaFilter === a.id}
              onClick={() => setAreaFilter(areaFilter === a.id ? null : a.id)}
              label={`${a.icon} ${a.name}`}
            />
          ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : smartList.length === 0 && doneList.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-10 w-10" />}
          title="Nada pendiente aquí"
          hint="Captura lo que tengas en la cabeza con el botón + de abajo."
        />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {smartList.map(({ task }) => {
              const area = task.area_id ? areaById.get(task.area_id) : undefined
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  accent={area?.color}
                  areaIcon={area?.icon}
                  onToggle={() => toggle(task)}
                  onTap={() => setEditTask(task)}
                />
              )
            })}
          </div>

          {doneList.length > 0 && (
            <div className="mt-5">
              <button
                onClick={() => setShowDone((v) => !v)}
                className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-muted"
              >
                Hechas ({doneList.length})
                <ChevronDown className={clsx('h-4 w-4 transition', showDone && 'rotate-180')} />
              </button>
              {showDone && (
                <div className="flex flex-col gap-2">
                  {doneList.map((t) => {
                    const area = t.area_id ? areaById.get(t.area_id) : undefined
                    return (
                      <TaskRow
                        key={t.id}
                        task={t}
                        accent={area?.color}
                        areaIcon={area?.icon}
                        onToggle={() => toggle(t)}
                        onTap={() => setEditTask(t)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showNew && <TaskFormSheet onClose={() => setShowNew(false)} />}
      {editTask && <TaskFormSheet task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
        active ? 'border-brand bg-brand/15 text-text' : 'border-border bg-surface text-muted',
      )}
    >
      {label}
    </button>
  )
}
