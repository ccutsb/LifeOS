import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete } from '@/lib/crud'
import type { LifeArea } from '@/types/database'

export function useAreas() {
  return useQuery({
    queryKey: qk.areas,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_areas')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as LifeArea[]
    },
  })
}

export const useCreateArea = () => useInsert<LifeArea>('life_areas', [qk.areas])
export const useUpdateArea = () => useUpdate<LifeArea>('life_areas', [qk.areas])
export const useDeleteArea = () => useDelete('life_areas', [qk.areas, qk.tasks, qk.objectives])
