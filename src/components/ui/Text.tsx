import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface TextProps {
  children: ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  className?: string
  muted?: boolean
  mono?: boolean
  as?: 'p' | 'span' | 'div'
}

export function Text({
  children,
  size = 'base',
  className,
  muted = false,
  mono = false,
  as: Component = 'p'
}: TextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <Component
      className={cn(
        'font-serif',
        sizeClasses[size],
        muted && 'text-[var(--ink-soft)]',
        mono && 'font-mono',
        className
      )}
    >
      {children}
    </Component>
  )
}
