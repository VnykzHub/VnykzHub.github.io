'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

/**
 * Giscus-powered comments for article pages.
 *
 * Maps discussions to the current pathname so each article gets its own thread.
 * Theme follows the site so comments are legible in both modes.
 *
 * Requires the giscus GitHub App installed on the repo and Discussions enabled.
 * Until then, the div renders as an empty container with no visible effect.
 */
export function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Remove any previously-injected script (theme change re-mount).
    const existing = container.querySelector('script')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'VnykzHub/VnykzHub.github.io')
    script.setAttribute('data-repo-id', 'R_kgDO<placeholder>') // Replace from giscus.app after setup
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', 'DIC_kwDO<placeholder>') // Replace from giscus.app
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', theme === 'dark' ? 'dark_dimmed' : 'light')
    script.setAttribute('data-lang', 'en')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    container.appendChild(script)
  }, [theme])

  return (
    <section aria-label="Comments" className="article-wide mt-16 px-4 sm:px-6">
      <div ref={ref} />
    </section>
  )
}
