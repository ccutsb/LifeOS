import { useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { useCourses, useEvaluations, useSchedule } from '@/features/university/hooks'
import { useTasks } from '@/features/tasks/hooks'

type View = 'mes' | 'semana' | 'día'
interface DayItem {
  id: string
  title: string
  kind: 'task' | 'eval' | 'class'
  color: string
  time?: string
}

const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function CalendarPage() {
  const { data: tasks = [] } = useTasks()
  const { data: evals = [] } = useEvaluations()
  const { data: schedule = [] } = useSchedule()
  const { data: courses = [] } = useCourses()

  const [view, setView] = useState<View>('mes')
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(new Date())

  const colorOf = (id: string | null) => (id ? courses.find((c) => c.id === id)?.color ?? '#64748b' : '#64748b')

  const itemsFor = (d: Date): DayItem[] => {
    const out: DayItem[] = []
    for (const t of tasks) {
      if (t.status === 'cancelled' || !t.due_at) continue
      if (isSameDay(new Date(t.due_at), d)) out.push({ id: `t${t.id}`, title: t.title, kind: 'task', color: colorOf(t.course_id) })
    }
    for (const e of evals) {
      if (!e.due_at) continue
      if (isSameDay(new Date(e.due_at), d)) out.push({ id: `e${e.id}`, title: e.title, kind: 'eval', color: colorOf(e.course_id), time: format(new Date(e.due_at), 'HH:mm') })
    }
    for (const s of schedule) {
      if (s.weekday === d.getDay())
        out.push({ id: `c${s.id}`, title: courses.find((c) => c.id === s.course_id)?.name ?? 'Clase', kind: 'class', color: colorOf(s.course_id), time: s.start_time.slice(0, 5) })
    }
    return out.sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
  }

  const monthStart = startOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const grid = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  const weekStart = startOfWeek(view === 'semana' ? cursor : selected, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const move = (dir: number) => {
    if (view === 'mes') setCursor(addMonths(cursor, dir))
    else if (view === 'semana') setCursor(addDays(cursor, dir * 7))
    else setSelected(addDays(selected, dir))
  }

  const headerLabel =
    view === 'mes'
      ? format(cursor, 'MMMM yyyy', { locale: es })
      : view === 'semana'
        ? `Semana del ${format(weekStart, 'd MMM', { locale: es })}`
        : format(selected, "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="animate-fade-in">
      <PageHeader title="Calendario" />

      <div className="mb-4 flex gap-1 rounded-xl bg-surface p-1">
        {(['mes', 'semana', 'día'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx('flex-1 rounded-lg py-2 text-sm font-medium capitalize transition', view === v ? 'bg-surface-2 text-text' : 'text-muted')}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => move(-1)} className="rounded-lg p-2 text-muted active:bg-surface" aria-label="Anterior">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold capitalize">{headerLabel}</span>
        <button onClick={() => move(1)} className="rounded-lg p-2 text-muted active:bg-surface" aria-label="Siguiente">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {view === 'mes' && (
        <>
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-muted">
            {WD.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d) => {
              const items = itemsFor(d)
              const isSel = isSameDay(d, selected)
              const isToday = isSameDay(d, new Date())
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelected(d)}
                  className={clsx(
                    'flex aspect-square flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-sm',
                    isSel ? 'bg-brand/20 ring-1 ring-brand' : 'active:bg-surface',
                    !isSameMonth(d, cursor) && 'text-muted/40',
                  )}
                >
                  <span className={clsx(isToday && 'flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white')}>
                    {d.getDate()}
                  </span>
                  <div className="flex gap-0.5">
                    {items.slice(0, 3).map((it) => (
                      <span key={it.id} className="h-1 w-1 rounded-full" style={{ backgroundColor: it.color }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold capitalize text-muted">{format(selected, "EEEE d 'de' MMMM", { locale: es })}</h3>
            <DayList items={itemsFor(selected)} />
          </div>
        </>
      )}

      {view === 'semana' && (
        <div className="flex flex-col gap-3">
          {weekDays.map((d) => (
            <div key={d.toISOString()}>
              <h3 className="mb-1.5 text-sm font-semibold capitalize text-muted">{format(d, "EEEE d", { locale: es })}</h3>
              <DayList items={itemsFor(d)} />
            </div>
          ))}
        </div>
      )}

      {view === 'día' && <DayList items={itemsFor(selected)} />}
    </div>
  )
}

const KIND_LABEL = { task: 'Tarea', eval: 'Evaluación', class: 'Clase' } as const

function DayList({ items }: { items: DayItem[] }) {
  if (items.length === 0) return <p className="py-3 text-center text-sm text-muted">Sin actividades.</p>
  return (
    <Card className="flex flex-col gap-2 p-3">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
          <span className="min-w-0 flex-1 truncate">{it.title}</span>
          <span className="shrink-0 text-xs text-muted">{it.time ?? KIND_LABEL[it.kind]}</span>
        </div>
      ))}
    </Card>
  )
}
