// Tipos de las filas de la base de datos (espejo de supabase/schema.sql).
// Cuando conectes Supabase puedes regenerarlos con la CLI, pero estos bastan.

export type UUID = string
export type ISODate = string // 'YYYY-MM-DD'
export type ISODateTime = string // timestamptz

export type EisenhowerQuadrant = 'do' | 'schedule' | 'delegate' | 'eliminate'
export type TaskStatus = 'inbox' | 'pending' | 'in_progress' | 'done' | 'cancelled'
export type Energy = 'low' | 'medium' | 'high'
export type EvaluationType =
  | 'prueba' | 'examen' | 'control' | 'quiz' | 'trabajo' | 'laboratorio' | 'tarea' | 'otro'
export type HabitType = 'sleep' | 'attendance' | 'study' | 'exercise' | 'food' | 'custom'
export type Modality = 'presencial' | 'online' | 'hibrido'
export type TransactionType = 'income' | 'expense'
export type AccountKind = 'bank' | 'wallet' | 'cash' | 'benefit' | 'credit' | 'savings' | 'other'

export interface Profile {
  id: UUID
  email: string | null
  display_name: string | null
  timezone: string
  currency: string
  theme: string
  points: number
  onboarding_done: boolean
  settings: Record<string, unknown>
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Semester {
  id: UUID
  user_id: UUID
  name: string
  start_date: ISODate | null
  end_date: ISODate | null
  is_active: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Course {
  id: UUID
  user_id: UUID
  semester_id: UUID | null
  name: string
  code: string | null
  teacher: string | null
  color: string
  credits: number | null
  grade_min: number
  grade_max: number
  passing_grade: number
  exemption_grade: number | null
  target_grade: number | null
  attendance_required: number | null
  archived: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface CourseSchedule {
  id: UUID
  user_id: UUID
  course_id: UUID
  weekday: number // 0=Dom ... 6=Sáb
  start_time: string // 'HH:mm:ss'
  end_time: string
  room: string | null
  modality: Modality
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Evaluation {
  id: UUID
  user_id: UUID
  course_id: UUID
  title: string
  type: EvaluationType
  due_at: ISODateTime | null
  weight: number
  grade: number | null
  notes: string | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Task {
  id: UUID
  user_id: UUID
  course_id: UUID | null
  evaluation_id: UUID | null
  title: string
  description: string | null
  due_at: ISODateTime | null
  status: TaskStatus
  is_important: boolean
  is_urgent: boolean
  quadrant: EisenhowerQuadrant
  next_action: string | null
  estimated_minutes: number | null
  energy: Energy | null
  completed_at: ISODateTime | null
  sort_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Habit {
  id: UUID
  user_id: UUID
  name: string
  type: HabitType
  icon: string | null
  color: string
  cue: string | null
  reward: string | null
  target_value: number
  unit: string | null
  period: 'daily' | 'weekly'
  weekdays: number[]
  reminder_time: string | null
  is_active: boolean
  sort_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface HabitLog {
  id: UUID
  user_id: UUID
  habit_id: UUID
  log_date: ISODate
  value: number
  done: boolean
  note: string | null
  created_at: ISODateTime
}

export interface FocusSession {
  id: UUID
  user_id: UUID
  task_id: UUID | null
  course_id: UUID | null
  kind: 'focus' | 'short_break' | 'long_break'
  started_at: ISODateTime
  ended_at: ISODateTime | null
  planned_minutes: number
  actual_minutes: number | null
  completed: boolean
  interruptions: number
  created_at: ISODateTime
}

export interface Reward {
  id: UUID
  user_id: UUID
  title: string
  cost: number
  icon: string | null
  claimed: boolean
  claimed_at: ISODateTime | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Account {
  id: UUID
  user_id: UUID
  name: string
  kind: AccountKind
  color: string
  icon: string | null
  initial_balance: number
  archived: boolean
  sort_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Transaction {
  id: UUID
  user_id: UUID
  type: TransactionType
  amount: number
  category: string | null
  description: string | null
  occurred_on: ISODate
  account: string | null
  account_id: UUID | null
  is_recurring: boolean
  recurrence: Record<string, unknown> | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Budget {
  id: UUID
  user_id: UUID
  category: string
  amount: number
  period: 'monthly' | 'weekly'
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface SavingsGoal {
  id: UUID
  user_id: UUID
  name: string
  target_amount: number
  current_amount: number
  deadline: ISODate | null
  color: string
  achieved: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface SavingsRule {
  id: UUID
  user_id: UUID
  goal_id: UUID | null
  kind: 'percent' | 'fixed'
  value: number
  trigger: 'on_income' | 'monthly'
  is_active: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface CalendarEvent {
  id: UUID
  user_id: UUID
  title: string
  starts_at: ISODateTime
  ends_at: ISODateTime | null
  all_day: boolean
  type: string
  course_id: UUID | null
  location: string | null
  notes: string | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Reminder {
  id: UUID
  user_id: UUID
  title: string
  body: string | null
  remind_at: ISODateTime
  source_type: string | null
  source_id: UUID | null
  channel: 'local' | 'push' | 'both'
  sent: boolean
  sent_at: ISODateTime | null
  created_at: ISODateTime
}

export interface AppNotification {
  id: UUID
  user_id: UUID
  title: string
  body: string | null
  type: string
  read: boolean
  action_url: string | null
  created_at: ISODateTime
}

export interface WeeklyReview {
  id: UUID
  user_id: UUID
  week_start: ISODate
  went_well: string | null
  went_wrong: string | null
  next_priorities: string | null
  metrics: Record<string, unknown>
  created_at: ISODateTime
  updated_at: ISODateTime
}
