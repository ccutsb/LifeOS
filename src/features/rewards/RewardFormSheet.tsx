import { useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useCreateReward } from './hooks'

const EMOJIS = ['🎮', '🍿', '☕', '🍔', '🛌', '🎧', '🛒', '🏖️']

export function RewardFormSheet({ onClose, preset }: { onClose: () => void; preset?: { title: string; cost: number; icon: string } }) {
  const create = useCreateReward()
  const [title, setTitle] = useState(preset?.title ?? '')
  const [cost, setCost] = useState(preset?.cost?.toString() ?? '100')
  const [icon, setIcon] = useState(preset?.icon ?? '🎮')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await create.mutateAsync({ title: title.trim(), cost: Number(cost) || 0, icon })
      toast.success('Recompensa creada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title="Nueva recompensa">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Recompensa">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1 hora de videojuegos" autoFocus required />
        </Field>
        <Field label="Costo en puntos">
          <Input type="number" inputMode="numeric" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Ícono">
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setIcon(e)}
                className={`grid h-10 w-10 place-items-center rounded-xl border text-xl ${icon === e ? 'border-brand bg-brand/15' : 'border-border'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </Field>
        <Button type="submit" fullWidth disabled={create.isPending} className="mt-1">
          {create.isPending ? 'Guardando…' : 'Crear recompensa'}
        </Button>
      </form>
    </Sheet>
  )
}
