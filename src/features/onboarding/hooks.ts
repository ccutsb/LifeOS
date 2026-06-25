import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { getUserId } from '@/lib/crud'

/** Marca el onboarding como completado en el perfil. */
export function useCompleteOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const id = await getUserId()
      const { error } = await supabase.from('profiles').update({ onboarding_done: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile }),
  })
}
