import { useState, useEffect } from 'react'
import { Link as ScrollLink } from 'react-scroll'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Github, Linkedin, Mail } from 'lucide-react'
import { Container } from '@/components/common'
import { Button } from '@/components/ui'
import { navigationItems, socialLinks } from '@/data/navigation'
import { cn } from '@/utils/cn'
import { useMediaQuery } from '@/hooks'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on desktop resize
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobile, isMobileMenuOpen])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-gray-950/80 backdrop-blur-lg border-b border-gray-800'
            : 'bg-transparent'
        )}
      >
        <Container>
          <nav className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <ScrollLink
              to="home"
              smooth
              duration={500}
              className="cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gradient"
              >
                VM
              </motion.div>
            </ScrollLink>

            {/* Desktop Navigation */}
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hidden md:flex items-center gap-8"
            >
              {navigationItems.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <ScrollLink
                    to={item.href}
                    smooth
                    duration={500}
                    offset={-80}
                    spy
                    activeClass="text-accent-cyan"
                    className="text-gray-300 hover:text-accent-cyan transition-colors cursor-pointer"
                  >
                    {item.label}
                  </ScrollLink>
                </motion.li>
              ))}
            </motion.ul>

            {/* Desktop CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block"
            >
              <Button size="sm" className="shadow-lg">
                Download Resume
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-accent-cyan transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </nav>
        </Container>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

// Mobile Menu Component
function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 md:hidden"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
      />

      {/* Menu Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800"
      >
        <div className="flex flex-col h-full pt-20 pb-6 px-6">
          {/* Navigation Links */}
          <nav className="flex-1">
            <ul className="space-y-4">
              {navigationItems.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ScrollLink
                    to={item.href}
                    smooth
                    duration={500}
                    offset={-80}
                    onClick={onClose}
                    className="flex items-center gap-3 text-lg text-gray-300 hover:text-accent-cyan transition-colors cursor-pointer py-2"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </ScrollLink>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Social Links */}
          <div className="flex items-center gap-4 mb-6">
            {socialLinks.map((link) => {
              // Map icon names to components
              const iconMap = {
                github: Github,
                linkedin: Linkedin,
                mail: Mail
              }
              const Icon = iconMap[link.icon as keyof typeof iconMap]
              
              return (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.id === 'email' ? undefined : '_blank'}
                  rel={link.id === 'email' ? undefined : 'noopener noreferrer'}
                  className="text-gray-400 hover:text-accent-cyan transition-colors"
                >
                  <Icon size={24} />
                </a>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
