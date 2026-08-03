import { Home, User, Briefcase, Code2, Mail, Brain, PenLine } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  /** Section id when kind is 'scroll'; an absolute path when kind is 'route'. */
  href: string
  icon: LucideIcon
  /**
   * 'scroll' targets a section of the home page — smooth-scrolled in place, or
   * navigated to as /#id from another route. 'route' is a page of its own.
   */
  kind: 'scroll' | 'route'
}

export const navigationItems: NavItem[] = [
  { id: 'home', label: 'Home', href: 'home', icon: Home, kind: 'scroll' },
  { id: 'about', label: 'About', href: 'about', icon: User, kind: 'scroll' },
  { id: 'projects', label: 'Projects', href: 'projects', icon: Code2, kind: 'scroll' },
  { id: 'experience', label: 'Experience', href: 'experience', icon: Briefcase, kind: 'scroll' },
  { id: 'blog', label: 'Blog', href: '/blog', icon: PenLine, kind: 'route' },
  { id: 'skills', label: 'Skills', href: 'skills', icon: Brain, kind: 'scroll' },
  { id: 'contact', label: 'Contact', href: 'contact', icon: Mail, kind: 'scroll' },
]

export const socialLinks = [
  { 
    id: 'github',
    label: 'GitHub', 
    href: 'https://github.com/VnykzHub',
    icon: 'github'
  },
  { 
    id: 'linkedin',
    label: 'LinkedIn', 
    href: 'https://linkedin.com/in/vinayakmathur2000/', // Update this
    icon: 'linkedin'
  },
  { 
    id: 'email',
    label: 'Email', 
    href: 'mailto:vinayak.k.mathur@gmail.com', // Update this
    icon: 'mail'
  }
]
