import { Container } from '@/components/common'
import { Text } from '@/components/ui'
import { Github, Linkedin, Mail, Heart, ExternalLink } from 'lucide-react'
import { navigationItems } from '@/data/navigation'
import { Link as ScrollLink } from 'react-scroll'

const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">
              Vinayak Mathur
            </h3>
            <Text muted className="mb-4 max-w-md">
              AI Engineer specializing in Machine Learning, Deep Learning, 
              and Generative AI. Building intelligent solutions that make a difference.
            </Text>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/VnykzHub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent-cyan transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://linkedin.com/in/vinayakmathur2000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent-cyan transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="mailto:vinayak.k.mathur@gmail.com"
                className="text-gray-400 hover:text-accent-cyan transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-100 uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {navigationItems.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <ScrollLink
                    to={item.href}
                    smooth
                    duration={500}
                    offset={-80}
                    className="text-gray-400 hover:text-accent-cyan transition-colors cursor-pointer text-sm"
                  >
                    {item.label}
                  </ScrollLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-100 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/resume.pdf"
                  className="text-gray-400 hover:text-accent-cyan transition-colors text-sm inline-flex items-center gap-1"
                >
                  Resume <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/VnykzHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-accent-cyan transition-colors text-sm inline-flex items-center gap-1"
                >
                  GitHub <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <ScrollLink
                  to="projects"
                  smooth
                  duration={500}
                  className="text-gray-400 hover:text-accent-cyan transition-colors cursor-pointer text-sm"
                >
                  Projects
                </ScrollLink>
              </li>
              <li>
                <ScrollLink
                  to="contact"
                  smooth
                  duration={500}
                  className="text-gray-400 hover:text-accent-cyan transition-colors cursor-pointer text-sm"
                >
                  Contact
                </ScrollLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Text size="sm" muted>
              © {currentYear} Vinayak Mathur. All rights reserved.
            </Text>
            <Text size="sm" muted className="flex items-center gap-1">
              Built with <Heart size={14} className="text-red-500" /> using React & TypeScript
            </Text>
          </div>
        </div>
      </Container>
    </footer>
  )
}
