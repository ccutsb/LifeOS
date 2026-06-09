import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete, getUserId } from '@/lib/crud'
import { dateKey } from '@/lib/dates'
import type { Habit, HabitLog } from '@/types/database'

export const POINTS_PER_HABIT = 5

export function useHabits() {
  return useQuery({
    queryKey: qk.habits,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Habit[]
    },
  })
}

/** Logs de los últimos 90 días (suficiente para rachas y vista semanal). */
export function useHabitLogs() {
  return useQuery({
    queryKey: qk.habitLogs,
    queryFn: async () => {
      const since = dateKey(new Date(Date.now() - 90 * 86_400_000))
      const { data, error } = await supabase.from('habit_logs').select('*').gte('log_date', since)
      if (error) throw error
      return (data ?? []) as HabitLog[]
    },
  })
}

export const useCreateHabit = () => useInsert<Habit>('habits', [qk.habits])
export const useUpdateHabit = () => useUpdate<Habit>('habits', [qk.habits])
export const useDeleteHabit = () => useDelete('habits', [qk.habits, qk.habitLogs])

/** Marca/desmarca un hábito en una fecha; ajusta puntos en consecuencia. */
export function useToggleHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      currentlyDone,
      value = 1,
    }: {
      habitId: string
      date: string
      currentlyDone: boolean
      value?: number
    }) => {
      const user_id = await getUserId()
      if (currentlyDone) {
        await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('log_date', date)
        await supabase.from('points_ledger').insert({
          user_id,
          delta: -POINTS_PER_HABIT,
          reason: 'Hábito desmarcado',
          source: 'habit',
          source_id: habitId,
        })
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert({ user_id, habit_id: habitId, log_date: date, done: true, value })
        if (error) throw error
        await supabase.from('points_ledger').insert({
          user_id,
          delta: POINTS_PER_HABIT,
          reason: 'Hábito cumplido',
          source: 'habit',
          source_id: habitId,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.habitLogs })
      qc.invalidateQueries({ queryKey: qk.profile })
    },
  })
}
