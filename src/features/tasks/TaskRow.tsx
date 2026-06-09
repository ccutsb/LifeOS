import clsx from 'clsx'
import { Check } from 'lucide-react'
import { relativeDue } from '@/lib/dates'
import type { Task } from '@/types/database'

export function TaskRow({
  task,
  onToggle,
  onTap,
  accent,
}: {
  task: Task
  onToggle: () => void
  onTap?: () => void
  accent?: string
}) {
  const done = task.status === 'done'
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
        <p className={clsx('truncate', done && 'text-muted line-through')}>{task.title}</p>
        {(due || task.next_action) && (
          <p className="mt-0.5 flex items-center gap-2 text-xs">
            {due && (
              <span className={clsx('font-medium', due.overdue ? 'text-danger' : due.soon ? 'text-warning' : 'text-muted')}>
                {due.label}
              </span>
            )}
            {task.next_action && <span className="truncate text-muted">→ {task.next_action}</span>}
          </p>
        )}
      </button>
      {accent && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />}
    </div>
  )
}
