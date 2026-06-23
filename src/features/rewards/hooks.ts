import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useDelete, getUserId } from '@/lib/crud'
import type { Reward } from '@/types/database'

const REWARDS_KEY = qk.rewards

export function useRewards() {
  return useQuery({
    queryKey: REWARDS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('rewards').select('*').order('cost', { ascending: true })
      if (error) throw error
      return (data ?? []) as Reward[]
    },
  })
}

export const useCreateReward = () => useInsert<Reward>('rewards', [REWARDS_KEY])
export const useDeleteReward = () => useDelete('rewards', [REWARDS_KEY])

/** Canjea una recompensa: descuenta puntos vía ledger (el trigger ajusta el perfil). */
export function useRedeemReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reward: Reward) => {
      const user_id = await getUserId()
      const { error } = await supabase.from('points_ledger').insert({
        user_id,
        delta: -reward.cost,
        reason: `Canje: ${reward.title}`,
        source: 'reward',
        source_id: reward.id,
      })
      if (error) throw error
      await supabase
        .from('rewards')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', reward.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile })
      qc.invalidateQueries({ queryKey: REWARDS_KEY })
    },
  })
}
