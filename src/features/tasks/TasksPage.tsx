import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Plus, Inbox, CheckCircle2, LayoutGrid } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { QUADRANT_META, QUADRANT_ORDER, type Quadrant } from '@/lib/eisenhower'
import { useCourses } from '@/features/university/hooks'
import { useTasks, useCompleteTask, useCreateTask } from './hooks'
import { TaskRow } from './TaskRow'
import { TaskFormSheet } from './TaskFormSheet'
import type { Task } from '@/types/database'

const quadrantBar: Record<Quadrant, string> = {
  do: 'bg-q-do',
  schedule: 'bg-q-schedule',
  delegate: 'bg-q-delegate',
  eliminate: 'bg-q-eliminate',
}

type View = 'matriz' | 'bandeja' | 'hechas'

export function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: courses = [] } = useCourses()
  const complete = useCompleteTask()
  const create = useCreateTask()

  const [view, setView] = useState<View>('matriz')
  const [quick, setQuick] = useState('')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [showNew, setShowNew] = useState(false)

  const colorOf = (id: string | null) => (id ? courses.find((c) => c.id === id)?.color : undefined)
  const active = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const inbox = tasks.filter((t) => t.status === 'inbox')
  const done = tasks.filter((t) => t.status === 'done').slice(0, 40)

  const toggle = (t: Task) => complete.mutate({ id: t.id, done: t.status !== 'done' })

  const quickAdd = async (e: FormEvent) => {
    e.preventDefault()
    const title = quick.trim()
    if (!title) return
    setQuick('')
    try {
      await create.mutateAsync({ title, status: 'inbox' })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const tabs: { key: View; label: string; icon: typeof Inbox; count?: number }[] = [
    { key: 'matriz', label: 'Matriz', icon: LayoutGrid },
    { key: 'bandeja', label: 'Bandeja', icon: Inbox, count: inbox.length },
    { key: 'hechas', label: 'Hechas', icon: CheckCircle2 },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tareas"
        subtitle="Captura todo, decide después"
        action={
          <Button onClick={() => setShowNew(true)} className="!px-3" aria-label="Nueva tarea">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {/* Captura rápida (GTD): saca lo que tengas en la cabeza */}
      <form onSubmit={quickAdd} className="mb-4 flex gap-2">
        <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Captura rápida… (va a la Bandeja)" />
        <Button type="submit" className="!px-4" aria-label="Capturar">
          <Plus className="h-5 w-5" />
        </Button>
      </form>

      {/* Segmentos */}
      <div className="mb-4 flex gap-1 rounded-xl bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition',
              view === t.key ? 'bg-surface-2 text-text' : 'text-muted',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count ? <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : view === 'matriz' ? (
        <div className="grid grid-cols-1 gap-3">
          {QUADRANT_ORDER.map((q) => {
            const items = active.filter((t) => t.quadrant === q)
            const meta = QUADRANT_META[q]
            return (
              <div key={q} className="rounded-2xl border border-border bg-surface p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className={clsx('h-2.5 w-2.5 rounded-full', quadrantBar[q])} />
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="text-xs text-muted">· {meta.hint}</span>
                </div>
                {items.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted">—</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {items.map((t) => (
                      <TaskRow key={t.id} task={t} accent={colorOf(t.course_id)} onToggle={() => toggle(t)} onTap={() => setEditTask(t)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : view === 'bandeja' ? (
        inbox.length === 0 ? (
          <EmptyState icon={<Inbox className="h-10 w-10" />} title="Bandeja vacía" hint="Captura cualquier pendiente arriba; luego ábrelo para decidir si es importante o urgente." />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-xs text-muted">Tócalas para clasificarlas (importante / urgente) y activarlas.</p>
            {inbox.map((t) => (
              <TaskRow key={t.id} task={t} accent={colorOf(t.course_id)} onToggle={() => toggle(t)} onTap={() => setEditTask(t)} />
            ))}
          </div>
        )
      ) : done.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="Aún nada completado" hint="Cuando termines tareas aparecerán aquí. Cada una suma puntos." />
      ) : (
        <div className="flex flex-col gap-2">
          {done.map((t) => (
            <TaskRow key={t.id} task={t} accent={colorOf(t.course_id)} onToggle={() => toggle(t)} onTap={() => setEditTask(t)} />
          ))}
        </div>
      )}

      {showNew && <TaskFormSheet onClose={() => setShowNew(false)} />}
      {editTask && <TaskFormSheet task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  )
}
