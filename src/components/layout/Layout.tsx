import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { SkipLink, BackToTop } from '@/components/ui'
import { cn } from '@/utils/cn'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div
      // AnimatedSection's slideLeft/slideRight park their children at x: ±20
      // until they scroll into view, which pushes past the viewport edge on
      // narrow screens and lets the page pan sideways. `clip` kills that
      // without creating a scroll container — `hidden` would, and that breaks
      // position: sticky for the article's table of contents.
      className="min-h-screen overflow-x-clip text-[var(--ink)] transition-colors duration-[400ms]"
      style={{
        background: `var(--paper)`,
        backgroundImage: `linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)`,
        backgroundSize: '56px 56px'
      }}
    >
      <SkipLink />
      <Header />
      <main id="main-content" className={cn('pt-16 md:pt-20', className)}>
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
