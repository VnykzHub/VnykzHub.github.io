import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  ArticleBody,
  ArticleHeader,
  ArticleToc,
  ReadingProgress,
  SeriesNav,
} from '@/components/writing'
import { getArticle, getNeighbours, SERIES_TITLE } from '@/content/atlas'
import { getSection } from '@/content/atlas/content'

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticle(slug) : undefined
  const section = article ? getSection(article.id) : undefined

  // An unknown slug is a dead link, not an error state worth a page of its own.
  if (!article || !section) return <Navigate to="/writing" replace />

  const { prev, next } = getNeighbours(article.slug)

  return (
    <>
      <title>{`${article.title} — ${SERIES_TITLE}`}</title>
      <meta name="description" content={article.dek} />

      <ReadingProgress />

      <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-8 px-2 xl:grid-cols-[1fr_15rem]">
        <article>
          <ArticleHeader article={article} />
          <ArticleBody section={section} />
        </article>

        {/* Sticky rail only where there is room for it beside the measure. */}
        <aside className="hidden pt-24 xl:block">
          <ArticleToc section={section} />
        </aside>
      </div>

      <footer className="pb-20">
        <SeriesNav prev={prev} next={next} />

        <div className="article-wide mt-8 px-4 sm:px-6">
          <Link
            to="/writing"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] transition-colors hover:text-accent-amber"
          >
            <ArrowLeft size={12} />
            All {SERIES_TITLE} parts
          </Link>
        </div>
      </footer>
    </>
  )
}
