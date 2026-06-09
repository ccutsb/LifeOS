import clsx from 'clsx'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToastStore, type ToastType } from '@/stores/toast'

const icon: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
const tone: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-safe">
      <div className="mt-2 flex w-full max-w-md flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icon[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-slide-up items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm shadow-card"
            >
              <Icon className={clsx('h-5 w-5 shrink-0', tone[t.type])} />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
