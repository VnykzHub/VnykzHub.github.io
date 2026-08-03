import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface EyebrowProps {
  children: ReactNode
  className?: string
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <div
      className={cn(
        'font-mono text-xs tracking-[0.18em] uppercase text-accent-amber',
        'flex items-center gap-2.5 mb-3.5',
        'after:content-[""] after:flex-1 after:h-px after:bg-[var(--rule)]',
        className
      )}
    >
      {children}
    </div>
  )
}
