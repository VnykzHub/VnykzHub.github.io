import { describe, it, expect } from 'vitest'
import { WORDS, bestGuess, entropyOf, pattern } from './engine'

describe('pattern', () => {
  it('is all green for an exact match', () => {
    expect(pattern('crane', 'crane')).toEqual({ code: 242, res: [2, 2, 2, 2, 2] })
  })
  it('handles duplicate letters Wordle-style', () => {
    // answer sleep, guess speed: s✓, p→yellow, e✓, e✓, d✗
    expect(pattern('speed', 'sleep').res).toEqual([2, 1, 2, 2, 0])
    // answer babes, guess abbey: a→yellow, b→yellow, b✓, e✓, y✗
    expect(pattern('abbey', 'babes').res).toEqual([1, 1, 2, 2, 0])
  })
  it('encodes base-3 codes', () => {
    expect(pattern('crane', 'crane').code).toBe(242)
    expect(pattern('zzzzz', 'crane').code).toBe(0)
  })
})

describe('entropyOf', () => {
  it('is zero for a single candidate', () => {
    expect(entropyOf('crane', ['crane'])).toBe(0)
  })
  it('matches the bucket formula', () => {
    const cands = WORDS.slice(0, 10)
    const buckets = new Map<number, number>()
    for (const w of cands) {
      const code = pattern('crane', w).code
      buckets.set(code, (buckets.get(code) || 0) + 1)
    }
    let expected = 0
    buckets.forEach((v) => {
      const p = v / cands.length
      expected -= p * Math.log2(p)
    })
    expect(entropyOf('crane', cands)).toBeCloseTo(expected, 12)
  })
})

describe('bestGuess', () => {
  it('returns a word from the pool', () => {
    const { word } = bestGuess(WORDS)
    expect(WORDS).toContain(word)
  })
  it('is no worse than a fixed guess on the full set', () => {
    const best = bestGuess(WORDS)
    const fixed = entropyOf('crane', WORDS)
    expect(best.bits).toBeGreaterThanOrEqual(fixed - 1e-9)
  })
  it('restricts to candidates near the end', () => {
    const cands = ['crane', 'crone']
    const { word } = bestGuess(cands)
    expect(cands).toContain(word)
  })
})

describe('dictionary', () => {
  it('has 200+ unique lowercase five-letter words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(200)
    expect(new Set(WORDS).size).toBe(WORDS.length)
    for (const w of WORDS) {
      expect(w).toMatch(/^[a-z]{5}$/)
    }
  })
})
