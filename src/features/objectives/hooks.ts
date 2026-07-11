import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete } from '@/lib/crud'
import type { Objective } from '@/types/database'

export function useObjectives() {
  return useQuery({
    queryKey: qk.objectives,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Objective[]
    },
  })
}

export const useCreateObjective = () => useInsert<Objective>('objectives', [qk.objectives])
export const useUpdateObjective = () => useUpdate<Objective>('objectives', [qk.objectives])
export const useDeleteObjective = () => useDelete('objectives', [qk.objectives, qk.tasks])
