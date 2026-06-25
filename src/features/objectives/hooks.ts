import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete } from '@/lib/crud'
import type { LifeGoal } from '@/types/database'

const GOALS = qk.lifeGoals

/** Objetivos de vida no archivados (activos y cumplidos). */
export function useLifeGoals() {
  return useQuery({
    queryKey: GOALS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_goals')
        .select('*')
        .neq('status', 'archived')
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return (data ?? []) as LifeGoal[]
    },
  })
}

export const useCreateLifeGoal = () => useInsert<LifeGoal>('life_goals', [GOALS])
// Al editar/borrar un objetivo, refrescamos también tareas y hábitos (se desvinculan).
export const useUpdateLifeGoal = () => useUpdate<LifeGoal>('life_goals', [GOALS, qk.tasks, qk.habits])
export const useDeleteLifeGoal = () => useDelete('life_goals', [GOALS, qk.tasks, qk.habits])
