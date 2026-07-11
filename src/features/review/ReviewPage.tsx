import { useEffect, useState } from 'react'
import { startOfWeek, addDays, endOfDay } from 'date-fns'
import { ThumbsUp, ThumbsDown, Target, CheckCircle2, Flame, Timer } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { dateKey, isPast, isToday } from '@/lib/dates'
import { useTasks } from '@/features/tasks/hooks'
import { useHabits, useHabitLogs } from '@/features/habits/hooks'
import { useEvaluations } from '@/features/university/hooks'
import { useFocusSessions } from '@/features/focus/hooks'
import { useAreas } from '@/features/areas/hooks'
import { useWeeklyReview, useSaveReview } from './hooks'

export function ReviewPage() {
  const ws = startOfWeek(new Date(), { weekStartsOn: 1 })
  const we = endOfDay(addDays(ws, 6))
  const weekKey = dateKey(ws)

  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()
  const { data: evals = [] } = useEvaluations()
  const { data: sessions = [] } = useFocusSessions()
  const { data: areas = [] } = useAreas()
  const { data: saved } = useWeeklyReview(weekKey)
  const save = useSaveReview()

  const inWeek = (iso: string) => {
    const d = new Date(iso)
    return d >= ws && d <= we
  }

  // Tareas hechas esta semana: únicas completadas + recurrentes cumplidas
  const weekDone = tasks.filter(
    (t) =>
      (t.completed_at && inWeek(t.completed_at)) ||
      (t.recurrence && t.last_completed_at && inWeek(t.last_completed_at)),
  )
  const tasksDone = weekDone.length

  // Balance por áreas (minutos invertidos, estimación 30 min si no hay dato)
  const areaBalance = areas
    .map((a) => {
      const own = weekDone.filter((t) => t.area_id === a.id)
      const minutes = own.reduce((s, t) => s + (t.estimated_minutes ?? 30), 0)
      return { area: a, count: own.length, minutes }
    })
    .filter((b) => b.count > 0)
    .sort((a, b) => b.minutes - a.minutes)
  const noAreaCount = weekDone.filter((t) => !t.area_id).length
  const maxAreaMinutes = Math.max(30, ...areaBalance.map((b) => b.minutes))
  const overdue = tasks.filter(
    (t) => ['inbox', 'pending', 'in_progress'].includes(t.status) && t.due_at && isPast(new Date(t.due_at)) && !isToday(new Date(t.due_at)),
  ).length
  const focusDone = sessions.filter((s) => s.kind === 'focus' && s.completed && inWeek(s.started_at))
  const focusMin = focusDone.reduce((sum, s) => sum + (s.actual_minutes ?? s.planned_minutes), 0)
  const habitsDone = habitLogs.filter((l) => l.done && l.log_date >= weekKey).length

  // Generación automática
  const wellLines: string[] = []
  if (tasksDone > 0) wellLines.push(`✓ Completaste ${tasksDone} ${tasksDone === 1 ? 'tarea' : 'tareas'}`)
  if (focusDone.length > 0) wellLines.push(`✓ ${focusDone.length} pomodoros (${Math.floor(focusMin / 60)}h ${focusMin % 60}m de enfoque)`)
  if (habitsDone > 0) wellLines.push(`✓ ${habitsDone} hábitos cumplidos`)
  if (wellLines.length === 0) wellLines.push('Semana tranquila. Define algo pequeño y concreto para la próxima.')

  const wrongLines: string[] = []
  if (overdue > 0) wrongLines.push(`• ${overdue} ${overdue === 1 ? 'tarea vencida' : 'tareas vencidas'} sin cerrar`)
  if (focusDone.length === 0) wrongLines.push('• Cero sesiones de enfoque esta semana')
  if (habits.length > 0 && habitsDone === 0) wrongLines.push('• No registraste hábitos')
  if (wrongLines.length === 0) wrongLines.push('Sin pendientes graves. ¡Bien ahí!')

  const priorityTasks = tasks
    .filter((t) => ['inbox', 'pending', 'in_progress'].includes(t.status) && t.is_important)
    .slice(0, 4)
  const nextEvals = evals.filter((e) => e.grade == null && e.due_at && !isPast(new Date(e.due_at))).slice(0, 3)
  const priLines = [
    ...priorityTasks.map((t) => `• ${t.title}`),
    ...nextEvals.map((e) => `• Estudiar para: ${e.title}`),
  ]
  if (priLines.length === 0) priLines.push('• Agrega tus tareas importantes para enfocar la próxima semana')

  const autoWell = wellLines.join('\n')
  const autoWrong = wrongLines.join('\n')
  const autoPri = priLines.join('\n')

  const [well, setWell] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [pri, setPri] = useState<string | null>(null)

  // Prefill con lo guardado cuando llega
  useEffect(() => {
    if (saved) {
      setWell(saved.went_well ?? '')
      setWrong(saved.went_wrong ?? '')
      setPri(saved.next_priorities ?? '')
    }
  }, [saved])

  const onSave = async () => {
    try {
      await save.mutateAsync({
        week_start: weekKey,
        went_well: well ?? autoWell,
        went_wrong: wrong ?? autoWrong,
        next_priorities: pri ?? autoPri,
        metrics: {
          tasksDone,
          overdue,
          focusMin,
          pomodoros: focusDone.length,
          habitsDone,
          areas: Object.fromEntries(areaBalance.map((b) => [b.area.name, b.minutes])),
        },
      })
      toast.success('Revisión guardada')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Revisión semanal" subtitle="Mira atrás, ajusta y sigue" />

      <div className="grid grid-cols-4 gap-2">
        <Metric icon={<CheckCircle2 className="h-4 w-4 text-success" />} value={tasksDone} label="Tareas" />
        <Metric icon={<Timer className="h-4 w-4 text-brand" />} value={focusDone.length} label="🍅" />
        <Metric icon={<Flame className="h-4 w-4 text-warning" />} value={habitsDone} label="Hábitos" />
        <Metric icon={<Target className="h-4 w-4 text-danger" />} value={overdue} label="Vencidas" />
      </div>

      {/* Balance por áreas: dónde invertiste la semana */}
      {areaBalance.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold">Tu semana por áreas</h3>
          <ul className="flex flex-col gap-2.5">
            {areaBalance.map(({ area, count, minutes }) => (
              <li key={area.id}>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {area.icon} {area.name}
                  </span>
                  <span className="text-muted">
                    {count} {count === 1 ? 'tarea' : 'tareas'} · ~{Math.floor(minutes / 60) > 0 ? `${Math.floor(minutes / 60)}h ` : ''}
                    {minutes % 60}m
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(minutes / maxAreaMinutes) * 100}%`, backgroundColor: area.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {noAreaCount > 0 && (
            <p className="mt-3 text-xs text-muted">+ {noAreaCount} sin área (clasifícalas para ver mejor tu balance)</p>
          )}
        </Card>
      )}

      <Section icon={<ThumbsUp className="h-4 w-4 text-success" />} title="Qué salió bien">
        <Textarea rows={3} value={well ?? autoWell} onChange={(e) => setWell(e.target.value)} />
      </Section>
      <Section icon={<ThumbsDown className="h-4 w-4 text-danger" />} title="Qué salió mal">
        <Textarea rows={3} value={wrong ?? autoWrong} onChange={(e) => setWrong(e.target.value)} />
      </Section>
      <Section icon={<Target className="h-4 w-4 text-brand" />} title="Próximas prioridades">
        <Textarea rows={4} value={pri ?? autoPri} onChange={(e) => setPri(e.target.value)} />
      </Section>

      <Button fullWidth onClick={onSave} disabled={save.isPending}>
        {save.isPending ? 'Guardando…' : 'Guardar revisión'}
      </Button>
    </div>
  )
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-2 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}
