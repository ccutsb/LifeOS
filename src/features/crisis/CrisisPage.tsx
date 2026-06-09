import { useMemo } from 'react'
import { LifeBuoy, CalendarPlus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { isPast, isToday } from '@/lib/dates'
import { useCourses } from '@/features/university/hooks'
import { useTasks, useCompleteTask, useUpdateTask } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import type { Task } from '@/types/database'

export function CrisisPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: courses = [] } = useCourses()
  const complete = useCompleteTask()
  const update = useUpdateTask()

  const colorOf = (id: string | null) => (id ? courses.find((c) => c.id === id)?.color : undefined)

  // Crítico = activo y vencido o que vence hoy. Ordenado: importante primero, luego más antiguo.
  const critical = useMemo(() => {
    const active = tasks.filter((t) => ['inbox', 'pending', 'in_progress'].includes(t.status) && t.due_at)
    return active
      .filter((t) => {
        const d = new Date(t.due_at as string)
        return isPast(d) || isToday(d)
      })
      .sort(
        (a, b) =>
          Number(b.is_important) - Number(a.is_important) ||
          new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime(),
      )
  }, [tasks])

  const postpone = (t: Task) => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    update.mutate({ id: t.id, values: { due_at: d.toISOString() } })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (critical.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Modo Crisis" subtitle="Cuando todo se acumula, respira y enfócate" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success/5 px-6 py-12 text-center">
          <ShieldCheck className="h-12 w-12 text-success" />
          <p className="text-lg font-semibold">Todo bajo control</p>
          <p className="max-w-xs text-sm text-muted">
            No tienes tareas vencidas ni urgentes para hoy. Aprovecha para adelantar algo de la matriz “Agendar”.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Modo Crisis" subtitle={`${critical.length} ${critical.length === 1 ? 'tarea crítica' : 'tareas críticas'}`} />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4">
        <LifeBuoy className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
        <p className="text-sm">
          Respira. <b>Una a la vez.</b> Haz solo la <b>#1</b>; el resto puede esperar o posponerse. No mires la lista
          completa, mira el siguiente paso.
        </p>
      </div>

      <h3 className="mb-2 font-semibold">Plan de rescate</h3>
      <ol className="flex flex-col gap-2">
        {critical.map((t, i) => (
          <li key={t.id} className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-danger/20 text-sm font-bold text-danger">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <TaskRow task={t} accent={colorOf(t.course_id)} onToggle={() => complete.mutate({ id: t.id, done: true })} />
            </div>
            <button
              onClick={() => postpone(t)}
              aria-label="Posponer a mañana"
              className="rounded-lg p-2 text-muted active:bg-surface-2"
            >
              <CalendarPlus className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
