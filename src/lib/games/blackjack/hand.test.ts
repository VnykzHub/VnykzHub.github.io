import { describe, it, expect } from 'vitest'
import type { Card } from './types'
import { handTotal, isBlackjack, isPair, softTotal, handLabel } from './hand'

const c = (rank: Card['rank'], suit: Card['suit'] = '♠'): Card => ({ rank, suit })

describe('handTotal', () => {
  it('sums face cards and aces', () => {
    expect(handTotal([c('A'), c('K')])).toBe(21)
    expect(handTotal([c('A'), c('A'), c('9')])).toBe(21)
    expect(handTotal([c('A'), c('A'), c('A'), c('A')])).toBe(14)
    expect(handTotal([c('10'), c('9'), c('A')])).toBe(20)
    expect(handTotal([c('5'), c('6'), c('A')])).toBe(12)
  })
  it('softens aces to avoid busting', () => {
    expect(handTotal([c('A'), c('7'), c('10')])).toBe(18)
  })
})

describe('isBlackjack', () => {
  it('is a two-card 21 only', () => {
    expect(isBlackjack([c('A'), c('K')])).toBe(true)
    expect(isBlackjack([c('K'), c('A')])).toBe(true)
    expect(isBlackjack([c('A'), c('5'), c('5')])).toBe(false)
    expect(isBlackjack([c('A'), c('9')])).toBe(false)
  })
})

describe('softTotal', () => {
  it('returns 11 + non-ace total when soft', () => {
    expect(softTotal([c('A'), c('7')])).toBe(18)
    expect(softTotal([c('A'), c('A')])).toBe(12)
  })
  it('is null for hard hands', () => {
    expect(softTotal([c('A'), c('7'), c('10')])).toBeNull()
    expect(softTotal([c('8'), c('9')])).toBeNull()
  })
})

describe('isPair', () => {
  it('matches identical ranks only', () => {
    expect(isPair([c('8'), c('8')])).toBe(true)
    expect(isPair([c('8'), c('9')])).toBe(false)
    expect(isPair([c('K'), c('Q')])).toBe(false)
  })
})

describe('handLabel', () => {
  it('labels naturals and totals', () => {
    expect(handLabel([c('A'), c('K')])).toBe('BJ!')
    expect(handLabel([c('7'), c('8')])).toBe('15')
  })
})
