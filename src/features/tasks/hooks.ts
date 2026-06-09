import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete, getUserId } from '@/lib/crud'
import type { Task } from '@/types/database'

export const POINTS_PER_TASK = 10

export function useTasks() {
  return useQuery({
    queryKey: qk.tasks,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}

export const useCreateTask = () => useInsert<Task>('tasks', [qk.tasks])
export const useUpdateTask = () => useUpdate<Task>('tasks', [qk.tasks])
export const useDeleteTask = () => useDelete('tasks', [qk.tasks])

/** Completa o reabre una tarea; al completar otorga puntos (recompensa inmediata). */
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const values = done
        ? { status: 'done', completed_at: new Date().toISOString() }
        : { status: 'pending', completed_at: null }
      const { error } = await supabase.from('tasks').update(values).eq('id', id)
      if (error) throw error
      if (done) {
        const user_id = await getUserId()
        await supabase.from('points_ledger').insert({
          user_id,
          delta: POINTS_PER_TASK,
          reason: 'Tarea completada',
          source: 'task',
          source_id: id,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tasks })
      qc.invalidateQueries({ queryKey: qk.profile })
    },
  })
}
