import { cn } from '@/utils/cn'
import { InputHTMLAttributes } from 'react'

interface GameSliderProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Formatted value shown beside the slider, mono. */
  displayValue?: string
}

/** Site-styled range input with a mono readout. */
export function GameSlider({ className, displayValue, ...props }: GameSliderProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <input
        type="range"
        className={cn('w-36 accent-[var(--accent-1)]', className)}
        {...props}
      />
      {displayValue !== undefined && (
        <strong className="min-w-[44px] font-mono text-[13px] font-semibold text-[var(--accent-1)]">
          {displayValue}
        </strong>
      )}
    </span>
  )
}
