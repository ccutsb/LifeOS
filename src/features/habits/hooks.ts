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

/**
 * Marca/desmarca un hábito en una fecha. Los puntos los otorga la BD (triggers
 * en habit_logs), así que aquí solo escribimos el registro. Update optimista
 * para que el toque se sienta instantáneo, con rollback si falla.
 */
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
        const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('log_date', date)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert({ user_id, habit_id: habitId, log_date: date, done: true, value })
        if (error) throw error
      }
    },
    onMutate: async ({ habitId, date, currentlyDone, value = 1 }) => {
      await qc.cancelQueries({ queryKey: qk.habitLogs })
      const previous = qc.getQueryData<HabitLog[]>(qk.habitLogs)
      qc.setQueryData<HabitLog[]>(qk.habitLogs, (old) => {
        const logs = old ?? []
        if (currentlyDone) {
          return logs.filter((l) => !(l.habit_id === habitId && l.log_date === date))
        }
        const optimistic: HabitLog = {
          id: `optimistic-${habitId}-${date}`,
          user_id: '',
          habit_id: habitId,
          log_date: date,
          value,
          done: true,
          note: null,
          created_at: new Date().toISOString(),
        }
        return [...logs, optimistic]
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.habitLogs, ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.habitLogs })
      qc.invalidateQueries({ queryKey: qk.profile })
    },
  })
}
