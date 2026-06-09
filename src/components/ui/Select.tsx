import clsx from 'clsx'
import type { SelectHTMLAttributes } from 'react'

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'w-full appearance-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text focus:border-brand focus:outline-none',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
}
