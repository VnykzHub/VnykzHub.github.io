import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface TextProps {
  children: ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  className?: string
  muted?: boolean
  as?: 'p' | 'span' | 'div'
}

export function Text({ 
  children,
  size = 'base',
  className,
  muted = false,
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
        sizeClasses[size],
        muted && 'text-gray-400',
        className
      )}
    >
      {children}
    </Component>
  )
}
