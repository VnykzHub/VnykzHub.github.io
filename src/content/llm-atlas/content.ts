import { ATLAS_SECTIONS } from './atlas.data'
import type { AtlasSection } from './types'

/**
 * Article bodies.
 *
 * Imported only by the article route so the ~200 kB of prose stays out of
 * every other chunk. Use ./index for anything that just lists articles.
 */
export const getSection = (id: string): AtlasSection | undefined =>
  ATLAS_SECTIONS.find((s) => s.id === id)
