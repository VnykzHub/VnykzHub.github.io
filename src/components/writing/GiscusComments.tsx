'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

export function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const existing = container.querySelector('script')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'VnykzHub/VnykzHub.github.io')
    script.setAttribute('data-repo-id', 'R_kgDOM9LqxQ')
    script.setAttribute('data-category', 'General')
    script.setAttribute('data-category-id', 'DIC_kwDOM9Lqxc4DC9Fb')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    script.setAttribute('data-lang', 'en')
    script.setAttribute('data-loading', 'lazy')
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
