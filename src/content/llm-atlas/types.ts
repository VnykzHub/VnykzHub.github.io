/**
 * Content model for the LLM Atlas article series.
 *
 * These types describe the *source* data extracted from the original Atlas
 * app (see scripts/generate-atlas-content.mjs). The presentation layer in
 * src/components/writing/ maps them onto an article layout.
 */

export interface AtlasEquation {
  /** Short label shown beside the equation, e.g. "Causal Masked Attention" */
  l: string
  /** TeX source, without delimiters */
  t: string
}

export interface AtlasCode {
  lang: string
  text: string
}

/** One subsection — becomes an <h2> block inside an article. */
export interface AtlasSub {
  id: string
  title: string
  /** Markdown-lite: paragraphs split on blank lines, **bold** and *italic* only. */
  body: string
  /** Key into ATLAS_ANIMS — renders as a canvas figure. */
  anim?: string
  math?: { eqs: AtlasEquation[] }
  code?: AtlasCode
}

/** One top-level section — becomes one article. */
export interface AtlasSection {
  id: string
  /** Short nav label */
  label: string
  /** Full display title */
  title: string
  /** Accent hex carried over from the original Atlas, used as the article's spot colour */
  color: string
  icon: string
  subs: AtlasSub[]
}

/**
 * Everything about a section except its prose.
 *
 * Kept separate from AtlasSection so that listing articles never pulls their
 * bodies into the bundle — see the note in scripts/generate-atlas-content.mjs.
 */
export interface AtlasMeta {
  id: string
  label: string
  title: string
  color: string
  icon: string
  subCount: number
  wordCount: number
  figureCount: number
  equationCount: number
}

export interface AtlasPaper {
  /** Authors, e.g. "Vaswani et al." */
  a: string
  /** Title */
  t: string
  /** Venue, e.g. "NeurIPS 2017" */
  v: string
  /** One-line description of the contribution */
  d: string
  /** Absent for a couple of entries in the source bibliography */
  url?: string
}

export interface AtlasPaperCategory {
  label: string
  papers: AtlasPaper[]
}

export interface GlossaryEntry {
  term: string
  def: string
}

/** A canvas animation. Receives a DPR-normalised context in CSS pixels. */
export type AtlasAnim = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) => void
