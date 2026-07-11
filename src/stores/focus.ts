import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/crud'
import { queryClient } from '@/lib/queryClient'
import { qk } from '@/lib/queryKeys'
import { toast } from './toast'

export type Phase = 'focus' | 'short_break' | 'long_break'
export const POINTS_PER_POMODORO = 15

export interface FocusSettings {
  focus: number
  short: number
  long: number
  longEvery: number
}

interface FocusState {
  phase: Phase
  isRunning: boolean
  secondsLeft: number
  pomodoros: number
  taskId: string | null
  settings: FocusSettings
  start: (taskId?: string | null) => void
  pause: () => void
  resume: () => void
  reset: () => void
  skip: () => void
  setPhase: (p: Phase) => void
  setFocusMinutes: (m: number) => void
}

const DEFAULTS: FocusSettings = { focus: 25, short: 5, long: 15, longEvery: 4 }
const durationFor = (phase: Phase, s: FocusSettings) =>
  (phase === 'focus' ? s.focus : phase === 'short_break' ? s.short : s.long) * 60

let interval: ReturnType<typeof setInterval> | null = null
let endsAt = 0

function notify(title: string, body: string) {
  toast.success(title)
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body })
  } catch {
    /* noop */
  }
}

export const useFocusStore = create<FocusState>((set, get) => {
  const stop = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  const tick = () => {
    const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
    if (remaining <= 0) {
      set({ secondsLeft: 0 })
      void complete()
    } else {
      set({ secondsLeft: remaining })
    }
  }

  const run = () => {
    stop()
    interval = setInterval(tick, 250)
  }

  const complete = async () => {
    stop()
    const { phase, settings, pomodoros, taskId } = get()
    if (phase === 'focus') {
      try {
        const user_id = await getUserId()
        // Los puntos (+15) los otorga la BD al insertar la sesión completada (trigger).
        await supabase.from('focus_sessions').insert({
          user_id,
          task_id: taskId,
          kind: 'focus',
          planned_minutes: settings.focus,
          actual_minutes: settings.focus,
          completed: true,
          ended_at: new Date().toISOString(),
        })
        queryClient.invalidateQueries({ queryKey: qk.profile })
        queryClient.invalidateQueries({ queryKey: qk.focusSessions })
      } catch {
        /* offline: se omite el guardado */
      }
      const count = pomodoros + 1
      const next: Phase = count % settings.longEvery === 0 ? 'long_break' : 'short_break'
      notify('¡Pomodoro completado! 🍅', 'Tómate un descanso.')
      set({ pomodoros: count, phase: next, isRunning: false, secondsLeft: durationFor(next, settings) })
    } else {
      notify('Descanso terminado', 'A enfocarte de nuevo.')
      set({ phase: 'focus', isRunning: false, secondsLeft: durationFor('focus', settings) })
    }
  }

  return {
    phase: 'focus',
    isRunning: false,
    secondsLeft: durationFor('focus', DEFAULTS),
    pomodoros: 0,
    taskId: null,
    settings: DEFAULTS,
    start: (taskId = null) => {
      const s = get()
      endsAt = Date.now() + s.secondsLeft * 1000
      set({ isRunning: true, taskId: taskId ?? s.taskId })
      run()
    },
    pause: () => {
      stop()
      set({ isRunning: false })
    },
    resume: () => {
      endsAt = Date.now() + get().secondsLeft * 1000
      set({ isRunning: true })
      run()
    },
    reset: () => {
      stop()
      const s = get()
      set({ isRunning: false, secondsLeft: durationFor(s.phase, s.settings) })
    },
    skip: () => {
      stop()
      const { phase, settings } = get()
      const next: Phase = phase === 'focus' ? 'short_break' : 'focus'
      set({ phase: next, isRunning: false, secondsLeft: durationFor(next, settings) })
    },
    setPhase: (p) => {
      stop()
      const s = get()
      set({ phase: p, isRunning: false, secondsLeft: durationFor(p, s.settings) })
    },
    setFocusMinutes: (m) => {
      const s = get()
      const settings = { ...s.settings, focus: m }
      set({ settings, secondsLeft: s.isRunning || s.phase !== 'focus' ? s.secondsLeft : m * 60 })
    },
  }
})
