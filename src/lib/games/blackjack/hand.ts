import type { Card } from './types'

export function cardValue(rank: Card['rank']): number {
  if (['J', 'Q', 'K'].includes(rank)) return 10
  if (rank === 'A') return 11
  return parseInt(rank, 10)
}

/** Best total under blackjack rules — Aces count 11 until the hand would bust. */
export function handTotal(cards: Card[]): number {
  let total = 0
  let aces = 0
  for (const c of cards) {
    total += cardValue(c.rank)
    if (c.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

/** Natural blackjack: exactly two cards worth 21. Split 21s are NOT blackjacks. */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21
}

export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank
}

/**
 * Soft total when one Ace counts as 11 without busting; null for hard hands.
 * Every ace counts 1 except one that counts 11: nonAceSum + aceCount + 10.
 */
export function softTotal(cards: Card[]): number | null {
  const aces = cards.filter((c) => c.rank === 'A').length
  if (aces === 0) return null
  const nonAce = cards.filter((c) => c.rank !== 'A').reduce((s, c) => s + cardValue(c.rank), 0)
  const total = nonAce + aces + 10
  if (total > 21) return null
  return total
}

export function handLabel(cards: Card[]): string {
  if (isBlackjack(cards)) return 'BJ!'
  return String(handTotal(cards))
}
