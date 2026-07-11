import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-brand to-brand-2 text-white shadow-lg shadow-brand/30 active:scale-[0.98]',
  secondary: 'bg-surface-2 text-text active:bg-border',
  ghost: 'bg-transparent text-muted active:bg-surface',
  danger: 'bg-danger text-white shadow-lg shadow-danger/25 active:scale-[0.98]',
}

export function Button({ variant = 'primary', fullWidth, className, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    />
  )
}
