import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { isActive, isDoneToday } from '@/lib/planner'
import { useTasks } from '@/features/tasks/hooks'
import { useAreas } from './hooks'
import { AreaFormSheet } from './AreaFormSheet'
import { SeedAreasCard } from './SeedAreasCard'

export function AreasPage() {
  const { data: areas = [], isLoading } = useAreas()
  const { data: tasks = [] } = useTasks()
  const [showNew, setShowNew] = useState(false)

  const pendingOf = (areaId: string) =>
    tasks.filter((t) => t.area_id === areaId && isActive(t) && !isDoneToday(t)).length

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Áreas de vida"
        subtitle="Tu vida completa, no solo la universidad"
        action={
          <Button onClick={() => setShowNew(true)} className="!px-3" aria-label="Nueva área">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <SeedAreasCard />

      <div className="grid grid-cols-2 gap-3">
        {areas.map((a) => {
          const pending = pendingOf(a.id)
          const to = a.kind === 'university' ? '/universidad' : `/areas/${a.id}`
          return (
            <Link
              key={a.id}
              to={to}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 active:bg-surface-2"
              style={{ opacity: a.is_active ? 1 : 0.55 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${a.color}22` }}
                >
                  {a.icon}
                </span>
                {a.priority > 0 && <span className="text-xs text-warning">★</span>}
              </div>
              <div>
                <p className="font-semibold leading-tight">{a.name}</p>
                <p className="text-xs text-muted">
                  {!a.is_active
                    ? '💤 en pausa'
                    : pending === 0
                      ? 'al día ✓'
                      : `${pending} ${pending === 1 ? 'tarea' : 'tareas'}`}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {showNew && <AreaFormSheet onClose={() => setShowNew(false)} />}
    </div>
  )
}
