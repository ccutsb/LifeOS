import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text placeholder:text-muted focus:border-brand focus:outline-none',
        className,
      )}
      {...rest}
    />
  )
}
