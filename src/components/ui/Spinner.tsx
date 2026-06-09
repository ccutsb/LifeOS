import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-6 w-6 animate-spin text-muted', className)} />
}
