import clsx from 'clsx'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl border border-border bg-surface p-4 shadow-card', className)}
      {...rest}
    />
  )
}
