import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  // Bloquea el scroll del fondo mientras el sheet está abierto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-slide-up rounded-t-3xl border-t border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted active:bg-surface-2"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto px-4 py-4 pb-safe">{children}</div>
      </div>
    </div>
  )
}
