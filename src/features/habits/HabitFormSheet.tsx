import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useLifeGoals } from '@/features/objectives/hooks'
import { useCreateHabit, useUpdateHabit, useDeleteHabit } from './hooks'
import type { Habit, HabitType } from '@/types/database'

const PRESETS: { type: HabitType; name: string; icon: string; color: string }[] = [
  { type: 'sleep', name: 'Dormir 7–8 h', icon: '😴', color: '#6366f1' },
  { type: 'attendance', name: 'Asistir a clases', icon: '🎓', color: '#06b6d4' },
  { type: 'study', name: 'Estudiar', icon: '📚', color: '#22c55e' },
  { type: 'exercise', name: 'Ejercicio', icon: '🏃', color: '#f59e0b' },
  { type: 'food', name: 'Comer bien', icon: '🥗', color: '#ec4899' },
  { type: 'custom', name: '', icon: '⭐', color: '#a855f7' },
]

export function HabitFormSheet({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const create = useCreateHabit()
  const update = useUpdateHabit()
  const del = useDeleteHabit()
  const { data: goals = [] } = useLifeGoals()
  const editing = Boolean(habit)

  const [type, setType] = useState<HabitType>(habit?.type ?? 'study')
  const [goalId, setGoalId] = useState(habit?.goal_id ?? '')
  const [name, setName] = useState(habit?.name ?? PRESETS.find((p) => p.type === 'study')!.name)
  const [icon, setIcon] = useState(habit?.icon ?? '📚')
  const [color, setColor] = useState(habit?.color ?? '#22c55e')
  const [cue, setCue] = useState(habit?.cue ?? '')
  const [reward, setReward] = useState(habit?.reward ?? '')
  const [reminder, setReminder] = useState(habit?.reminder_time?.slice(0, 5) ?? '')

  const saving = create.isPending || update.isPending

  const pickPreset = (p: (typeof PRESETS)[number]) => {
    setType(p.type)
    setIcon(p.icon)
    setColor(p.color)
    if (p.type !== 'custom') setName(p.name)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const values = {
      name: name.trim(),
      type,
      icon,
      color,
      cue: cue.trim() || null,
      reward: reward.trim() || null,
      reminder_time: reminder || null,
      goal_id: goalId || null,
    }
    try {
      if (editing && habit) {
        await update.mutateAsync({ id: habit.id, values })
        toast.success('Hábito actualizado')
      } else {
        await create.mutateAsync(values)
        toast.success('Hábito creado')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    if (!habit || !confirm(`¿Eliminar el hábito "${habit.name}"?`)) return
    try {
      await del.mutateAsync(habit.id)
      toast.success('Hábito eliminado')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar hábito' : 'Nuevo hábito'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {!editing && (
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => pickPreset(p)}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition',
                  type === p.type ? 'border-brand bg-brand/10' : 'border-border bg-surface-2 text-muted',
                )}
              >
                <span className="text-2xl">{p.icon}</span>
                {p.type === 'custom' ? 'Otro' : p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Estudiar 1 hora" required />
        </Field>

        <Field label="Señal / disparador" hint="Atomic Habits: cuándo o después de qué lo harás">
          <Input value={cue} onChange={(e) => setCue(e.target.value)} placeholder="Después de cenar" />
        </Field>
        <Field label="Recompensa" hint="Algo pequeño e inmediato al cumplir">
          <Input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Un capítulo de mi serie" />
        </Field>
        <Field label="Recordatorio" hint="Te avisaremos a esta hora los días del hábito">
          <Input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} />
        </Field>

        {goals.length > 0 && (
          <Field label="¿Aporta a un objetivo?">
            <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">Ninguno</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Button type="submit" fullWidth disabled={saving} className="mt-1">
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear hábito'}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={remove} className="text-danger">
            Eliminar hábito
          </Button>
        )}
      </form>
    </Sheet>
  )
}
