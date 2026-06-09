import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

/** Lee el id del usuario desde la sesión local (sin llamada de red). */
export async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('No autenticado')
  return id
}

type Values = Record<string, unknown>
type Keys = readonly (readonly unknown[])[]

/** Inserta una fila añadiendo automáticamente user_id (necesario para RLS). */
export function useInsert<T>(table: string, invalidate: Keys) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Values): Promise<T> => {
      const user_id = await getUserId()
      const { data, error } = await supabase
        .from(table)
        .insert({ ...values, user_id })
        .select()
        .single()
      if (error) throw error
      return data as T
    },
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  })
}

export function useUpdate<T>(table: string, invalidate: Keys) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Values }): Promise<T> => {
      const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single()
      if (error) throw error
      return data as T
    },
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  })
}

export function useDelete(table: string, invalidate: Keys) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  })
}
