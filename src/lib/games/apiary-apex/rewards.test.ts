import { describe, it, expect } from 'vitest'
import { computeRewards } from './rewards'

describe('computeRewards', () => {
  it('rewards hunters for closing distance on the prey', () => {
    const r = computeRewards(
      { x: 0, z: 0 },
      [{ x: 10, z: 0 }, { x: -10, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 8, z: 0 }, { x: -9, z: 0 }],
      false,
      1 / 60,
    )
    expect(r.predator[0]).toBeGreaterThan(0)
    expect(r.predator[1]).toBeGreaterThan(0)
  })

  it('pays the capture bonus to both hunters on a capture step', () => {
    const r = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: -1, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: -1, z: 0 }],
      true,
      1 / 60,
    )
    expect(r.predator[0]).toBeGreaterThan(900)
    expect(r.predator[1]).toBeGreaterThan(900)
  })

  it('penalizes the survivor heavily when caught', () => {
    const caught = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      true,
      1 / 60,
    )
    const free = computeRewards(
      { x: 0, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      { x: 0.1, z: 0 },
      [{ x: 1, z: 0 }, { x: 20, z: 0 }],
      false,
      1 / 60,
    )
    expect(caught.prey).toBeLessThan(free.prey)
  })

  it('rewards the survivor for distance from the nearest hunter', () => {
    const near = computeRewards({ x: 0, z: 0 }, [{ x: 2, z: 0 }, { x: 2, z: 0 }], { x: 0, z: 0 }, [{ x: 2, z: 0 }, { x: 2, z: 0 }], false, 1 / 60)
    const far = computeRewards({ x: 0, z: 0 }, [{ x: 20, z: 0 }, { x: 20, z: 0 }], { x: 0, z: 0 }, [{ x: 20, z: 0 }, { x: 20, z: 0 }], false, 1 / 60)
    expect(far.prey).toBeGreaterThan(near.prey)
  })
})
