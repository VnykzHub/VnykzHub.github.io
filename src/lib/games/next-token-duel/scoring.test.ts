import { describe, it, expect } from 'vitest'
import { bits, pickQ, perplexity, PICK_CONF } from './scoring'
import { PASSAGES, PASSAGES_PER_RUN } from './data'

describe('bits', () => {
  it('computes surprisal', () => {
    expect(bits(0.7)).toBeCloseTo(0.5146, 4)
    expect(bits(0.075)).toBeCloseTo(3.737, 3)
    expect(bits(1)).toBeCloseTo(0)
    expect(bits(0.5)).toBe(1)
  })
})

describe('pickQ', () => {
  it('gives 70% confidence when right, spreads 30% when wrong', () => {
    expect(pickQ(true, 5)).toBe(PICK_CONF)
    expect(pickQ(false, 5)).toBeCloseTo(0.075, 6)
  })
})

describe('perplexity', () => {
  it('is 2^avgBits', () => {
    expect(perplexity(1)).toBe(2)
    expect(perplexity(0)).toBe(1)
  })
})

describe('passage data integrity', () => {
  it('has enough passages for a run', () => {
    expect(PASSAGES.length).toBeGreaterThanOrEqual(PASSAGES_PER_RUN)
  })
  it('every passage has 4 steps of 5 candidates with in-range correct index', () => {
    for (const p of PASSAGES) {
      expect(p.steps.length).toBe(4)
      for (const step of p.steps) {
        expect(step.o.length).toBe(5)
        expect(step.c).toBeGreaterThanOrEqual(0)
        expect(step.c).toBeLessThan(5)
      }
    }
  })
  it('probabilities roughly sum to 1 per step', () => {
    // Two wire-copy steps in the source data are loose (sums 0.88 and 0.72) —
    // the prototype's own rounding. Bars are relative, scoring uses p_true
    // directly, so tolerance covers the author's arithmetic.
    for (const p of PASSAGES) {
      for (const step of p.steps) {
        const sum = step.o.reduce((s, [, prob]) => s + prob, 0)
        expect(Math.abs(sum - 1)).toBeLessThan(0.3)
      }
    }
  })
})
