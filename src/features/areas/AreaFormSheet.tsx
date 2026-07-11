import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useCreateArea, useUpdateArea, useDeleteArea } from './hooks'
import type { LifeArea } from '@/types/database'

const ICONS = ['🎓', '💼', '🏠', '❤️', '💰', '📖', '💻', '🎮', '🧹', '🚗', '🐶', '⭐']
const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899', '#64748b']

export function AreaFormSheet({ area, onClose }: { area?: LifeArea; onClose: () => void }) {
  const create = useCreateArea()
  const update = useUpdateArea()
  const del = useDeleteArea()
  const editing = Boolean(area)

  const [name, setName] = useState(area?.name ?? '')
  const [icon, setIcon] = useState(area?.icon ?? '⭐')
  const [color, setColor] = useState(area?.color ?? COLORS[0])
  const [priority, setPriority] = useState((area?.priority ?? 0) > 0)
  const [active, setActive] = useState(area?.is_active ?? true)

  const saving = create.isPending || update.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const values = {
      name: name.trim(),
      icon,
      color,
      priority: priority ? 1 : 0,
      is_active: active,
    }
    try {
      if (editing && area) {
        await update.mutateAsync({ id: area.id, values })
        toast.success('Área actualizada')
      } else {
        await create.mutateAsync({ ...values, kind: 'custom' })
        toast.success('Área creada')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    if (!area) return
    if (!confirm(`¿Eliminar el área "${area.name}"? Sus tareas quedarán sin área.`)) return
    try {
      await del.mutateAsync(area.id)
      toast.success('Área eliminada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar área' : 'Nueva área'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mascotas" autoFocus required />
        </Field>

        <Field label="Ícono">
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={clsx(
                  'grid h-10 w-10 place-items-center rounded-xl border text-xl',
                  icon === i ? 'border-brand bg-brand/15' : 'border-border',
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={clsx('h-9 w-9 rounded-full border-2', color === c ? 'border-white' : 'border-transparent')}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        <ToggleRow
          active={priority}
          onClick={() => setPriority((v) => !v)}
          label="Área prioritaria"
          hint="Sus tareas suben en el plan del día"
        />
        {editing && (
          <ToggleRow
            active={active}
            onClick={() => setActive((v) => !v)}
            label={active ? 'Área activa' : 'Área en pausa'}
            hint="En pausa no aparece en captura ni en el plan (ej. Universidad en vacaciones)"
          />
        )}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear área'}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={remove} className="text-danger">
            <Trash2 className="h-4 w-4" /> Eliminar área
          </Button>
        )}
      </form>
    </Sheet>
  )
}

function ToggleRow({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition',
        active ? 'border-brand bg-brand/10' : 'border-border bg-surface-2',
      )}
    >
      <span>
        <span className={clsx('block text-sm font-medium', active ? 'text-text' : 'text-muted')}>{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition',
          active ? 'bg-brand' : 'bg-border',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
            active ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}
