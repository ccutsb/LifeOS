import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import { useInsert, useUpdate, useDelete } from '@/lib/crud'
import type { Course, CourseSchedule, Evaluation } from '@/types/database'

export function useCourses() {
  return useQuery({
    queryKey: qk.courses,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Course[]
    },
  })
}

export function useEvaluations() {
  return useQuery({
    queryKey: qk.evaluations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .order('due_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as Evaluation[]
    },
  })
}

export function useSchedule() {
  return useQuery({
    queryKey: qk.schedule,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_schedule')
        .select('*')
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) throw error
      return (data ?? []) as CourseSchedule[]
    },
  })
}

export const useCreateCourse = () => useInsert<Course>('courses', [qk.courses])
export const useUpdateCourse = () => useUpdate<Course>('courses', [qk.courses])
export const useDeleteCourse = () =>
  useDelete('courses', [qk.courses, qk.evaluations, qk.schedule])

export const useCreateEvaluation = () => useInsert<Evaluation>('evaluations', [qk.evaluations])
export const useUpdateEvaluation = () => useUpdate<Evaluation>('evaluations', [qk.evaluations])
export const useDeleteEvaluation = () => useDelete('evaluations', [qk.evaluations])

export const useCreateSchedule = () => useInsert<CourseSchedule>('course_schedule', [qk.schedule])
export const useDeleteSchedule = () => useDelete('course_schedule', [qk.schedule])
