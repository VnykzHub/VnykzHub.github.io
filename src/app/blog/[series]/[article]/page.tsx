import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticle, getNeighbours, getSeries } from '@/content/series'
import type { AtlasSection } from '@/content/llm-atlas/types'
import { getSection as getLlmAtlasSection } from '@/content/llm-atlas/content'
import { getSection as getAiAtlasSection } from '@/content/ai-engineering-atlas/content'
import { ArticleClient } from './ArticleClient'

const BODY_LOADERS: Record<string, (id: string) => AtlasSection | undefined> = {
  'llm-atlas': getLlmAtlasSection,
  'ai-engineering-atlas': getAiAtlasSection,
}

interface Props { params: Promise<{ series: string; article: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series: seriesId, article: articleSlug } = await params
  const art = getArticle(seriesId, articleSlug)
  const series = getSeries(seriesId)
  if (!art || !series) return { title: 'Not Found' }
  return {
    title: `${art.title} — ${series.title}`,
    description: art.dek,
  }
}

export default async function ArticlePage({ params }: Props) {
  const { series: seriesId, article: articleSlug } = await params
  const series = getSeries(seriesId)
  const article = getArticle(seriesId, articleSlug)
  const getSection = BODY_LOADERS[seriesId]
  const section = article && getSection ? getSection(article.id) : undefined

  if (!series || !article || !section) {
    notFound()
  }

  const { prev, next } = getNeighbours(series.id, article.slug)

  return (
    <ArticleClient
      article={article}
      section={section}
      series={series}
      prev={prev}
      next={next}
    />
  )
}
