import { describe, it, expect } from 'vitest'
import { computeRewards, applyMilestoneTick } from './rewards'
import { MILESTONE_PREY_BONUS, MILESTONE_PREDATOR_PENALTY } from './config'

describe('computeRewards', () => {
  it('rewards hunters for closing distance on the prey', () => {
    const r = computeRewards(
      { x: 0, z: 0 },
      [{ x: 10, z: 0 }, { x: -10, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 8, z: 0 }, { x: -9, z: 0 }],
      [false, false],
      1 / 60,
    )
    expect(r.predator[0]).toBeGreaterThan(0)
    expect(r.predator[1]).toBeGreaterThan(0)
  })

  it('pays the capture bonus only to the hunter that actually caught it', () => {
    const r = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: -1, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: -1, z: 0 }],
      [true, false],
      1 / 60,
    )
    expect(r.predator[0]).toBeGreaterThan(900)
    expect(r.predator[1]).toBeLessThan(100) // no bonus, just its ordinary distance/time terms
  })

  it('pays both when both are simultaneously in range', () => {
    const r = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: -1, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: -1, z: 0 }],
      [true, true],
      1 / 60,
    )
    expect(r.predator[0]).toBeGreaterThan(900)
    expect(r.predator[1]).toBeGreaterThan(900)
  })

  it('penalizes the survivor heavily when caught, by either hunter', () => {
    const caughtByA = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      [true, false],
      1 / 60,
    )
    const free = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      { x: 0.1, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      [false, false],
      1 / 60,
    )
    expect(caughtByA.prey).toBeLessThan(free.prey)
  })

  it('rewards the survivor for distance from the nearest hunter', () => {
    const near = computeRewards({ x: 0, z: 0 }, [{ x: 2, z: 0 }, { x: 2, z: 0 }], { x: 0, z: 0 }, [{ x: 2, z: 0 }, { x: 2, z: 0 }], [false, false], 1 / 60)
    const far = computeRewards({ x: 0, z: 0 }, [{ x: 20, z: 0 }, { x: 20, z: 0 }], { x: 0, z: 0 }, [{ x: 20, z: 0 }, { x: 20, z: 0 }], [false, false], 1 / 60)
    expect(far.prey).toBeGreaterThan(near.prey)
  })
})

describe('applyMilestoneTick', () => {
  const base = { predator: [0, 0] as [number, number], prey: 0 }

  it('does nothing within the same minute', () => {
    const r = applyMilestoneTick(base, 10, 10.5)
    expect(r).toEqual(base)
  })

  it('pays the prey and penalizes both hunters on crossing a minute mark', () => {
    const r = applyMilestoneTick(base, 59.98, 60.02)
    expect(r.prey).toBeCloseTo(MILESTONE_PREY_BONUS, 5)
    expect(r.predator[0]).toBeCloseTo(-MILESTONE_PREDATOR_PENALTY, 5)
    expect(r.predator[1]).toBeCloseTo(-MILESTONE_PREDATOR_PENALTY, 5)
  })

  it('is a no-op across a reset back to 0 (a capture already handled its own reward)', () => {
    const r = applyMilestoneTick(base, 61, 0)
    expect(r).toEqual(base)
  })

  it('adds on top of an existing reward rather than replacing it', () => {
    const withExisting = { predator: [5, -3] as [number, number], prey: 2 }
    const r = applyMilestoneTick(withExisting, 59.9, 60.1)
    expect(r.prey).toBeCloseTo(2 + MILESTONE_PREY_BONUS, 5)
    expect(r.predator[0]).toBeCloseTo(5 - MILESTONE_PREDATOR_PENALTY, 5)
    expect(r.predator[1]).toBeCloseTo(-3 - MILESTONE_PREDATOR_PENALTY, 5)
  })
})
