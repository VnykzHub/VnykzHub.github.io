import { cn } from '@/utils/cn'
import { ReactNode, HTMLAttributes } from 'react'

// Extend HTMLAttributes to inherit all div props
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  gradient?: boolean
}

export function Card({ 
  children,
  className,
  hover = false,
  padding = 'md',
  gradient = false,
  ...props  // Collect all other props (including onMouseEnter, onMouseLeave, etc.)
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300',
        gradient
          ? 'bg-gradient-to-br from-[var(--panel)] to-[var(--panel2)] border-[var(--panel-border)]'
          : 'bg-[var(--card-bg)] border-[var(--card-border)]',
        hover && 'hover:border-[var(--panel-border)] hover:shadow-[0_16px_48px_-20px_var(--panel-shadow)] hover:scale-[1.02]',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}