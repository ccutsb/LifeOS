import { useState } from 'react'
import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { dateKey } from '@/lib/dates'
import { useToggleRoutineItem } from './hooks'
import type { Routine, RoutineItem, RoutineLog } from '@/types/database'

/** Tarjeta de rutina para Hoy: checklist colapsable con progreso. */
export function RoutineCard({
  routine,
  items,
  logs,
}: {
  routine: Routine
  items: RoutineItem[]
  logs: RoutineLog[]
}) {
  const toggle = useToggleRoutineItem()
  const today = dateKey()
  const doneSet = new Set(logs.filter((l) => l.log_date === today && l.done).map((l) => l.routine_item_id))
  const doneCount = items.filter((i) => doneSet.has(i.id)).length
  const complete = items.length > 0 && doneCount === items.length

  // Expandida por defecto solo si está incompleta
  const [open, setOpen] = useState(!complete)

  return (
    <Card className="!p-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          <span>{routine.icon ?? '📋'}</span>
          {routine.name}
        </span>
        <span className="flex items-center gap-2 text-sm text-muted">
          <span className={clsx(complete && 'text-success')}>
            {doneCount}/{items.length}
            {complete && ' ✓'}
          </span>
          <ChevronDown className={clsx('h-4 w-4 transition', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.map((item) => {
            const done = doneSet.has(item.id)
            return (
              <li key={item.id}>
                <button
                  onClick={() => toggle.mutate({ itemId: item.id, date: today, currentlyDone: done })}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left active:bg-surface-2"
                >
                  <span
                    className={clsx(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition',
                      done ? 'border-success bg-success text-white' : 'border-muted',
                    )}
                  >
                    {done && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={clsx('text-sm', done && 'text-muted line-through')}>{item.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
