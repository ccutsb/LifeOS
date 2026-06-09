import { useState } from 'react'
import { Plus, Zap, Trash2, Gift } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { useProfile } from '@/hooks/useProfile'
import { useRewards, useRedeemReward, useDeleteReward } from './hooks'
import { RewardFormSheet } from './RewardFormSheet'

export function RewardsPage() {
  const { data: profile } = useProfile()
  const { data: rewards = [], isLoading } = useRewards()
  const redeem = useRedeemReward()
  const del = useDeleteReward()
  const [showForm, setShowForm] = useState(false)

  const points = profile?.points ?? 0

  const onRedeem = (rewardTitle: string, cost: number, id: string) => {
    const reward = rewards.find((r) => r.id === id)
    if (!reward) return
    if (points < cost) {
      toast.error('Te faltan puntos para esto')
      return
    }
    redeem.mutate(reward, {
      onSuccess: () => toast.success(`¡Canjeado: ${rewardTitle}! 🎉`),
      onError: (e) => toast.error(errorMessage(e)),
    })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Recompensas"
        subtitle="Convierte esfuerzo en premios"
        action={
          <Button onClick={() => setShowForm(true)} className="!px-3" aria-label="Nueva recompensa">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <Card className="mb-5 flex items-center justify-between bg-gradient-to-br from-brand/20 to-warning/10">
        <div>
          <p className="text-sm text-muted">Tus puntos</p>
          <p className="flex items-center gap-1 text-4xl font-bold text-warning">
            <Zap className="h-7 w-7" /> {points}
          </p>
        </div>
        <p className="max-w-[9rem] text-right text-[11px] text-muted">
          +10 por tarea · +5 por hábito · +15 por pomodoro
        </p>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : rewards.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-10 w-10" />}
          title="Define tus recompensas"
          hint="Crea premios que te motiven (una serie, salir con amigos, un antojo). Gánatelos con tus puntos."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Nueva recompensa
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rewards.map((r) => {
            const affordable = points >= r.cost
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">{r.icon ?? '🎁'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="flex items-center gap-1 text-sm text-warning">
                    <Zap className="h-3.5 w-3.5" /> {r.cost}
                  </p>
                </div>
                <Button
                  variant={affordable ? 'primary' : 'secondary'}
                  onClick={() => onRedeem(r.title, r.cost, r.id)}
                  disabled={!affordable || redeem.isPending}
                  className="!px-3 !py-2 text-xs"
                >
                  Canjear
                </Button>
                <button
                  onClick={() => del.mutate(r.id)}
                  className="rounded-lg p-1.5 text-muted active:bg-surface-2"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showForm && <RewardFormSheet onClose={() => setShowForm(false)} />}
    </div>
  )
}
