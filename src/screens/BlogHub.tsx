import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/common'
import { Eyebrow } from '@/components/ui'
import { SERIES } from '@/content/series'
import type { Series } from '@/content/types'

/**
 * /blog — the Atlas hub.
 *
 * Lists every series. Ones with published parts link through to their landing
 * page; planned ones render as cards without links, so the shape of the project
 * is visible without implying anything is finished that is not.
 *
 * Imports only src/content/series.ts, which carries listing metadata alone — no
 * article prose, no KaTeX and no canvas figures reach this chunk.
 */

const ACCENT_TEXT = {
  amber: 'text-accent-amber',
  patina: 'text-accent-patina',
  rust: 'text-accent-rust',
} as const

const STATUS_LABEL: Record<Series['status'], string> = {
  published: 'Complete',
  'in-progress': 'In progress',
  planned: 'Planned',
}

function SeriesCard({ series }: { series: Series }) {
  const readable = series.articles.length > 0
  const accent = ACCENT_TEXT[series.accent]

  const inner = (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${accent}`}>
          {series.title}
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
            readable ? accent : 'text-[var(--ink-faint)]'
          }`}
        >
          {STATUS_LABEL[series.status]}
        </span>
      </div>

      <h2 className="font-sans text-2xl font-bold leading-tight text-[var(--heading)]">
        {series.subtitle}
      </h2>

      <p className="mt-3 max-w-2xl font-serif text-[15px] leading-relaxed text-[var(--ink-soft)]">
        {series.dek}
      </p>

      {readable ? (
        <>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            <span>
              <strong className="text-[var(--heading)]">{series.totals.parts}</strong> parts
            </span>
            <span>
              <strong className="text-[var(--heading)]">{series.totals.sections}</strong> sections
            </span>
            <span>
              <strong className="text-[var(--heading)]">{series.totals.figures}</strong> figures
            </span>
            <span>~{series.totals.minutes} min</span>
          </div>
          <span
            className={`mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] ${accent}`}
          >
            Read the series <ArrowRight size={12} />
          </span>
        </>
      ) : (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          Being written
        </p>
      )}
    </>
  )

  const base =
    'block surface-card p-7 transition-colors'

  return readable ? (
     <Link href={`/blog/${series.id}`} className={`${base} hover:border-[var(--panel-border)]`}>
      {inner}
    </Link>
  ) : (
    <div className={`${base} opacity-70`}>{inner}</div>
  )
}

export function BlogHub() {
  return (
    <>
      <title>Blog — The Atlas series | Vinayak Mathur</title>
      <meta
        name="description"
        content="Long-form technical series on language models, AI engineering, data structures and data science — written to be studied rather than skimmed."
      />

      <Container maxWidth="7xl">
        <header className="border-b border-[var(--rule)] py-16 md:py-24">
          <div className="max-w-3xl">
            <Eyebrow>Blog</Eyebrow>

            <h1 className="font-sans text-[2.6rem] font-bold leading-[1.05] text-[var(--heading)] sm:text-[3.4rem]">
              <span className="text-gradient">The Atlas series</span>
            </h1>

            <p className="mt-5 font-serif text-lg leading-relaxed text-[var(--ink-soft)]">
              Each Atlas takes one field and works through it in dependency order — why a
              thing exists, how it actually works, and what breaks once it meets real
              traffic. Written to be studied, not skimmed.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 py-14 lg:grid-cols-2">
          {SERIES.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      </Container>
    </>
  )
}
