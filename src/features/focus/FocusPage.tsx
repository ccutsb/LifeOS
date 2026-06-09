import { useState } from 'react'
import clsx from 'clsx'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useFocusStore, type Phase } from '@/stores/focus'
import { useTasks } from '@/features/tasks/hooks'
import { useFocusSessions } from './hooks'
import { dateKey, WEEKDAYS_SHORT } from '@/lib/dates'

const PHASE_LABEL: Record<Phase, string> = {
  focus: 'Enfoque',
  short_break: 'Descanso',
  long_break: 'Descanso largo',
}

export function FocusPage() {
  const {
    phase,
    isRunning,
    secondsLeft,
    pomodoros,
    settings,
    taskId,
    start,
    pause,
    resume,
    reset,
    skip,
    setPhase,
    setFocusMinutes,
  } = useFocusStore()
  const { data: tasks = [] } = useTasks()
  const { data: sessions = [] } = useFocusSessions()
  const [selectedTask, setSelectedTask] = useState<string>('')

  const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const total = (phase === 'focus' ? settings.focus : phase === 'short_break' ? settings.short : settings.long) * 60
  const progress = total > 0 ? secondsLeft / total : 0
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const isFresh = !isRunning && secondsLeft === total

  // Anillo SVG
  const R = 130
  const C = 2 * Math.PI * R
  const ringColor = phase === 'focus' ? '#6366f1' : '#22c55e'

  const currentTaskTitle = taskId ? tasks.find((t) => t.id === taskId)?.title : undefined

  // Estadísticas semanales
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const focusDone = sessions.filter((s) => s.kind === 'focus' && s.completed)
  const minByDay = days.map((d) =>
    focusDone
      .filter((s) => dateKey(new Date(s.started_at)) === dateKey(d))
      .reduce((sum, s) => sum + (s.actual_minutes ?? s.planned_minutes), 0),
  )
  const maxMin = Math.max(60, ...minByDay)
  const totalMin = minByDay.reduce((a, b) => a + b, 0)

  const primary = isRunning
    ? { label: 'Pausar', icon: Pause, onClick: pause }
    : isFresh
      ? { label: 'Iniciar', icon: Play, onClick: () => start(selectedTask || null) }
      : { label: 'Reanudar', icon: Play, onClick: resume }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Enfoque" subtitle="Deep Work · una cosa a la vez" />

      {/* Selector de fase */}
      <div className="mb-5 flex gap-1 rounded-xl bg-surface p-1">
        {(['focus', 'short_break', 'long_break'] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={clsx(
              'flex-1 rounded-lg py-2 text-xs font-medium transition',
              phase === p ? 'bg-surface-2 text-text' : 'text-muted',
            )}
          >
            {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Anillo / cuenta regresiva */}
      <div className="relative mx-auto my-2 grid h-72 w-72 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r={R} fill="none" stroke="#1a2234" strokeWidth="16" />
          <circle
            cx="150"
            cy="150"
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="text-center">
          <p className="text-6xl font-bold tabular-nums">
            {mm}:{ss}
          </p>
          <p className="mt-1 text-sm text-muted">{PHASE_LABEL[phase]}</p>
          {currentTaskTitle && isRunning && (
            <p className="mt-1 max-w-[12rem] truncate text-xs text-brand">{currentTaskTitle}</p>
          )}
        </div>
      </div>

      {/* Duración + tarea (solo enfoque en reposo) */}
      {phase === 'focus' && isFresh && (
        <div className="mb-4 space-y-3">
          <div className="flex justify-center gap-2">
            {[25, 50].map((m) => (
              <button
                key={m}
                onClick={() => setFocusMinutes(m)}
                className={clsx(
                  'rounded-full border px-4 py-1.5 text-sm',
                  settings.focus === m ? 'border-brand bg-brand/15 text-brand' : 'border-border text-muted',
                )}
              >
                {m} min
              </button>
            ))}
          </div>
          {activeTasks.length > 0 && (
            <Select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
              <option value="">Enfocarme en… (opcional)</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* Controles */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="grid h-12 w-12 place-items-center rounded-full border border-border text-muted active:bg-surface"
          aria-label="Reiniciar"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          onClick={primary.onClick}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white active:scale-95"
          aria-label={primary.label}
        >
          <primary.icon className="h-7 w-7" fill="currentColor" />
        </button>
        <button
          onClick={skip}
          className="grid h-12 w-12 place-items-center rounded-full border border-border text-muted active:bg-surface"
          aria-label="Saltar"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Estadísticas semanales */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Esta semana</h3>
          <span className="text-sm text-muted">
            {Math.round(totalMin / 60)} h {totalMin % 60} min · {focusDone.length} 🍅
          </span>
        </div>
        <div className="flex h-24 items-end justify-between gap-1.5">
          {minByDay.map((min, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-brand transition-all"
                  style={{ height: `${(min / maxMin) * 100}%`, minHeight: min > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-[10px] text-muted">{WEEKDAYS_SHORT[days[i].getDay()][0]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
