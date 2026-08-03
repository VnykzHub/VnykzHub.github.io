import { AI_ATLAS_SECTIONS } from './atlas.data'
import type { AtlasSection } from '../llm-atlas/types'

/**
 * Article bodies.
 *
 * Imported only by the article route, so the prose stays out of every other
 * chunk. Use ./index for anything that merely lists articles.
 *
 * Body types are shared with the LLM Atlas rather than duplicated — the
 * presentation layer in src/components/writing/ renders both series, so a
 * second copy of AtlasSection would only be a chance to drift.
 */
export const getSection = (id: string): AtlasSection | undefined =>
  AI_ATLAS_SECTIONS.find((s) => s.id === id)
