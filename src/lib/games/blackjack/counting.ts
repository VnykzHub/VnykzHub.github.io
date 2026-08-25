import type { Rank } from './types'

/** Hi-Lo card values: 2–6 → +1, 7–9 → 0, 10/J/Q/K/A → −1. */
export function hiLo(rank: Rank): number {
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1
  if (['7', '8', '9'].includes(rank)) return 0
  return -1
}
