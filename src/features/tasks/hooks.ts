import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete } from '@/lib/crud'
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

/**
 * Completa o reabre una tarea. Los puntos los otorga la BD (trigger en
 * points_ledger), así que aquí solo cambiamos el estado. Update optimista:
 * la UI cambia al instante y revierte si la escritura falla.
 */
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const values = done
        ? { status: 'done', completed_at: new Date().toISOString() }
        : { status: 'pending', completed_at: null }
      const { error } = await supabase.from('tasks').update(values).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: qk.tasks })
      const previous = qc.getQueryData<Task[]>(qk.tasks)
      qc.setQueryData<Task[]>(qk.tasks, (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? {
                ...t,
                status: done ? 'done' : 'pending',
                completed_at: done ? new Date().toISOString() : null,
              }
            : t,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.tasks, ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasks })
      qc.invalidateQueries({ queryKey: qk.profile })
    },
  })
}
