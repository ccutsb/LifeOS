import { useMemo } from 'react'
import { useAreas } from '@/features/areas/hooks'
import { useObjectives } from '@/features/objectives/hooks'
import { useCurrentEnergy } from '@/stores/session'
import type { Task } from '@/types/database'

/**
 * Contexto compartido del motor de priorización:
 * energía actual + prioridad de áreas + objetivos activos + áreas en pausa.
 * Lo consumen Hoy, "¿Qué hago ahora?", Tareas y el detalle de área.
 */
export function usePlannerContext() {
  const { data: areas = [] } = useAreas()
  const { data: objectives = [] } = useObjectives()
  const energy = useCurrentEnergy()

  return useMemo(() => {
    const pausedAreaIds = new Set(areas.filter((a) => !a.is_active).map((a) => a.id))
    return {
      energy,
      areaPriority: new Map(areas.map((a) => [a.id, a.priority])),
      activeObjectiveIds: new Set(
        objectives.filter((o) => o.status === 'active').map((o) => o.id),
      ),
      pausedAreaIds,
      /** Filtra las tareas de áreas en pausa (no participan del plan). */
      withoutPaused: (tasks: Task[]) =>
        tasks.filter((t) => !t.area_id || !pausedAreaIds.has(t.area_id)),
    }
  }, [areas, objectives, energy])
}
