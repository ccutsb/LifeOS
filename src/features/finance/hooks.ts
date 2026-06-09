import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useInsert, useDelete, getUserId } from '@/lib/crud'
import type { Budget, SavingsGoal, SavingsRule, Transaction } from '@/types/database'

const TX = ['transactions'] as const
const BUD = ['budgets'] as const
const GOALS = ['savings_goals'] as const
const RULES = ['savings_rules'] as const

export function useTransactions() {
  return useQuery({
    queryKey: TX,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('occurred_on', { ascending: false })
        .limit(300)
      if (error) throw error
      return (data ?? []) as Transaction[]
    },
  })
}

export function useBudgets() {
  return useQuery({
    queryKey: BUD,
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*')
      if (error) throw error
      return (data ?? []) as Budget[]
    },
  })
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: GOALS,
    queryFn: async () => {
      const { data, error } = await supabase.from('savings_goals').select('*').order('created_at')
      if (error) throw error
      return (data ?? []) as SavingsGoal[]
    },
  })
}

export function useSavingsRules() {
  return useQuery({
    queryKey: RULES,
    queryFn: async () => {
      const { data, error } = await supabase.from('savings_rules').select('*')
      if (error) throw error
      return (data ?? []) as SavingsRule[]
    },
  })
}

export const useDeleteTransaction = () => useDelete('transactions', [TX])
export const useCreateBudget = () => useInsert<Budget>('budgets', [BUD])
export const useDeleteBudget = () => useDelete('budgets', [BUD])
export const useDeleteGoal = () => useDelete('savings_goals', [GOALS, RULES])

/** Crea una transacción; si es ingreso, aplica el ahorro automático a las metas. */
export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      type: 'income' | 'expense'
      amount: number
      category?: string | null
      description?: string | null
      occurred_on: string
    }) => {
      const user_id = await getUserId()
      const { error } = await supabase.from('transactions').insert({ ...values, user_id })
      if (error) throw error

      let autoSaved = 0
      if (values.type === 'income') {
        const { data: rules } = await supabase
          .from('savings_rules')
          .select('*')
          .eq('is_active', true)
          .eq('trigger', 'on_income')
        for (const rule of (rules ?? []) as SavingsRule[]) {
          if (!rule.goal_id) continue
          const amt =
            rule.kind === 'percent' ? Math.round((values.amount * Number(rule.value)) / 100) : Number(rule.value)
          if (amt <= 0) continue
          const { data: goal } = await supabase
            .from('savings_goals')
            .select('current_amount,target_amount')
            .eq('id', rule.goal_id)
            .single()
          if (goal) {
            const newAmount = Number(goal.current_amount) + amt
            await supabase
              .from('savings_goals')
              .update({ current_amount: newAmount, achieved: newAmount >= Number(goal.target_amount) })
              .eq('id', rule.goal_id)
            autoSaved += amt
          }
        }
      }
      return { autoSaved }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX })
      qc.invalidateQueries({ queryKey: GOALS })
    },
  })
}

/** Crea o actualiza una meta y gestiona su regla de ahorro automático (% de ingresos). */
export function useSaveGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
      autoPercent,
    }: {
      id?: string
      values: Record<string, unknown>
      autoPercent: number
    }) => {
      const user_id = await getUserId()
      let goalId = id
      if (id) {
        const { error } = await supabase.from('savings_goals').update(values).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('savings_goals')
          .insert({ ...values, user_id })
          .select()
          .single()
        if (error) throw error
        goalId = (data as SavingsGoal).id
      }
      await supabase.from('savings_rules').delete().eq('goal_id', goalId as string)
      if (autoPercent > 0 && goalId) {
        await supabase.from('savings_rules').insert({
          user_id,
          goal_id: goalId,
          kind: 'percent',
          value: autoPercent,
          trigger: 'on_income',
          is_active: true,
        })
      }
      return goalId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS })
      qc.invalidateQueries({ queryKey: RULES })
    },
  })
}

/** Abono manual a una meta. */
export function useContributeGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ goal, amount }: { goal: SavingsGoal; amount: number }) => {
      const newAmount = Number(goal.current_amount) + amount
      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount, achieved: newAmount >= Number(goal.target_amount) })
        .eq('id', goal.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS }),
  })
}
