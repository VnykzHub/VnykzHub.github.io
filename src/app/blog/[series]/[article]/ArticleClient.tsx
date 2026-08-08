'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  ArticleBody,
  ArticleHeader,
  ArticleToc,
  GiscusComments,
  ReadingProgress,
  SeriesNav,
} from '@/components/writing'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { Article, Series } from '@/content/types'
import type { AtlasSection } from '@/content/llm-atlas/types'

interface Props {
  article: Article
  section: AtlasSection
  series: Series
  prev?: Article
  next?: Article
}

export function ArticleClient({ article, section, series, prev, next }: Props) {
  return (
    <>
      <ReadingProgress />

      <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-8 px-2 xl:grid-cols-[1fr_15rem]">
        <article>
          <ArticleHeader article={article} />
          <ErrorBoundary>
            <ArticleBody section={section} />
          </ErrorBoundary>
        </article>

        <aside className="hidden pt-24 xl:block">
          <ArticleToc section={section} />
        </aside>
      </div>

      <footer className="pb-20">
        <SeriesNav prev={prev} next={next} />

        <GiscusComments />

        <div className="article-wide mt-8 px-4 sm:px-6">
          <Link
            href={`/blog/${series.id}`}
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
