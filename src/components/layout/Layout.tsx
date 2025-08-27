import { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { cn } from '@/utils/cn'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main className={cn('pt-16 md:pt-20', className)}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
