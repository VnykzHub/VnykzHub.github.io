import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface GridProps {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 2 | 4 | 6 | 8
  responsive?: boolean
}

export function Grid({ 
  children, 
  className,
  cols = 3,
  gap = 6,
  responsive = true
}: GridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-3 md:grid-cols-6 lg:grid-cols-12'
  }

  return (
    <div className={cn(
      'grid',
      responsive ? gridCols[cols] : `grid-cols-${cols}`,
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}