import { cn } from '@/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label?: string
}

/** In-page tab strip: mono uppercase buttons with a brass underline on the active one. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-x-1 border-b border-[var(--rule)]">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'cursor-pointer border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-2)]',
              active
                ? 'border-[var(--accent-1)] text-[var(--accent-1)]'
                : 'border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-soft)]'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
