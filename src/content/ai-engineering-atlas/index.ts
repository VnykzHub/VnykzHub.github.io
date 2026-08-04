import { AI_ATLAS_META } from './atlas.meta'
import type { Article, Series } from '../types'
import { sumTotals } from '../types'

/**
 * AI Engineering Atlas — listing metadata.
 *
 * Imports only atlas.meta.ts. Prose lives in atlas.data.ts and is reached
 * through ./content, which only the article route imports — the same split that
 * keeps the LLM Atlas's bodies off every page that merely links to them.
 *
 * Reading order is file order (NN-*.md). Unlike the LLM Atlas, which needed an
 * explicit ORDER list because it was extracted from an app whose internal
 * ordering was arbitrary, this series is authored in dependency order.
 */

export const SERIES_ID = 'ai-engineering-atlas'
export const SERIES_TITLE = 'AI Engineering Atlas'
export const SERIES_SUBTITLE = 'Building systems on top of models you did not train'
export const SERIES_PUBLISHED = '2026-08-03'

const WORDS_PER_MINUTE = 220
/** A figure or an equation costs roughly as much attention as a short paragraph. */
const SECONDS_PER_FIGURE = 20

export const ARTICLES: Article[] = AI_ATLAS_META.map((meta, index) => ({
  part: index + 1,
  slug: meta.slug,
  id: meta.id,
  series: SERIES_ID,
  title: meta.title,
  label: meta.label,
  dek: meta.dek,
  color: meta.color,
  icon: meta.icon,
  published: SERIES_PUBLISHED,
  readingTime: Math.max(
    1,
    Math.round(
      ((meta.wordCount / WORDS_PER_MINUTE) * 60 +
        (meta.figureCount + meta.equationCount) * SECONDS_PER_FIGURE) /
        60
    )
  ),
  subCount: meta.subCount,
  wordCount: meta.wordCount,
  figureCount: meta.figureCount,
  equationCount: meta.equationCount,
}))

export const SERIES_TOTALS = sumTotals(ARTICLES)

/**
 * Registry entry.
 *
 * Published: all eleven sections written, every VERIFY marker resolved, and
 * every declared figure drawn. Vinayak is still reading through it — anything
 * he corrects is an edit to a finished series, not a gap in an unfinished one,
 * which is the distinction this status is meant to carry.
 */
export const AI_ENGINEERING_ATLAS: Series = {
  id: SERIES_ID,
  title: SERIES_TITLE,
  subtitle: SERIES_SUBTITLE,
  dek: 'The application layer, in dependency order: embeddings and search, vector stores, RAG, agents and tool use, MCP, and everything that sits between a working demo and a system that survives real traffic.',
  status: 'published',
  accent: 'patina',
  articles: ARTICLES,
  totals: SERIES_TOTALS,
}
