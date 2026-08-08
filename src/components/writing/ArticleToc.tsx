'use client'

import { useEffect, useMemo, useState } from 'react'
import { useScrollProgress } from '@/hooks'
import type { AtlasSection } from '@/content/llm-atlas/types'
import { splitTitle } from './format'

/** Thin cyan bar pinned to the top of the viewport. */
export function ReadingProgress() {
  const progress = useScrollProgress()
  return (
    <div
      className="reading-progress"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  )
}

/**
 * Scroll-spy over the article's subsections.
 *
 * Picks the last heading whose top has passed the reading line (a third of the
 * way down the viewport) rather than using IntersectionObserver ratios — with
 * sections of wildly different heights, "most visible" jumps around, while
 * "most recently crossed" tracks what you are actually reading.
 */
function useActiveSection(ids: string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0])

  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight / 3
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids])

  return active
}

export function ArticleToc({ section }: { section: AtlasSection }) {
  const ids = useMemo(() => section.subs.map((s) => s.id), [section])
  const active = useActiveSection(ids)

  return (
    <nav aria-label="On this page" className="sticky top-28">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
        On this page
      </p>
      <ol>
        {section.subs.map((sub) => (
          <li key={sub.id}>
            <a
              href={`#${sub.id}`}
              className="toc-link"
              aria-current={active === sub.id ? 'true' : undefined}
            >
              {splitTitle(sub.title).text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
