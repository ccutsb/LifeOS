import clsx from 'clsx'
import { Check, Repeat, Clock } from 'lucide-react'
import { relativeDue } from '@/lib/dates'
import { isDoneToday } from '@/lib/planner'
import type { Task } from '@/types/database'

const ENERGY_ICON: Record<string, string> = { low: '🪫', medium: '◐', high: '🔋' }

export function TaskRow({
  task,
  onToggle,
  onTap,
  accent,
  areaIcon,
}: {
  task: Task
  onToggle: () => void
  onTap?: () => void
  accent?: string
  areaIcon?: string | null
}) {
  const done = task.status === 'done' || isDoneToday(task)
  const due = relativeDue(task.due_at)
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <button
        onClick={onToggle}
        aria-label={done ? 'Reabrir' : 'Completar'}
        className={clsx(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90',
          done ? 'border-success bg-success text-white' : 'border-muted',
        )}
      >
        {done && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
      <button onClick={onTap} className="min-w-0 flex-1 text-left">
        <p className={clsx('truncate', done && 'text-muted line-through')}>
          {areaIcon && <span className="mr-1">{areaIcon}</span>}
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
          {due && !done && (
            <span className={clsx('font-medium', due.overdue ? 'text-danger' : due.soon ? 'text-warning' : 'text-muted')}>
              {due.label}
            </span>
          )}
          {done && task.recurrence && <span className="text-success">hecha hoy ✓</span>}
          {task.recurrence && <Repeat className="h-3 w-3 shrink-0" />}
          {task.estimated_minutes != null && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {task.estimated_minutes}m
            </span>
          )}
          {task.energy && <span>{ENERGY_ICON[task.energy]}</span>}
          {task.next_action && <span className="truncate">→ {task.next_action}</span>}
        </p>
      </button>
      {accent && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />}
    </div>
  )
}
