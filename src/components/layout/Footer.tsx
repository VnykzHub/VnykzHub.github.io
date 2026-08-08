'use client'

import { Container } from '@/components/common'
import { Text } from '@/components/ui'
import { Github, Linkedin, Mail, Heart, ExternalLink } from 'lucide-react'
import { navigationItems } from '@/data/navigation'
import Link from 'next/link'
import { NavItemLink } from './NavItemLink'

const projectsItem = navigationItems.find((i) => i.id === 'projects')
const contactItem = navigationItems.find((i) => i.id === 'contact')

const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-[var(--panel)] border-t border-[var(--rule)] py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">
              Vinayak Mathur
            </h3>
            <Text muted className="mb-4 max-w-md">
              ML Engineer. I architect and ship production GenAI systems — RAG pipelines,
              fine-tuned models, and the MLOps around them. Currently at Deloitte.
            </Text>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/VnykzHub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://linkedin.com/in/vinayakmathur2000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="mailto:vinayak.k.mathur@gmail.com"
                className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--heading)] uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {navigationItems.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <NavItemLink
                    item={item}
                    className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors cursor-pointer text-sm"
                  >
                    {item.label}
                  </NavItemLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--heading)] uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/resume.pdf"
                  className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors text-sm inline-flex items-center gap-1"
                >
                  Resume <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/VnykzHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors text-sm inline-flex items-center gap-1"
                >
                  GitHub <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <Link
                  href="/blog/llm-atlas"
                  className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors text-sm"
                >
                  Writing
                </Link>
              </li>
              {projectsItem && (
                <li>
                  <NavItemLink
                    item={projectsItem}
                    className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors cursor-pointer text-sm"
                  >
                    Projects
                  </NavItemLink>
                </li>
              )}
              {contactItem && (
                <li>
                  <NavItemLink
                    item={contactItem}
                    className="text-[var(--ink-soft)] hover:text-accent-amber transition-colors cursor-pointer text-sm"
                  >
                    Contact
                  </NavItemLink>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--rule)]">
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
