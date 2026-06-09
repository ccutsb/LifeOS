import clsx from 'clsx'
import { Flame, Check } from 'lucide-react'
import { dateKey } from '@/lib/dates'
import { currentStreak } from '@/lib/streaks'
import type { Habit, HabitLog } from '@/types/database'

export function HabitCard({
  habit,
  logs,
  onToggleToday,
  onEdit,
}: {
  habit: Habit
  logs: HabitLog[]
  onToggleToday: (currentlyDone: boolean) => void
  onEdit: () => void
}) {
  const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.log_date))
  const today = dateKey()
  const todayDone = doneSet.has(today)
  const streak = currentStreak([...doneSet])

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return dateKey(d)
  })

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <button onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl"
          style={{ backgroundColor: `${habit.color}22` }}
        >
          {habit.icon ?? '⭐'}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{habit.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={clsx('flex items-center gap-0.5 text-xs font-medium', streak > 0 ? 'text-warning' : 'text-muted')}>
              <Flame className="h-3.5 w-3.5" /> {streak}
            </span>
            <div className="flex gap-1">
              {last7.map((k) => (
                <span
                  key={k}
                  className={clsx('h-1.5 w-1.5 rounded-full', !doneSet.has(k) && 'opacity-30')}
                  style={{ backgroundColor: doneSet.has(k) ? habit.color : '#64748b' }}
                />
              ))}
            </div>
          </div>
        </div>
      </button>
      <button
        onClick={() => onToggleToday(todayDone)}
        aria-label={todayDone ? 'Desmarcar hoy' : 'Marcar hoy'}
        className={clsx(
          'grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition active:scale-90',
          todayDone ? 'border-success bg-success text-white' : 'border-muted text-muted',
        )}
      >
        <Check className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  )
}
