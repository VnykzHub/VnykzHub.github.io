import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  ArticleBody,
  ArticleHeader,
  ArticleToc,
  GiscusComments,
  ReadingProgress,
  SeriesNav,
} from '@/components/writing'
import { getArticle, getNeighbours, getSeries } from '@/content/series'
import type { AtlasSection } from '@/content/llm-atlas/types'
import { getSection as getLlmAtlasSection } from '@/content/llm-atlas/content'
import { getSection as getAiAtlasSection } from '@/content/ai-engineering-atlas/content'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

/**
 * Body getters, one per series.
 *
 * Each Atlas keeps its prose, equations and figures in its own module so a
 * reader of one never downloads another's. Registering a series here is step 3
 * of adding one — see src/content/series.ts.
 *
 * Static imports rather than dynamic: the whole article route is already lazy
 * behind React.lazy in App.tsx, so a second suspense boundary inside it would
 * buy nothing and cost a loading flash.
 */
const BODY_LOADERS: Record<string, (id: string) => AtlasSection | undefined> = {
  'llm-atlas': getLlmAtlasSection,
  'ai-engineering-atlas': getAiAtlasSection,
}

export function ArticlePage() {
  const { series: seriesId, slug } = useParams<{ series: string; slug: string }>()

  const series = seriesId ? getSeries(seriesId) : undefined
  const article = seriesId && slug ? getArticle(seriesId, slug) : undefined
  const getSection = seriesId ? BODY_LOADERS[seriesId] : undefined
  const section = article && getSection ? getSection(article.id) : undefined

  // An unknown series or slug is a dead link, not an error state worth its own
  // page. Fall back to the series landing when the series is real, else the hub.
  if (!series || !article || !section) {
    return <Navigate to={series ? `/blog/${series.id}` : '/blog'} replace />
  }

  const { prev, next } = getNeighbours(series.id, article.slug)

  return (
    <>
      <title>{`${article.title} — ${series.title}`}</title>
      <meta name="description" content={article.dek} />

      <ReadingProgress />

      <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-8 px-2 xl:grid-cols-[1fr_15rem]">
        <article>
          <ArticleHeader article={article} />
          <ErrorBoundary>
            <ArticleBody section={section} />
          </ErrorBoundary>
        </article>

        {/* Sticky rail only where there is room for it beside the measure. */}
        <aside className="hidden pt-24 xl:block">
          <ArticleToc section={section} />
        </aside>
      </div>

      <footer className="pb-20">
        <SeriesNav prev={prev} next={next} />

        <GiscusComments />

        <div className="article-wide mt-8 px-4 sm:px-6">
          <Link
            to={`/blog/${series.id}`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] transition-colors hover:text-accent-amber"
          >
            <ArrowLeft size={12} />
            All {series.title} parts
          </Link>
        </div>
      </footer>
    </>
  )
}
