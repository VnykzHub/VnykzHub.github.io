import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface HeadingProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  className?: string
  gradient?: boolean
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm md:text-base',
  md: 'text-lg md:text-xl',
  lg: 'text-xl md:text-2xl',
  xl: 'text-2xl md:text-3xl',
  '2xl': 'text-3xl md:text-4xl',
  '3xl': 'text-4xl md:text-5xl',
  '4xl': 'text-5xl md:text-6xl',
  '5xl': 'text-6xl md:text-7xl'
}

export function Heading({ 
  children, 
  as: Component = 'h2',
  size = 'xl',
  className,
  gradient = false
}: HeadingProps) {
  return (
    <Component 
      className={cn(
        'font-bold tracking-tight',
        sizeClasses[size],
        gradient && 'text-gradient',
        className
      )}
    >
      {children}
    </Component>
  )
}