import { describe, it, expect } from 'vitest'
import { buildShoe, TOTAL_CARDS, NUM_DECKS } from './shoe'
import { rngFrom } from '../shared/rng'

describe('buildShoe', () => {
  it('builds a 6-deck shoe of 312 cards', () => {
    expect(buildShoe().length).toBe(TOTAL_CARDS)
  })
  it('contains 24 of each rank', () => {
    const shoe = buildShoe()
    const counts = new Map<string, number>()
    for (const card of shoe) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1)
    for (const [, n] of counts) expect(n).toBe(NUM_DECKS * 4)
  })
  it('is deterministic for a seeded rng', () => {
    const a = buildShoe(6, rngFrom('1729', 'shoe'))
    const b = buildShoe(6, rngFrom('1729', 'shoe'))
    expect(a).toEqual(b)
  })
  it('respects a custom deck count', () => {
    expect(buildShoe(2).length).toBe(104)
  })
})
