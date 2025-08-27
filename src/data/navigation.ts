import { Home, User, Briefcase, Code2, Mail, Brain } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

export const navigationItems: NavItem[] = [
  { id: 'home', label: 'Home', href: 'home', icon: Home },
  { id: 'about', label: 'About', href: 'about', icon: User },
  { id: 'projects', label: 'Projects', href: 'projects', icon: Code2 },
  { id: 'experience', label: 'Experience', href: 'experience', icon: Briefcase },
  { id: 'skills', label: 'Skills', href: 'skills', icon: Brain },
  { id: 'contact', label: 'Contact', href: 'contact', icon: Mail },
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
