import { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { Link as ScrollLink } from 'react-scroll'
import type { NavItem } from '@/data/navigation'

interface NavItemLinkProps {
  item: NavItem
  children: ReactNode
  className?: string
  /** Applied by react-scroll's spy while the target section is in view. */
  activeClassName?: string
  onClick?: () => void
}

/**
 * Resolves a nav item to the right kind of link.
 *
 * Sections of the home page are smooth-scrolled when you are already on the
 * home page, but from /writing there is nothing to scroll to — those become
 * ordinary navigations to /#section, which App's ScrollToTop then lands.
 */
export function NavItemLink({
  item,
  children,
  className,
  activeClassName,
  onClick,
}: NavItemLinkProps) {
  const { pathname } = useLocation()

  if (item.kind === 'route') {
    return (
      <RouterLink to={item.href} className={className} onClick={onClick}>
        {children}
      </RouterLink>
    )
  }

  if (pathname === '/') {
    return (
      <ScrollLink
        to={item.href}
        smooth
        duration={500}
        offset={-80}
        spy
        activeClass={activeClassName}
        className={className}
        onClick={onClick}
      >
        {children}
      </ScrollLink>
    )
  }

  return (
    <RouterLink to={`/#${item.href}`} className={className} onClick={onClick}>
      {children}
    </RouterLink>
  )
}
