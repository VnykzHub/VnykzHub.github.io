'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/data/navigation'

interface NavItemLinkProps {
  item: NavItem
  children: ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Resolves a nav item to the right kind of link.
 *
 * react-scroll is deferred until after hydration — it accesses browser APIs
 * (Events.scrollEvent) that are undefined during SSR.
 */
export function NavItemLink({
  item,
  children,
  className,
  onClick,
}: NavItemLinkProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (item.kind === 'route') {
    return (
      <Link href={item.href} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (pathname === '/' && mounted) {
    const ScrollLink = require('react-scroll').Link
    return (
      <ScrollLink
        to={item.href}
        smooth
        duration={500}
        offset={-80}
        className={className}
        onClick={onClick}
      >
        {children}
      </ScrollLink>
    )
  }

  if (pathname === '/' && !mounted) {
    return (
      <a href={`#${item.href}`} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <Link href={`/#${item.href}`} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
