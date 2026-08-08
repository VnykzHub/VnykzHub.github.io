'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

/**
 * Giscus-powered comments for article pages.
 *
 * Silently no-ops until configured.
 *
 * Setup checklist:
 *   1. Enable Discussions on the repo (Settings → Features)
 *   2. Install giscus GitHub App on the repo
 *   3. Visit giscus.app, enter repo name, copy repo-id and category-id
 *   4. Replace the placeholder values below
 */

// Replace with real values from https://giscus.app after setup.
const REPO_ID = ''
const CATEGORY_ID = ''

export function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const container = ref.current
    if (!container) return
    if (!REPO_ID || !CATEGORY_ID) return

    const existing = container.querySelector('script')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'VnykzHub/VnykzHub.github.io')
    script.setAttribute('data-repo-id', REPO_ID)
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', CATEGORY_ID)
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

  if (!REPO_ID || !CATEGORY_ID) return null

  return (
    <section aria-label="Comments" className="article-wide mt-16 px-4 sm:px-6">
      <div ref={ref} />
    </section>
  )
}
