import { ATLAS_ANIMS } from './atlas.anims'
import { ATLAS_ANIMS_EXTRA } from './atlas.anims.extra'
import type { AtlasAnim } from './types'

/**
 * The generated figures plus the hand-written supplements.
 *
 * Imported only by the figure component, which the article route pulls in —
 * 49 canvas closures have no business in the home-page bundle.
 */
export const ANIMS: Record<string, AtlasAnim> = { ...ATLAS_ANIMS, ...ATLAS_ANIMS_EXTRA }
