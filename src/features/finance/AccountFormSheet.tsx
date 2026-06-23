import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { formatCLP } from '@/lib/money'
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from './hooks'
import { ACCOUNT_KIND_OPTIONS } from './accountKinds'
import type { Account, AccountKind } from '@/types/database'

const COLORS = ['#22c55e', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#a855f7', '#ef4444', '#64748b']

export function AccountFormSheet({ account, onClose }: { account?: Account; onClose: () => void }) {
  const create = useCreateAccount()
  const update = useUpdateAccount()
  const remove = useDeleteAccount()
  const editing = Boolean(account)

  const [name, setName] = useState(account?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(account?.kind ?? 'bank')
  const [initial, setInitial] = useState(account?.initial_balance?.toString() ?? '')
  const [color, setColor] = useState(account?.color ?? COLORS[0])

  const initialNum = Number(initial) || 0
  const pending = create.isPending || update.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const values = { name: name.trim(), kind, initial_balance: initialNum, color }
    try {
      if (editing && account) {
        await update.mutateAsync({ id: account.id, values })
        toast.success('Cuenta actualizada')
      } else {
        await create.mutateAsync(values)
        toast.success('Cuenta creada')
      }
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const onDelete = async () => {
    if (!account) return
    if (!window.confirm(`¿Eliminar "${account.name}"? Los movimientos asociados quedarán sin cuenta.`)) return
    try {
      await remove.mutateAsync(account.id)
      toast.success('Cuenta eliminada')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar cuenta' : 'Nueva cuenta / billetera'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="MercadoPago, Banco Ripley, Pluxee beca…"
            autoFocus
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
              {ACCOUNT_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Saldo inicial (CLP)" hint="Lo que tienes hoy en esta cuenta">
            <Input
              type="number"
              inputMode="numeric"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
        {initialNum !== 0 && <span className="-mt-2 text-xs text-muted">{formatCLP(initialNum)}</span>}

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={clsx('h-9 w-9 rounded-full border-2', color === c ? 'border-white' : 'border-transparent')}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        <Button type="submit" fullWidth disabled={pending} className="mt-1">
          {pending ? 'Guardando…' : editing ? 'Guardar' : 'Crear cuenta'}
        </Button>

        {editing && (
          <Button type="button" variant="ghost" fullWidth onClick={onDelete} className="text-danger">
            Eliminar cuenta
          </Button>
        )}
      </form>
    </Sheet>
  )
}
