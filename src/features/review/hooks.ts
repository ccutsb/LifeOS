import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/crud'
import type { WeeklyReview } from '@/types/database'

export function useWeeklyReview(weekStart: string) {
  return useQuery({
    queryKey: ['weekly_review', weekStart],
    queryFn: async (): Promise<WeeklyReview | null> => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle()
      if (error) throw error
      return (data as WeeklyReview) ?? null
    },
  })
}

export function useSaveReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      week_start: string
      went_well: string
      went_wrong: string
      next_priorities: string
      metrics: Record<string, unknown>
    }) => {
      const user_id = await getUserId()
      const { error } = await supabase
        .from('weekly_reviews')
        .upsert({ ...values, user_id }, { onConflict: 'user_id,week_start' })
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['weekly_review', vars.week_start] }),
  })
}
