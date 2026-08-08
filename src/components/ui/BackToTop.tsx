'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-[28px] right-[22px] z-[999] w-10 h-10 rounded-full',
        'bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--ink-faint)]',
        'font-mono text-lg flex items-center justify-center',
        'transition-all duration-300',
        'hover:bg-[var(--panel2)] hover:text-accent-amber',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      )}
    >
      ↑
    </button>
  )
}
