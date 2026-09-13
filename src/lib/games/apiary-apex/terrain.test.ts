import { describe, it, expect } from 'vitest'
import { buildChunk, chunksAround, chunkAt } from './terrain'
import { SAFE_ZONE_RADIUS } from './config'

describe('terrain', () => {
  it('is deterministic for the same seed and chunk coordinates', () => {
    const a = buildChunk('seed-1', 2, -3)
    const b = buildChunk('seed-1', 2, -3)
    expect(a).toEqual(b)
  })

  it('differs across seeds', () => {
    const a = buildChunk('seed-1', 0, 1)
    const b = buildChunk('seed-2', 0, 1)
    expect(a.obstacles).not.toEqual(b.obstacles)
  })

  it('keeps the world origin clear of obstacles', () => {
    for (let s = 0; s < 20; s++) {
      const chunk = buildChunk(`origin-check-${s}`, 0, 0)
      for (const o of chunk.obstacles) {
        expect(Math.hypot(o.x, o.z)).toBeGreaterThanOrEqual(SAFE_ZONE_RADIUS)
      }
    }
  })

  it('maps world coordinates to the right chunk', () => {
    expect(chunkAt(5, 5)).toEqual({ cx: 0, cz: 0 })
    expect(chunkAt(-5, 5)).toEqual({ cx: -1, cz: 0 })
    expect(chunkAt(41, -41)).toEqual({ cx: 1, cz: -2 })
  })

  it('returns a 3x3 grid of unique chunks around a point (visibility radius 1)', () => {
    const chunks = chunksAround('seed-1', 0, 0)
    expect(chunks).toHaveLength(9)
    expect(new Set(chunks.map((c) => c.id)).size).toBe(9)
  })
})
