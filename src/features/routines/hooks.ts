import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useDelete, getUserId } from '@/lib/crud'
import { dateKey } from '@/lib/dates'
import type { Routine, RoutineItem, RoutineLog } from '@/types/database'

export function useRoutines() {
  return useQuery({
    queryKey: qk.routines,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Routine[]
    },
  })
}

export function useRoutineItems() {
  return useQuery({
    queryKey: qk.routineItems,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_items')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as RoutineItem[]
    },
  })
}

/** Logs de los últimos 14 días (checklist de hoy + revisión semanal). */
export function useRoutineLogs() {
  return useQuery({
    queryKey: qk.routineLogs,
    queryFn: async () => {
      const since = dateKey(new Date(Date.now() - 14 * 86_400_000))
      const { data, error } = await supabase.from('routine_logs').select('*').gte('log_date', since)
      if (error) throw error
      return (data ?? []) as RoutineLog[]
    },
  })
}

export const useDeleteRoutine = () =>
  useDelete('routines', [qk.routines, qk.routineItems, qk.routineLogs])

export interface RoutineDraftItem {
  id?: string
  title: string
}

/**
 * Crea o actualiza una rutina con sus ítems en un solo paso.
 * Al editar hace diff (actualiza/inserta/borra) para no perder el historial
 * de los ítems que no cambiaron.
 */
export function useSaveRoutine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
      items,
      originalItems = [],
    }: {
      id?: string
      values: Record<string, unknown>
      items: RoutineDraftItem[]
      originalItems?: RoutineItem[]
    }) => {
      const user_id = await getUserId()
      let routineId = id

      if (id) {
        const { error } = await supabase.from('routines').update(values).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('routines')
          .insert({ ...values, user_id })
          .select()
          .single()
        if (error) throw error
        routineId = (data as Routine).id
      }

      const keptIds = new Set(items.map((i) => i.id).filter(Boolean))
      const toDelete = originalItems.filter((o) => !keptIds.has(o.id))
      if (toDelete.length > 0) {
        await supabase.from('routine_items').delete().in('id', toDelete.map((o) => o.id))
      }

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx]
        if (item.id) {
          const original = originalItems.find((o) => o.id === item.id)
          if (original && (original.title !== item.title || original.sort_order !== idx)) {
            await supabase.from('routine_items').update({ title: item.title, sort_order: idx }).eq('id', item.id)
          }
        } else {
          await supabase
            .from('routine_items')
            .insert({ user_id, routine_id: routineId, title: item.title, sort_order: idx })
        }
      }
      return routineId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.routines })
      qc.invalidateQueries({ queryKey: qk.routineItems })
    },
  })
}

/** Marca / desmarca un ítem de rutina para hoy. */
export function useToggleRoutineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      date,
      currentlyDone,
    }: {
      itemId: string
      date: string
      currentlyDone: boolean
    }) => {
      if (currentlyDone) {
        const { error } = await supabase
          .from('routine_logs')
          .delete()
          .eq('routine_item_id', itemId)
          .eq('log_date', date)
        if (error) throw error
      } else {
        const user_id = await getUserId()
        const { error } = await supabase
          .from('routine_logs')
          .insert({ user_id, routine_item_id: itemId, log_date: date, done: true })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.routineLogs }),
  })
}
