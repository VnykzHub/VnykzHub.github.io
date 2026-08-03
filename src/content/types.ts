/**
 * Types shared across every Atlas series.
 *
 * The blog began as a single hardcoded series (the LLM Atlas): one
 * SERIES_TITLE, one flat ARTICLES array, getArticle(slug). With three more
 * atlases planned — AI Engineering, DSA, Data Science — that shape had to
 * become a registry before the second one landed, or every series after it
 * would have cost a refactor of already-published content.
 *
 * Body types (AtlasSection, AtlasSub…) stay inside each series' own directory.
 * Only the listing shape is shared, which is what keeps this registry cheap
 * enough to import from the home page without dragging article prose along.
 */

export type SeriesStatus =
  /** Complete and readable end to end. */
  | 'published'
  /** Some parts published, more being written. The card says so. */
  | 'in-progress'
  /** Announced, nothing published yet. Not linkable. */
  | 'planned'

/** One part of a series. Listing metadata only — never the body. */
export interface Article {
  /** Position in the series, 1-indexed. */
  part: number
  slug: string
  /** Key for loading the body from the owning series' content module. */
  id: string
  /** Series id this belongs to. Needed once several series' cards mix. */
  series: string
  title: string
  /** Short nav label. */
  label: string
  dek: string
  /** Spot colour, carried from the source data. */
  color: string
  icon: string
  /** ISO date, YYYY-MM-DD. */
  published: string
  /** Estimated minutes, rounded, minimum 1. */
  readingTime: number
  subCount: number
  wordCount: number
  figureCount: number
  equationCount: number
}

export interface SeriesTotals {
  parts: number
  sections: number
  figures: number
  equations: number
  minutes: number
}

export interface Series {
  /** URL segment: /blog/<id>. */
  id: string
  title: string
  subtitle: string
  /** One paragraph for the hub card — what it covers and who it is for. */
  dek: string
  status: SeriesStatus
  accent: 'amber' | 'patina' | 'rust'
  /** Empty while status is 'planned'. */
  articles: Article[]
  totals: SeriesTotals
}

export const EMPTY_TOTALS: SeriesTotals = {
  parts: 0,
  sections: 0,
  figures: 0,
  equations: 0,
  minutes: 0,
}

export function sumTotals(articles: Article[]): SeriesTotals {
  return {
    parts: articles.length,
    sections: articles.reduce((n, a) => n + a.subCount, 0),
    figures: articles.reduce((n, a) => n + a.figureCount, 0),
    equations: articles.reduce((n, a) => n + a.equationCount, 0),
    minutes: articles.reduce((n, a) => n + a.readingTime, 0),
  }
}
