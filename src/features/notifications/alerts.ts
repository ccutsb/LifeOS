import { isPast, isToday, isTomorrow } from '@/lib/dates'
import { useTasks } from '@/features/tasks/hooks'
import { useCourses, useEvaluations, useSchedule } from '@/features/university/hooks'
import type { Course, CourseSchedule, Evaluation, Task } from '@/types/database'

export type AlertSeverity = 'high' | 'medium' | 'low'
export interface Alert {
  id: string
  title: string
  body?: string
  severity: AlertSeverity
  to: string
}

export function buildAlerts(opts: {
  tasks: Task[]
  evals: Evaluation[]
  schedule: CourseSchedule[]
  courses: Course[]
}): Alert[] {
  const { tasks, evals, schedule, courses } = opts
  const nameOf = (id: string | null) => (id ? courses.find((c) => c.id === id)?.name : undefined)
  const out: Alert[] = []

  for (const t of tasks.filter((t) => ['inbox', 'pending', 'in_progress'].includes(t.status))) {
    if (!t.due_at) continue
    const d = new Date(t.due_at)
    if (isPast(d) && !isToday(d)) out.push({ id: `task-${t.id}`, title: `Tarea vencida: ${t.title}`, severity: 'high', to: '/crisis' })
    else if (isToday(d)) out.push({ id: `task-${t.id}`, title: `Vence hoy: ${t.title}`, severity: 'medium', to: '/tareas' })
  }

  for (const e of evals) {
    if (e.grade != null || !e.due_at) continue
    const d = new Date(e.due_at)
    if (isToday(d)) out.push({ id: `eval-${e.id}`, title: `Evaluación hoy: ${e.title}`, body: nameOf(e.course_id), severity: 'high', to: '/universidad' })
    else if (isTomorrow(d)) out.push({ id: `eval-${e.id}`, title: `Evaluación mañana: ${e.title}`, body: nameOf(e.course_id), severity: 'medium', to: '/universidad' })
  }

  const wd = new Date().getDay()
  for (const s of schedule.filter((s) => s.weekday === wd)) {
    out.push({
      id: `class-${s.id}`,
      title: `Clase hoy: ${nameOf(s.course_id) ?? 'Ramo'}`,
      body: `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`,
      severity: 'low',
      to: '/universidad',
    })
  }

  const rank: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity])
}

export function useAlerts(): Alert[] {
  const { data: tasks = [] } = useTasks()
  const { data: evals = [] } = useEvaluations()
  const { data: schedule = [] } = useSchedule()
  const { data: courses = [] } = useCourses()
  return buildAlerts({ tasks, evals, schedule, courses })
}
