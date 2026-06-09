import { useState } from 'react'
import { Plus, Flame } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { dateKey } from '@/lib/dates'
import { useHabits, useHabitLogs, useToggleHabit } from './hooks'
import { HabitCard } from './HabitCard'
import { HabitFormSheet } from './HabitFormSheet'
import type { Habit } from '@/types/database'

export function HabitsPage() {
  const { data: habits = [], isLoading } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const toggle = useToggleHabit()

  const [showNew, setShowNew] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)

  const today = dateKey()
  const doneToday = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.log_date === today && l.done),
  ).length

  const onToggle = (habit: Habit, currentlyDone: boolean) =>
    toggle.mutate(
      { habitId: habit.id, date: today, currentlyDone },
      { onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Hábitos"
        subtitle="Constancia > intensidad"
        action={
          <Button onClick={() => setShowNew(true)} className="!px-3" aria-label="Nuevo hábito">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : habits.length === 0 ? (
        <EmptyState
          icon={<Flame className="h-10 w-10" />}
          title="Crea tus primeros hábitos"
          hint="Empieza con 1 o 2 (dormir, asistir, estudiar). Mejor pequeño y constante que ambicioso y abandonado."
          action={
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Nuevo hábito
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Hoy</span>
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

          <div className="flex flex-col gap-2.5">
            {habits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                logs={logs.filter((l) => l.habit_id === h.id)}
                onToggleToday={(currentlyDone) => onToggle(h, currentlyDone)}
                onEdit={() => setEditHabit(h)}
              />
            ))}
          </div>
        </>
      )}

      {showNew && <HabitFormSheet onClose={() => setShowNew(false)} />}
      {editHabit && <HabitFormSheet habit={editHabit} onClose={() => setEditHabit(null)} />}
    </div>
  )
}
