import { cn } from '@/utils/cn'
import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  className?: string
  id?: string
  fullHeight?: boolean
  centered?: boolean
}

export function Section({ 
  children, 
  className,
  id,
  fullHeight = false,
  centered = false
}: SectionProps) {
  return (
    <section 
      id={id}
      className={cn(
        'py-16 md:py-24 lg:py-32',
        fullHeight && 'min-h-screen',
        centered && 'flex items-center justify-center',
        className
      )}
    >
      {children}
    </section>
  )
}