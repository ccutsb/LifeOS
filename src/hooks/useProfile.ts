import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { getUserId } from '@/lib/crud'
import type { Profile } from '@/types/database'

export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: async (): Promise<Profile | null> => {
      const id = await getUserId()
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return (data as Profile) ?? null
    },
  })
}
