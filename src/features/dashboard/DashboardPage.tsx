import { Link } from 'react-router-dom'
import {
  CalendarClock,
  Flame,
  GraduationCap,
  LogOut,
  Zap,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useCourses, useEvaluations, useSchedule } from '@/features/university/hooks'
import { useTasks, useCompleteTask } from '@/features/tasks/hooks'
import { useHabits, useHabitLogs } from '@/features/habits/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { Card } from '@/components/ui/Card'
import { greeting, longDate, dateKey, relativeDue, isPast, isToday } from '@/lib/dates'
import type { ReactNode } from 'react'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { data: courses = [] } = useCourses()
  const { data: evals = [] } = useEvaluations()
  const { data: schedule = [] } = useSchedule()
  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()
  const complete = useCompleteTask()

  const name =
    profile?.display_name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    ''

  const courseById = (id: string | null) => (id ? courses.find((c) => c.id === id) : undefined)
  const isOverdue = (iso: string) => isPast(new Date(iso)) && !isToday(new Date(iso))

  const active = tasks.filter((t) => ['inbox', 'pending', 'in_progress'].includes(t.status))
  const todayTasks = active.filter((t) => t.due_at && (isToday(new Date(t.due_at)) || isPast(new Date(t.due_at))))
  const overdueCount = active.filter((t) => t.due_at && isOverdue(t.due_at)).length

  const upcomingEvals = evals
    .filter((e) => e.grade == null && e.due_at && !(e.due_at && isOverdue(e.due_at)))
    .slice(0, 3)

  const todayWeekday = new Date().getDay()
  const todayClasses = schedule.filter((s) => s.weekday === todayWeekday)

  const today = dateKey()
  const doneToday = habits.filter((h) =>
    habitLogs.some((l) => l.habit_id === h.id && l.log_date === today && l.done),
  ).length

  return (
    <div className="animate-fade-in space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm capitalize text-muted">{longDate()}</p>
          <h1 className="text-2xl font-bold">
            {greeting()}
            {name ? `, ${name}` : ''}.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm font-semibold text-warning">
            <Zap className="h-4 w-4" /> {profile?.points ?? 0}
          </span>
          <button onClick={signOut} className="rounded-full p-2 text-muted active:bg-surface" aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {overdueCount > 0 && (
        <Link to="/crisis">
          <div className="flex items-center gap-3 rounded-2xl border border-danger/50 bg-danger/10 p-4 active:bg-danger/20">
            <LifeBuoy className="h-6 w-6 shrink-0 text-danger" />
            <div className="flex-1">
              <p className="font-semibold text-danger">
                {overdueCount} {overdueCount === 1 ? 'tarea vencida' : 'tareas vencidas'}
              </p>
              <p className="text-xs text-muted">Entra al Modo Crisis y sal del paso, una a la vez.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-danger" />
          </div>
        </Link>
      )}

      {/* Hoy */}
      <SectionCard title="Hoy" to="/tareas">
        {todayTasks.length === 0 ? (
          <p className="py-2 text-sm text-muted">Nada pendiente para hoy. 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {todayTasks.slice(0, 5).map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                accent={courseById(t.course_id)?.color}
                onToggle={() => complete.mutate({ id: t.id, done: t.status !== 'done' })}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Próximas evaluaciones */}
      <SectionCard title="Próximas evaluaciones" icon={<GraduationCap className="h-4 w-4 text-brand" />} to="/universidad">
        {upcomingEvals.length === 0 ? (
          <p className="py-2 text-sm text-muted">Sin evaluaciones próximas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcomingEvals.map((e) => {
              const c = courseById(e.course_id)
              const due = relativeDue(e.due_at)
              return (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c?.color ?? '#64748b' }} />
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  <span className={due?.soon ? 'text-warning' : 'text-muted'}>{due?.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      {/* Clases de hoy */}
      <SectionCard title="Clases de hoy" icon={<CalendarClock className="h-4 w-4 text-info" />} to="/universidad">
        {todayClasses.length === 0 ? (
          <p className="py-2 text-sm text-muted">Sin clases hoy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayClasses.map((s) => {
              const c = courseById(s.course_id)
              return (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c?.color ?? '#64748b' }} />
                  <span className="min-w-0 flex-1 truncate">{c?.name ?? 'Clase'}</span>
                  <span className="text-muted">
                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      {/* Hábitos */}
      <SectionCard title="Hábitos de hoy" icon={<Flame className="h-4 w-4 text-warning" />} to="/habitos">
        {habits.length === 0 ? (
          <p className="py-2 text-sm text-muted">Crea tus primeros hábitos.</p>
        ) : (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Progreso</span>
              <span className="font-semibold">
                {doneToday}/{habits.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${habits.length ? (doneToday / habits.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  to,
  children,
}: {
  title: string
  icon?: ReactNode
  to: string
  children: ReactNode
}) {
  return (
    <Card>
      <Link to={to} className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </span>
        <ChevronRight className="h-5 w-5 text-muted" />
      </Link>
      {children}
    </Card>
  )
}
