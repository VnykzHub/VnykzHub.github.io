import { cn } from '@/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import './game-tokens.css'

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const VARIANTS = {
  primary:
    'bg-[var(--accent-1)] text-[#151006] border-[var(--accent-1)] enabled:hover:brightness-110',
  ghost:
    'bg-[var(--card-bg)] text-[var(--ink)] border-[var(--ink-faint)]/60 enabled:hover:border-[var(--accent-1)] enabled:hover:text-[var(--accent-1)]',
  danger: 'bg-[var(--accent-3)] text-[#fff8f2] border-[var(--accent-3)] enabled:hover:brightness-110',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-[10px]',
  md: 'px-4 py-2 text-[11px]',
}

/** Site-styled instrument control: small, mono, uppercase, hairline borders. */
export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant = 'ghost', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-sm border font-mono font-semibold uppercase tracking-[0.08em] transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-30 disabled:border-[var(--rule)] disabled:bg-transparent disabled:text-[var(--ink-faint)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-2)]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  )
)

GameButton.displayName = 'GameButton'
