import clsx from 'clsx'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { Input } from '@/components/ui/Input'
import { WEEKDAYS_SHORT } from '@/lib/dates'
import { describeRecurrence } from '@/lib/recurrence'
import type { Recurrence } from '@/types/database'

type Freq = 'none' | 'daily' | 'weekly' | 'interval' | 'monthly'

const FREQ_OPTIONS: { value: Freq; label: string }[] = [
  { value: 'none', label: 'No' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'interval', label: 'Cada N días' },
  { value: 'monthly', label: 'Mensual' },
]

/** Editor de recurrencia compartido (captura rápida + formulario de tarea). */
export function RecurrencePicker({
  value,
  onChange,
}: {
  value: Recurrence | null
  onChange: (r: Recurrence | null) => void
}) {
  const freq: Freq = value?.freq ?? 'none'

  const setFreq = (f: Freq | null) => {
    const today = new Date()
    switch (f) {
      case 'daily':
        onChange({ freq: 'daily' })
        break
      case 'weekly':
        onChange({ freq: 'weekly', byweekday: [today.getDay()] })
        break
      case 'interval':
        onChange({ freq: 'interval', days: 15 })
        break
      case 'monthly':
        onChange({ freq: 'monthly', bymonthday: today.getDate() })
        break
      default:
        onChange(null)
    }
  }

  const toggleWeekday = (d: number) => {
    if (value?.freq !== 'weekly') return
    const set = new Set(value.byweekday)
    if (set.has(d)) set.delete(d)
    else set.add(d)
    if (set.size === 0) set.add(d) // al menos un día
    onChange({ freq: 'weekly', byweekday: [...set].sort((a, b) => a - b) })
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ChoiceChips options={FREQ_OPTIONS} value={freq} onChange={setFreq} />

      {value?.freq === 'weekly' && (
        <div className="flex gap-1.5">
          {WEEKDAYS_SHORT.map((label, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleWeekday(d)}
              className={clsx(
                'h-9 w-9 rounded-full text-xs font-semibold transition',
                value.byweekday.includes(d) ? 'bg-brand text-white' : 'bg-surface-2 text-muted',
              )}
            >
              {label[0]}
            </button>
          ))}
        </div>
      )}

      {value?.freq === 'interval' && (
        <div className="flex items-center gap-2 text-sm text-muted">
          cada
          <Input
            type="number"
            inputMode="numeric"
            min={2}
            max={365}
            value={value.days}
            onChange={(e) => onChange({ freq: 'interval', days: Math.max(2, Number(e.target.value) || 2) })}
            className="!w-20 !py-2 text-center"
          />
          días
        </div>
      )}

      {value?.freq === 'monthly' && (
        <div className="flex items-center gap-2 text-sm text-muted">
          el día
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={value.bymonthday}
            onChange={(e) =>
              onChange({ freq: 'monthly', bymonthday: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })
            }
            className="!w-20 !py-2 text-center"
          />
          de cada mes
        </div>
      )}

      {value && <p className="text-xs text-info">↻ Se repite {describeRecurrence(value)}</p>}
    </div>
  )
}
