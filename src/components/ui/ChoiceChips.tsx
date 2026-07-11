import clsx from 'clsx'

interface Option<T> {
  value: T
  label: string
}

/** Fila de chips de selección única. `value` null = nada seleccionado. */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  allowDeselect = false,
}: {
  options: Option<T>[]
  value: T | null
  onChange: (v: T | null) => void
  allowDeselect?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(active && allowDeselect ? null : o.value)}
            className={clsx(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
              active ? 'border-brand bg-brand/15 text-brand' : 'border-border bg-surface-2 text-muted',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
