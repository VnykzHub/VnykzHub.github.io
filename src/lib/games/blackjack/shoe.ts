import type { Card, Rank, Suit } from './types'
import { shuffle, type Rng } from '../shared/rng'
import { hiLo } from './counting'

export const SUITS: Suit[] = ['♠', '♣', '♥', '♦']
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const NUM_DECKS = 6
/** Cards remaining at which the shoe is rebuilt between rounds. */
export const RESHUFFLE_AT = 52
export const TOTAL_CARDS = NUM_DECKS * 52

export function buildShoe(numDecks = NUM_DECKS, r: Rng = Math.random): Card[] {
  const cards: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit })
      }
    }
  }
  return shuffle(cards, r)
}

export function countOf(card: Card): number {
  return hiLo(card.rank)
}
