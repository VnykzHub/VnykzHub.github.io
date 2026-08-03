import { ATLAS_META } from './atlas.meta'
import type { AtlasMeta } from './types'

export type {
  AtlasSection,
  AtlasSub,
  AtlasMeta,
  AtlasPaper,
  AtlasPaperCategory,
  GlossaryEntry,
} from './types'

/**
 * Article listing metadata.
 *
 * This module deliberately imports only atlas.meta.ts. The prose lives in
 * atlas.data.ts and the canvas figures in atlas.anims.ts — both are reached
 * through ./content and ./anims, which only the article route imports. That
 * keeps ~430 kB of article bodies, KaTeX and Prism out of the home page.
 */

export const SERIES_TITLE = 'LLM Atlas'
export const SERIES_SUBTITLE = 'Architectural Evolution, 2017–2026'
export const SERIES_PUBLISHED = '2026-08-02'

/**
 * Reading order and editorial framing for the series.
 *
 * The source data is keyed by section id in authoring order, which is not a
 * sensible reading order — it opens on attention variants before defining a
 * language model. This list is the published sequence: prerequisites, then
 * history, then the 2017 breakthrough, then the lineages that descend from it,
 * then the systems around it, and finally the economics and open problems.
 */
const ORDER: { id: string; slug: string; dek: string }[] = [
  {
    id: 'math-primer',
    slug: 'the-math-you-actually-need',
    dek: 'Dot products, softmax, gradients. A handful of ideas carry the entire field — explained before anything depends on them.',
  },
  {
    id: 'foundations',
    slug: 'what-is-a-language-model',
    dek: 'Strip away the branding and a language model is one thing: a conditional probability distribution over the next token.',
  },
  {
    id: 'pre2017',
    slug: 'the-pre-transformer-era',
    dek: 'N-grams, word2vec, RNNs, LSTMs, and the attention mechanism bolted onto them. Everything the Transformer replaced, and why it needed replacing.',
  },
  {
    id: 'transformer',
    slug: 'attention-is-all-you-need',
    dek: 'The 2017 architecture, component by component: QKV projections, multi-head attention, positional encoding, the feed-forward block, residuals and norms.',
  },
  {
    id: 'attn-variants',
    slug: 'the-evolution-of-attention',
    dek: 'Causal masking, multi-head, grouped-query, cross-attention. The formula barely moves — what changes is where the numbers come from.',
  },
  {
    id: 'clusterA',
    slug: 'quadratic-attention',
    dek: 'The O(n²) lineage: sparse patterns, sliding windows, FlashAttention. Keep exact attention, attack the constant factor instead.',
  },
  {
    id: 'clusterB',
    slug: 'sub-quadratic-attention',
    dek: 'The O(n) lineage: linear attention, kernel tricks, state-space models. Give up exactness, buy back the sequence length.',
  },
  {
    id: 'alt',
    slug: 'beyond-the-transformer-stack',
    dek: 'Mamba, RWKV, RetNet. Architectures that are not Transformers wearing a hat.',
  },
  {
    id: 'tokenizers',
    slug: 'tokenizer-evolution',
    dek: 'BPE, WordPiece, SentencePiece. The least glamorous component, and the one that quietly decides what a model can never represent.',
  },
  {
    id: 'training',
    slug: 'activations-optimizers-and-systems',
    dek: 'GELU and SwiGLU, LayerNorm and RMSNorm, RoPE, Adam. The unglamorous machinery that makes a deep stack trainable at all.',
  },
  {
    id: 'infer',
    slug: 'serving-at-scale',
    dek: 'KV-cache, paged attention, speculative decoding. Training is a one-off cost; inference is the bill that arrives every month.',
  },
  {
    id: 'scaling',
    slug: 'the-economics-of-scale',
    dek: 'Kaplan, Chinchilla, and the data wall. What the scaling laws actually claim, and where they stop.',
  },
  {
    id: 'gaps',
    slug: 'what-remains-unsolved',
    dek: 'Long-context degradation, evaluation that measures the wrong thing, interpretability, and the problems no amount of compute has fixed.',
  },
  {
    id: 'implications',
    slug: 'what-it-means-and-where-its-going',
    dek: "What ten years of architectural churn adds up to, and which bets still look live from here.",
  },
]

export interface Article {
  /** Position in the series, 1-indexed */
  part: number
  slug: string
  /** Section id — the key for loading the body via ./content */
  id: string
  /** Full display title */
  title: string
  /** Short nav label */
  label: string
  dek: string
  /** Spot colour, carried from the source data */
  color: string
  icon: string
  published: string
  /** Estimated minutes, rounded, minimum 1 */
  readingTime: number
  subCount: number
  wordCount: number
  figureCount: number
  equationCount: number
}

const WORDS_PER_MINUTE = 220
/** A figure or an equation costs roughly as much attention as a short paragraph. */
const SECONDS_PER_FIGURE = 20

function readingMinutes(meta: AtlasMeta): number {
  const seconds =
    (meta.wordCount / WORDS_PER_MINUTE) * 60 +
    (meta.figureCount + meta.equationCount) * SECONDS_PER_FIGURE
  return Math.max(1, Math.round(seconds / 60))
}

export const ARTICLES: Article[] = ORDER.map((entry, index) => {
  const meta = ATLAS_META.find((m) => m.id === entry.id)
  if (!meta) throw new Error(`Atlas section "${entry.id}" not found in generated metadata`)

  return {
    part: index + 1,
    slug: entry.slug,
    id: meta.id,
    title: meta.title,
    label: meta.label,
    dek: entry.dek,
    color: meta.color,
    icon: meta.icon,
    published: SERIES_PUBLISHED,
    readingTime: readingMinutes(meta),
    subCount: meta.subCount,
    wordCount: meta.wordCount,
    figureCount: meta.figureCount,
    equationCount: meta.equationCount,
  }
})

export const getArticle = (slug: string): Article | undefined =>
  ARTICLES.find((a) => a.slug === slug)

/** Previous / next within the series, for the article footer. */
export function getNeighbours(slug: string): { prev?: Article; next?: Article } {
  const i = ARTICLES.findIndex((a) => a.slug === slug)
  if (i < 0) return {}
  return { prev: ARTICLES[i - 1], next: ARTICLES[i + 1] }
}

export const SERIES_TOTALS = {
  parts: ARTICLES.length,
  sections: ARTICLES.reduce((n, a) => n + a.subCount, 0),
  figures: ARTICLES.reduce((n, a) => n + a.figureCount, 0),
  equations: ARTICLES.reduce((n, a) => n + a.equationCount, 0),
  minutes: ARTICLES.reduce((n, a) => n + a.readingTime, 0),
}
