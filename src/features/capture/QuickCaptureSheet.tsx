import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { endOfDay, addDays } from 'date-fns'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { firstDue } from '@/lib/recurrence'
import { useAreas } from '@/features/areas/hooks'
import { useCreateTask } from '@/features/tasks/hooks'
import { RecurrencePicker } from './RecurrencePicker'
import type { Energy, Recurrence } from '@/types/database'

const LAST_AREA_KEY = 'lifeos-last-area'

const DURATIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
]

const ENERGIES: { value: Energy; label: string }[] = [
  { value: 'low', label: '🪫 Baja' },
  { value: 'medium', label: '◐ Media' },
  { value: 'high', label: '🔋 Alta' },
]

const DUES = [
  { value: 'none', label: 'Sin fecha' },
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
]

/**
 * Captura rápida global (FAB central). Filosofía: solo el título es
 * obligatorio; todo lo demás son chips opcionales de 1 toque.
 */
export function QuickCaptureSheet({
  defaultAreaId,
  onClose,
}: {
  defaultAreaId?: string
  onClose: () => void
}) {
  const { data: areas = [] } = useAreas()
  const create = useCreateTask()

  const [title, setTitle] = useState('')
  const [areaId, setAreaId] = useState<string | null>(
    defaultAreaId ?? localStorage.getItem(LAST_AREA_KEY),
  )
  const [minutes, setMinutes] = useState<number | null>(null)
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null)
  const [due, setDue] = useState<'none' | 'today' | 'tomorrow'>('none')

  const activeAreas = areas.filter((a) => a.is_active)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let due_at: string | null = null
    if (recurrence) due_at = firstDue(recurrence).toISOString()
    else if (due === 'today') due_at = endOfDay(new Date()).toISOString()
    else if (due === 'tomorrow') due_at = endOfDay(addDays(new Date(), 1)).toISOString()

    try {
      await create.mutateAsync({
        title: title.trim(),
        status: 'pending',
        area_id: areaId,
        estimated_minutes: minutes,
        energy,
        recurrence,
        due_at,
      })
      if (areaId) localStorage.setItem(LAST_AREA_KEY, areaId)
      toast.success('Capturada ✓')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title="Captura rápida">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué hay que hacer?"
          autoFocus
          required
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">Área</p>
          <div className="flex flex-wrap gap-2">
            {activeAreas.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAreaId(areaId === a.id ? null : a.id)}
                className={clsx(
                  'flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
                  areaId === a.id ? 'border-brand bg-brand/15 text-text' : 'border-border bg-surface-2 text-muted',
                )}
              >
                <span>{a.icon}</span> {a.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">¿Cuánto dura?</p>
          <ChoiceChips options={DURATIONS} value={minutes} onChange={setMinutes} allowDeselect />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">¿Se repite?</p>
          <RecurrencePicker value={recurrence} onChange={setRecurrence} />
        </div>

        {!recurrence && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted">¿Para cuándo?</p>
            <ChoiceChips
              options={DUES}
              value={due}
              onChange={(v) => setDue((v as typeof due) ?? 'none')}
            />
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">Energía que requiere</p>
          <ChoiceChips options={ENERGIES} value={energy} onChange={setEnergy} allowDeselect />
        </div>

        <Button type="submit" fullWidth disabled={create.isPending}>
          {create.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </form>
    </Sheet>
  )
}
