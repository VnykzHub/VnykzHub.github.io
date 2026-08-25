import { describe, it, expect } from 'vitest'
import { posterior, kellyFraction, kellySide, capFraction, ROUNDS, START, CAP } from './kelly'

describe('posterior', () => {
  it('starts at 0.5 and follows the Beta mean', () => {
    expect(posterior(0, 0)).toBe(0.5)
    expect(posterior(3, 1)).toBeCloseTo(2 / 3, 10)
    expect(posterior(0, 3)).toBeCloseTo(1 / 3, 10)
    expect(posterior(10, 0)).toBeCloseTo(11 / 12, 10)
  })
})

describe('kellyFraction', () => {
  it('is 2p−1 magnitude on the favoured side', () => {
    expect(kellyFraction(0.5)).toBe(0)
    expect(kellyFraction(0.6)).toBeCloseTo(0.2, 10)
    expect(kellyFraction(0.75)).toBeCloseTo(0.5, 10)
    expect(kellyFraction(0.25)).toBeCloseTo(0.5, 10)
  })
})

describe('kellySide', () => {
  it('favours the posterior side, heads on ties', () => {
    expect(kellySide(0.6)).toBe('H')
    expect(kellySide(0.4)).toBe('T')
    expect(kellySide(0.5)).toBe('H')
  })
})

describe('capFraction', () => {
  it('caps at the house limit', () => {
    expect(capFraction(0.9)).toBe(CAP)
    expect(capFraction(0.2)).toBe(0.2)
  })
})

describe('constants', () => {
  it('keeps the prototype run shape', () => {
    expect(ROUNDS).toBe(20)
    expect(START).toBe(100)
  })
})
