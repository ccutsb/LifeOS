import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Flame,
  GraduationCap,
  LifeBuoy,
  Play,
  Wallet,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useAreas } from '@/features/areas/hooks'
import { useTasks, useCompleteTask } from '@/features/tasks/hooks'
import { useHabits, useHabitLogs } from '@/features/habits/hooks'
import { useTransactions } from '@/features/finance/hooks'
import { useCourses, useEvaluations, useSchedule } from '@/features/university/hooks'
import { useRoutines, useRoutineItems, useRoutineLogs } from '@/features/routines/hooks'
import { RoutineCard } from '@/features/routines/RoutineCard'
import { SeedAreasCard } from '@/features/areas/SeedAreasCard'
import { TaskRow } from '@/features/tasks/TaskRow'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useAlerts } from '@/features/notifications/alerts'
import { buildDayPlan, isDoneToday } from '@/lib/planner'
import { usePlannerContext } from '@/hooks/usePlannerContext'
import { useSessionStore, useCurrentEnergy } from '@/stores/session'
import { greeting, longDate, dateKey, relativeDue, isPast, isToday } from '@/lib/dates'
import { formatCLP } from '@/lib/money'
import type { Energy } from '@/types/database'
import type { ReactNode } from 'react'

const ENERGY_OPTIONS: { value: Energy; label: string }[] = [
  { value: 'high', label: '🔋 Alta' },
  { value: 'medium', label: '◐ Media' },
  { value: 'low', label: '🪫 Baja' },
]

export function TodayPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: areas = [] } = useAreas()
  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()
  const { data: transactions = [] } = useTransactions()
  const { data: schedule = [] } = useSchedule()
  const { data: evals = [] } = useEvaluations()
  const { data: courses = [] } = useCourses()
  const { data: routines = [] } = useRoutines()
  const { data: routineItems = [] } = useRoutineItems()
  const { data: routineLogs = [] } = useRoutineLogs()
  const complete = useCompleteTask()
  const alerts = useAlerts()
  const navigate = useNavigate()

  const [showNotif, setShowNotif] = useState(false)
  const energy = useCurrentEnergy()
  const setEnergy = useSessionStore((s) => s.setEnergy)

  const name =
    profile?.display_name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    ''

  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas])
  const universityActive = areas.some((a) => a.kind === 'university' && a.is_active)
  const courseById = (id: string | null) => (id ? courses.find((c) => c.id === id) : undefined)

  // ── Plan del día (motor de priorización) ──
  const doneTodayTasks = tasks.filter(
    (t) => (t.completed_at && isToday(new Date(t.completed_at))) || isDoneToday(t),
  )
  const plannerCtx = usePlannerContext()
  const plan = useMemo(() => {
    const ctx = {
      ...plannerCtx,
      areasDoneToday: new Set(
        doneTodayTasks.map((t) => t.area_id).filter((x): x is string => Boolean(x)),
      ),
    }
    return buildDayPlan(plannerCtx.withoutPaused(tasks), ctx)
  }, [tasks, plannerCtx, doneTodayTasks])

  const planTotal = plan.length + doneTodayTasks.length
  const overdueCount = tasks.filter(
    (t) =>
      ['inbox', 'pending', 'in_progress'].includes(t.status) &&
      t.due_at &&
      isPast(new Date(t.due_at)) &&
      !isToday(new Date(t.due_at)) &&
      !isDoneToday(t),
  ).length

  // ── Tarjetas secundarias ──
  const today = dateKey()
  const habitsDone = habits.filter((h) =>
    habitLogs.some((l) => l.habit_id === h.id && l.log_date === today && l.done),
  ).length

  const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const monthTx = transactions.filter((t) => t.occurred_on.startsWith(ym))
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense

  const todayClasses = universityActive ? schedule.filter((s) => s.weekday === new Date().getDay()) : []
  const upcomingEvals = universityActive
    ? evals.filter((e) => e.grade == null && e.due_at && !isPast(new Date(e.due_at))).slice(0, 2)
    : []

  // Rutinas de hoy (mañana primero, noche al final)
  const triggerOrder = { morning: 0, weekday: 1, evening: 2 } as const
  const todayWeekday = new Date().getDay()
  const todayRoutines = routines
    .filter((r) => r.is_active && r.weekdays.includes(todayWeekday))
    .sort((a, b) => triggerOrder[a.trigger_kind] - triggerOrder[b.trigger_kind])

  return (
    <div className="animate-fade-in space-y-4">
      {/* Cabecera */}
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
          <button
            onClick={() => setShowNotif(true)}
            className="relative rounded-full p-2 text-muted active:bg-surface"
            aria-label="Avisos"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Energía */}
      <div>
        <p className="mb-1.5 text-sm text-muted">¿Cómo está tu energía?</p>
        <div className="flex gap-2">
          {ENERGY_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setEnergy(energy === o.value ? null : o.value)}
              className={clsx(
                'flex-1 rounded-xl border py-2.5 text-sm font-medium transition',
                energy === o.value ? 'border-brand bg-brand/15 text-text' : 'border-border bg-surface text-muted',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón héroe */}
      <button
        onClick={() => navigate('/ahora')}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand py-5 text-lg font-bold text-white shadow-card transition active:scale-[0.98]"
      >
        <Play className="h-6 w-6" fill="currentColor" />
        ¿Qué hago ahora?
      </button>

      {/* Onboarding: sin áreas todavía */}
      <SeedAreasCard />

      {/* Banner crisis */}
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

      {/* Plan de hoy */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <Link to="/tareas" className="flex items-center gap-2 font-semibold">
            Plan de hoy <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
          <span className="text-sm text-muted">
            {doneTodayTasks.length}/{planTotal} ✓
          </span>
        </div>
        {plan.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            {doneTodayTasks.length > 0
              ? '¡Plan completado! Disfruta o captura algo nuevo. 🎉'
              : 'Nada en el plan. Captura tus pendientes con el botón +.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {plan.map(({ task }) => {
              const area = task.area_id ? areaById.get(task.area_id) : undefined
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  accent={area?.color}
                  areaIcon={area?.icon}
                  onToggle={() => complete.mutate({ task, done: true })}
                />
              )
            })}
          </div>
        )}
      </Card>

      {/* Rutinas de hoy */}
      {todayRoutines.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          items={routineItems.filter((i) => i.routine_id === r.id)}
          logs={routineLogs}
        />
      ))}

      {/* Hábitos */}
      <SectionCard title="Hábitos de hoy" icon={<Flame className="h-4 w-4 text-warning" />} to="/habitos">
        {habits.length === 0 ? (
          <p className="py-2 text-sm text-muted">Crea tus primeros hábitos.</p>
        ) : (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Progreso</span>
              <span className="font-semibold">
                {habitsDone}/{habits.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${habits.length ? (habitsDone / habits.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Universidad (solo si el área está activa) */}
      {universityActive && (todayClasses.length > 0 || upcomingEvals.length > 0) && (
        <SectionCard title="Universidad" icon={<GraduationCap className="h-4 w-4 text-brand" />} to="/universidad">
          <ul className="flex flex-col gap-2">
            {todayClasses.map((s) => {
              const c = courseById(s.course_id)
              return (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 text-info" />
                  <span className="min-w-0 flex-1 truncate">{c?.name ?? 'Clase'}</span>
                  <span className="text-muted">
                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </span>
                </li>
              )
            })}
            {upcomingEvals.map((e) => {
              const due = relativeDue(e.due_at)
              return (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: courseById(e.course_id)?.color ?? '#64748b' }} />
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  <span className={due?.soon ? 'text-warning' : 'text-muted'}>{due?.label}</span>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      )}

      {/* Finanzas */}
      <SectionCard title="Resumen financiero" icon={<Wallet className="h-4 w-4 text-success" />} to="/finanzas">
        {monthTx.length === 0 ? (
          <p className="py-2 text-sm text-muted">Registra ingresos y gastos para ver tu balance.</p>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Balance del mes</p>
              <p className={clsx('text-2xl font-bold', balance >= 0 ? 'text-success' : 'text-danger')}>
                {formatCLP(balance)}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="text-success">+{formatCLP(income)}</p>
              <p className="text-danger">−{formatCLP(expense)}</p>
            </div>
          </div>
        )}
      </SectionCard>

      {showNotif && <NotificationsSheet onClose={() => setShowNotif(false)} />}
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
