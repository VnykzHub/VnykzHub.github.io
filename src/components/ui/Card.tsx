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
        'rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800',
        hover && 'hover:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
        gradient && 'bg-gradient-to-br from-gray-900/50 to-gray-800/50',
        paddingClasses[padding],
        className
      )}
      {...props}  // Spread all props to the div (this includes event handlers)
    >
      {children}
    </div>
  )
}