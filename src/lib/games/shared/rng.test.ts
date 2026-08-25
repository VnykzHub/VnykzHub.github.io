import { describe, it, expect } from 'vitest'
import { rngFrom, shuffle } from './rng'

describe('seeded rng', () => {
  it('is deterministic for the same seed', () => {
    const a = rngFrom('1729', 'test')
    const b = rngFrom('1729', 'test')
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b))
  })
  it('differs across seeds and salts', () => {
    const a = rngFrom('1729', 'test')
    const b = rngFrom('1730', 'test')
    const c = rngFrom('1729', 'other')
    expect(a()).not.toBe(b())
    expect(a()).not.toBe(c())
  })
  it('produces values in [0,1)', () => {
    const r = rngFrom('42', 'test')
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('shuffle is a permutation, deterministic per seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = shuffle([...arr], rngFrom('s', 'test'))
    const b = shuffle([...arr], rngFrom('s', 'test'))
    expect(a).toEqual(b)
    expect([...a].sort((x, y) => x - y)).toEqual(arr)
  })
})
