import { cn } from '@/utils/cn'
import { SelectHTMLAttributes, forwardRef } from 'react'

/** Site-styled native select for game options. */
export const GameSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'rounded-sm border border-[var(--rule)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-2)]',
        className
      )}
      {...props}
    />
  )
)

GameSelect.displayName = 'GameSelect'
