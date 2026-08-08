import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AtlasFigure, CodeBlock, MathBlock, Prose } from './ContentBlocks'
import { formatDate, pad, splitTitle } from './format'
import type { Article as ArticleMeta } from '@/content/llm-atlas'
import { SERIES_TITLE } from '@/content/llm-atlas'
import { getSeries } from '@/content/series'
import type { AtlasSection, AtlasSub } from '@/content/llm-atlas/types'

export function ArticleHeader({ article }: { article: ArticleMeta }) {
  return (
    <header className="article-measure px-4 pt-14 pb-10 sm:px-6 md:pt-20">
      <div className="mb-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em]">
         <Link href={`/blog/${article.series}`} className="text-accent-amber hover:underline">
          {getSeries(article.series)?.title ?? SERIES_TITLE}
        </Link>
        <span className="text-[var(--ink-faint)]">/</span>
        <span className="text-[var(--ink-faint)]">Part {pad(article.part)}</span>
      </div>

      <h1 className="font-sans text-[2.1rem] font-bold leading-[1.12] text-[var(--heading)] sm:text-[2.6rem]">
        {article.title}
      </h1>

      <p className="mt-5 font-serif text-lg leading-relaxed text-[var(--ink-soft)]">
        {article.dek}
      </p>

      <dl className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--rule)] pt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
        <div>
          <dt className="sr-only">Published</dt>
          <dd>{formatDate(article.published)}</dd>
        </div>
        <div>
          <dt className="sr-only">Reading time</dt>
          <dd>{article.readingTime} min read</dd>
        </div>
        {article.figureCount > 0 && (
          <div>
            <dt className="sr-only">Figures</dt>
            <dd>{article.figureCount} figures</dd>
          </div>
        )}
        {article.equationCount > 0 && (
          <div>
            <dt className="sr-only">Equations</dt>
            <dd>{article.equationCount} equations</dd>
          </div>
        )}
      </dl>
    </header>
  )
}

/* ────────────────────────────────────────────────────────────── */

function Subsection({ sub, first }: { sub: AtlasSub; first: boolean }) {
  const { num, text } = splitTitle(sub.title)

  return (
    <section id={sub.id} className="scroll-mt-24 pb-14">
      <h2 className="article-measure px-4 sm:px-6">
        {num && <span className="article-section-num mb-2 block">{pad(Number(num))}</span>}
        <span className="block font-sans text-[1.45rem] font-semibold leading-snug text-[var(--heading)]">
          {text}
        </span>
      </h2>

      <div className="article-measure mt-5 px-4 sm:px-6">
        <Prose dropCap={first}>{sub.body}</Prose>
      </div>

      {sub.math && (
        <div className="article-measure mt-7 px-4 sm:px-6">
          <MathBlock eqs={sub.math.eqs} />
        </div>
      )}

      {sub.anim && (
        <div className="article-wide mt-8 px-4 sm:px-6">
          <AtlasFigure anim={sub.anim} label={text} />
        </div>
      )}

      {sub.code && (
        <div className="article-wide mt-8 px-4 sm:px-6">
          <CodeBlock code={sub.code} />
        </div>
      )}
    </section>
  )
}

export function ArticleBody({ section }: { section: AtlasSection }) {
  return (
    <div>
      {section.subs.map((sub, i) => (
        <Subsection key={sub.id} sub={sub} first={i === 0} />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

export function SeriesNav({ prev, next }: { prev?: ArticleMeta; next?: ArticleMeta }) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label="Series navigation"
      className="article-wide mt-6 grid gap-4 px-4 sm:grid-cols-2 sm:px-6"
    >
      {prev ? (
        <Link
          href={`/blog/${prev.series}/${prev.slug}`}
          className="group surface-card p-5 transition-colors hover:border-accent-amber"
        >
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            <ArrowLeft size={12} /> Part {pad(prev.part)}
          </span>
          <span className="mt-2 block font-sans text-base font-semibold text-[var(--heading)] group-hover:text-accent-amber">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}

      {next && (
        <Link
          href={`/blog/${next.series}/${next.slug}`}
          className="group surface-card p-5 text-right transition-colors hover:border-accent-amber sm:col-start-2"
        >
          <span className="flex items-center justify-end gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Part {pad(next.part)} <ArrowRight size={12} />
          </span>
          <span className="mt-2 block font-sans text-base font-semibold text-[var(--heading)] group-hover:text-accent-amber">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  )
}
