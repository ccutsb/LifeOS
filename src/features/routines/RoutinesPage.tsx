import { useState } from 'react'
import { Plus, ListChecks } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { WEEKDAYS_SHORT } from '@/lib/dates'
import { useRoutines, useRoutineItems } from './hooks'
import { RoutineFormSheet } from './RoutineFormSheet'
import type { Routine } from '@/types/database'

export function RoutinesPage() {
  const { data: routines = [], isLoading } = useRoutines()
  const { data: items = [] } = useRoutineItems()
  const [showNew, setShowNew] = useState(false)
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null)

  const itemsOf = (id: string) => items.filter((i) => i.routine_id === id)

  const daysLabel = (r: Routine) =>
    r.weekdays.length === 7 ? 'todos los días' : r.weekdays.map((d) => WEEKDAYS_SHORT[d]).join(' · ')

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rutinas"
        subtitle="Estructura sin pensar: sigue la checklist"
        action={
          <Button onClick={() => setShowNew(true)} className="!px-3" aria-label="Nueva rutina">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : routines.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-10 w-10" />}
          title="Crea tu primera rutina"
          hint="Rutina de mañana, de noche o del domingo: una checklist que aparece en Hoy los días que corresponda."
          action={
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Nueva rutina
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {routines.map((r) => {
            const own = itemsOf(r.id)
            return (
              <li key={r.id}>
                <button
                  onClick={() => setEditRoutine(r)}
                  className="w-full rounded-2xl border border-border bg-surface p-4 text-left active:bg-surface-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="text-xl">{r.icon ?? '📋'}</span>
                      {r.name}
                    </span>
                    <span className="text-xs text-muted">
                      {own.length} {own.length === 1 ? 'paso' : 'pasos'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs capitalize text-muted">{daysLabel(r)}</p>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showNew && <RoutineFormSheet onClose={() => setShowNew(false)} />}
      {editRoutine && (
        <RoutineFormSheet
          routine={editRoutine}
          items={itemsOf(editRoutine.id)}
          onClose={() => setEditRoutine(null)}
        />
      )}
    </div>
  )
}
