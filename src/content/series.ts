/**
 * The Atlas registry.
 *
 * Every long-form series on the site is an Atlas. This module is the single
 * place that knows they exist — the /blog hub, the per-series landing pages and
 * the home-page teaser all read from here.
 *
 * It deliberately imports only listing metadata. Article bodies, KaTeX and the
 * canvas figures are reached through each series' own `content` module, which
 * only the article route touches. That split is what keeps the home page's
 * writing teaser at ~1.7 kB rather than the ~430 kB it cost before.
 *
 * Adding a series:
 *   1. src/content/<id>/ — content, plus an index exporting a `Series`
 *   2. register it below
 *   3. add its body loader to BODY_LOADERS in src/pages/ArticlePage.tsx
 */

import { AI_ENGINEERING_ATLAS } from './ai-engineering-atlas'
import { LLM_ATLAS } from './llm-atlas'
import type { Article, Series } from './types'
import { EMPTY_TOTALS } from './types'

/**
 * Announced but unwritten.
 *
 * These render on the hub as cards without links, so the shape of the project
 * is visible without pretending anything is finished. A series graduates by
 * replacing the placeholder with a real export — the hub needs no change.
 */

const DSA_ATLAS: Series = {
  id: 'dsa-atlas',
  title: 'DSA Atlas',
  subtitle: 'Data structures and algorithms, derived rather than memorised',
  dek: 'The structures and algorithms interviews ask about and systems actually use — built up from why each exists and what it costs, with the trade-off that motivates it made explicit.',
  status: 'planned',
  accent: 'rust',
  articles: [],
  totals: EMPTY_TOTALS,
}

const DATA_SCIENCE_ATLAS: Series = {
  id: 'data-science-atlas',
  title: 'Data Science Atlas',
  subtitle: 'From statistics to deep learning, with the maths kept in',
  dek: 'Statistical foundations through classical models to deep learning — the mathematics that justifies each method, the code that implements it, and worked examples on real data.',
  status: 'planned',
  accent: 'amber',
  articles: [],
  totals: EMPTY_TOTALS,
}

/** Display order on the hub. Published first, deliberately. */
export const SERIES: Series[] = [
  LLM_ATLAS,
  AI_ENGINEERING_ATLAS,
  DSA_ATLAS,
  DATA_SCIENCE_ATLAS,
]

export const getSeries = (id: string): Series | undefined => SERIES.find((s) => s.id === id)

/** Only series with something to read. Everything else is a card, not a link. */
export const readableSeries = (): Series[] => SERIES.filter((s) => s.articles.length > 0)

export function getArticle(seriesId: string, slug: string): Article | undefined {
  return getSeries(seriesId)?.articles.find((a) => a.slug === slug)
}

/** Previous / next within a series, for the article footer. */
export function getNeighbours(
  seriesId: string,
  slug: string
): { prev?: Article; next?: Article } {
  const articles = getSeries(seriesId)?.articles ?? []
  const i = articles.findIndex((a) => a.slug === slug)
  if (i < 0) return {}
  return { prev: articles[i - 1], next: articles[i + 1] }
}

/**
 * Slug -> series, for redirecting the flat /blog/:slug URLs the LLM Atlas
 * shipped under before this registry existed. Those are already published and
 * may have been shared, so they redirect rather than 404.
 */
export function findSeriesBySlug(slug: string): Series | undefined {
  return SERIES.find((s) => s.articles.some((a) => a.slug === slug))
}

export const TOTAL_PUBLISHED_PARTS = SERIES.reduce((n, s) => n + s.totals.parts, 0)
