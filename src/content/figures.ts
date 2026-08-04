import { ANIMS } from './llm-atlas/anims'
import { AI_ATLAS_FIGURES } from './ai-engineering-atlas/anims'
import type { AtlasAnim } from './llm-atlas/types'

/**
 * Every canvas figure, across every series.
 *
 * AtlasFigure previously imported the LLM Atlas registry directly, so a figure
 * declared by any other series could never resolve — it rendered as a
 * placeholder no matter what had been drawn for it. That was invisible until a
 * second series existed, and would have silently swallowed every figure in the
 * AI Engineering Atlas.
 *
 * A flat merge is deliberate. AtlasFigure receives only a figure id, so keying
 * the lookup by series would mean changing ArticleBody's signature and every
 * call site in order to fix a collision that has not happened. The generator can
 * detect duplicate ids far more cheaply than the renderer can disambiguate them,
 * and the ids are already namespaced in practice by how they are written: the
 * LLM Atlas uses bare nouns (`kvcache`, `tokenization`), this series uses
 * hyphenated phrases (`rag-pipeline-overview`).
 *
 * If a collision ever does occur the later spread wins. Prefer renaming the new
 * figure over reaching for a per-series lookup.
 */
export const FIGURES: Record<string, AtlasAnim> = {
  ...ANIMS,
  ...AI_ATLAS_FIGURES,
}
