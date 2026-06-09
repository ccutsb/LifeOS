import clsx from 'clsx'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text placeholder:text-muted focus:border-brand focus:outline-none',
        className,
      )}
      {...rest}
    />
  )
}
