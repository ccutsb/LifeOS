import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete } from '@/lib/crud'
import { firstDue, nextDue } from '@/lib/recurrence'
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
 * Completa o reabre una tarea. Los puntos los otorga la BD por triggers
 * (points.sql para status y migration-v2.sql para recurrentes), así que el
 * cliente NO inserta en points_ledger.
 * Las RECURRENTES no mueren: se marca last_completed_at y la misma fila
 * recalcula su próximo due_at (renace sola).
 */
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ task, done }: { task: Task; done: boolean }) => {
      const now = new Date()
      let values: Record<string, unknown>
      if (done && task.recurrence) {
        values = {
          status: 'pending',
          last_completed_at: now.toISOString(),
          due_at: nextDue(task.recurrence, now).toISOString(),
        }
      } else if (!done && task.recurrence) {
        // Deshacer una recurrente: vuelve a estar pendiente para hoy
        values = {
          status: 'pending',
          last_completed_at: null,
          due_at: firstDue(task.recurrence, now).toISOString(),
        }
      } else if (done) {
        values = { status: 'done', completed_at: now.toISOString() }
      } else {
        values = { status: 'pending', completed_at: null }
      }
      const { error } = await supabase.from('tasks').update(values).eq('id', task.id)
      if (error) throw error
    },
    // Update optimista: la UI responde al instante y revierte si falla
    onMutate: async ({ task, done }) => {
      await qc.cancelQueries({ queryKey: qk.tasks })
      const previous = qc.getQueryData<Task[]>(qk.tasks)
      const now = new Date()
      qc.setQueryData<Task[]>(qk.tasks, (old) =>
        (old ?? []).map((t) => {
          if (t.id !== task.id) return t
          if (done && t.recurrence) {
            return {
              ...t,
              status: 'pending',
              last_completed_at: now.toISOString(),
              due_at: nextDue(t.recurrence, now).toISOString(),
            }
          }
          if (!done && t.recurrence) {
            return {
              ...t,
              status: 'pending',
              last_completed_at: null,
              due_at: firstDue(t.recurrence, now).toISOString(),
            }
          }
          return {
            ...t,
            status: done ? 'done' : 'pending',
            completed_at: done ? now.toISOString() : null,
          }
        }),
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
