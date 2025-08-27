import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  return (
    <div
      className={cn(
        'bg-gray-800',
        animations[animation],
        variants[variant],
        className
      )}
    />
  )
}
