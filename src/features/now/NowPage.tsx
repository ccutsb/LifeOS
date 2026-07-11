import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { X, Play, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { toast } from '@/stores/toast'
import { recommendNow } from '@/lib/planner'
import { describeRecurrence } from '@/lib/recurrence'
import { relativeDue } from '@/lib/dates'
import { useSessionStore, useCurrentEnergy } from '@/stores/session'
import { usePlannerContext } from '@/hooks/usePlannerContext'
import { useFocusStore } from '@/stores/focus'
import { useAreas } from '@/features/areas/hooks'
import { useTasks, useCompleteTask } from '@/features/tasks/hooks'
import type { Energy } from '@/types/database'

const TIME_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 180, label: '2h+' },
]

const ENERGY_OPTIONS: { value: Energy; label: string }[] = [
  { value: 'low', label: '🪫' },
  { value: 'medium', label: '◐' },
  { value: 'high', label: '🔋' },
]

const ENERGY_LABEL: Record<Energy, string> = { low: 'baja', medium: 'media', high: 'alta' }

export function NowPage() {
  const navigate = useNavigate()
  const { data: tasks = [] } = useTasks()
  const { data: areas = [] } = useAreas()
  const complete = useCompleteTask()

  const energy = useCurrentEnergy()
  const setEnergy = useSessionStore((s) => s.setEnergy)
  const availableMinutes = useSessionStore((s) => s.availableMinutes)
  const setAvailableMinutes = useSessionStore((s) => s.setAvailableMinutes)

  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [seed, setSeed] = useState(0) // fuerza re-sorteo en "Otra sugerencia"

  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas])
  const plannerCtx = usePlannerContext()

  const recommendation = useMemo(() => {
    void seed
    return recommendNow(plannerCtx.withoutPaused(tasks), {
      ...plannerCtx,
      energy,
      availableMinutes,
      excludeIds: excluded,
    })
  }, [tasks, plannerCtx, energy, availableMinutes, excluded, seed])

  const task = recommendation?.task
  const area = task?.area_id ? areaById.get(task.area_id) : undefined
  const due = task ? relativeDue(task.due_at) : null
  const focusMinutes = Math.min(task?.estimated_minutes ?? 25, 120)

  const start = () => {
    if (!task) return
    const focus = useFocusStore.getState()
    focus.setPhase('focus')
    focus.setFocusMinutes(focusMinutes)
    focus.start(task.id)
    navigate('/enfoque')
  }

  const another = () => {
    if (!task) return
    setExcluded((s) => new Set(s).add(task.id))
    setSeed((n) => n + 1)
  }

  const doneAlready = () => {
    if (!task) return
    complete.mutate({ task, done: true })
    toast.success('¡Bien ahí! +10 ⚡')
    setSeed((n) => n + 1)
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">¿Qué hago ahora?</h1>
        <button onClick={() => navigate('/')} className="rounded-full p-2 text-muted active:bg-surface" aria-label="Cerrar">
          <X className="h-6 w-6" />
        </button>
      </header>

      {/* Contexto: tiempo y energía */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 shrink-0 text-muted" />
          <ChoiceChips options={TIME_OPTIONS} value={availableMinutes} onChange={(v) => setAvailableMinutes(v ?? 45)} />
        </div>
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 shrink-0 text-muted" />
          <ChoiceChips options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} allowDeselect />
          <span className="text-xs text-muted">
            {energy ? `energía ${ENERGY_LABEL[energy]}` : 'energía sin marcar'}
          </span>
        </div>
      </div>

      {!task ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-lg font-semibold">Nada calza con este momento</p>
          <p className="max-w-xs text-sm text-muted">
            {excluded.size > 0
              ? 'Descartaste todas las candidatas. ¡Quizás es momento de descansar! 🌴'
              : 'Prueba con más tiempo disponible, cambia tu energía o captura algo con el botón +.'}
          </p>
          {excluded.size > 0 && (
            <Button variant="secondary" onClick={() => setExcluded(new Set())}>
              Volver a empezar
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-center text-sm text-muted">Te recomiendo:</p>
          <div
            className="rounded-3xl border-2 p-6 shadow-card"
            style={{ borderColor: area?.color ?? '#6366f1', backgroundColor: `${area?.color ?? '#6366f1'}11` }}
          >
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              {area && (
                <span className="flex items-center gap-1">
                  {area.icon} {area.name}
                </span>
              )}
              {task.recurrence && <span>· ↻ {describeRecurrence(task.recurrence)}</span>}
            </div>
            <h2 className="text-2xl font-bold leading-snug">{task.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {task.estimated_minutes != null && <span>~{task.estimated_minutes} min</span>}
              {due && (
                <span className={clsx(due.overdue ? 'text-danger' : due.soon ? 'text-warning' : '')}>
                  {due.overdue ? 'vencida' : `vence: ${due.label}`}
                </span>
              )}
            </div>
            {task.next_action && (
              <p className="mt-3 rounded-xl bg-surface/70 px-3 py-2 text-sm">
                <span className="text-muted">Primer paso: </span>
                {task.next_action}
              </p>
            )}
            {recommendation.reasons.length > 0 && (
              <p className="mt-3 text-xs text-muted">
                ¿Por qué? {recommendation.reasons.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>

          <Button fullWidth onClick={start} className="mt-5 !py-4 text-base">
            <Play className="h-5 w-5" fill="currentColor" /> Empezar ({focusMinutes} min de enfoque)
          </Button>

          <div className="mt-3 flex justify-center gap-6 text-sm">
            <button onClick={another} className="py-2 text-muted active:text-text">
              Otra sugerencia
            </button>
            <button onClick={doneAlready} className="py-2 text-success">
              Ya la hice ✓
            </button>
          </div>
        </>
      )}
    </div>
  )
}
