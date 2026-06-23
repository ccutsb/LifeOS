import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import type { FocusSession } from '@/types/database'

/** Sesiones de enfoque de los últimos 7 días (para estadísticas). */
export function useFocusSessions() {
  return useQuery({
    queryKey: qk.focusSessions,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('started_at', since)
        .order('started_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as FocusSession[]
    },
  })
}
