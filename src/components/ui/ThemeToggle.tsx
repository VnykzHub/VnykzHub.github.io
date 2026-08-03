import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

/**
 * Rocker switch. Positioning is the caller's job — it sits in the header's
 * right-hand cluster rather than floating over it, so it cannot collide
 * with the CTA button.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      title="Toggle light/dark mode"
      className={cn(
        'flex items-center gap-2 bg-[var(--panel)] border border-[var(--panel-border)] rounded-[28px] px-2.5 py-1.5 cursor-pointer select-none transition-colors duration-400 focus-visible:outline-2 focus-visible:outline-accent-cyan focus-visible:outline-offset-[3px]',
        className
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className={`font-mono text-[10px] tracking-[0.12em] transition-colors duration-300 ${theme === 'dark' ? 'text-[var(--toggle-thumb)] font-semibold' : 'text-[var(--toggle-icon)]'}`}>
        DARK
      </span>
      <span className="w-[42px] h-6 rounded-xl bg-[var(--toggle-track)] relative transition-colors duration-400">
        <span
          className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-[var(--toggle-thumb)] transition-all duration-300 ease-[cubic-bezier(0.3,1.2,0.4,1)] ${theme === 'dark' ? 'left-[3px]' : 'left-[21px]'}`}
        />
      </span>
      <span className={`font-mono text-[10px] tracking-[0.12em] transition-colors duration-300 ${theme === 'light' ? 'text-[var(--toggle-thumb)] font-semibold' : 'text-[var(--toggle-icon)]'}`}>
        LIGHT
      </span>
    </button>
  )
}
