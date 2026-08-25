import { describe, it, expect } from 'vitest'
import type { BlackjackState, Card } from './types'
import { createBlackjackReducer, initialState } from './reducer'
import { handTotal } from './hand'
import { rngFrom } from '../shared/rng'

const c = (rank: Card['rank'], suit: Card['suit'] = '♠'): Card => ({ rank, suit })

/** Fresh state with a seeded reducer — deterministic draws. */
function makeState(overrides?: Partial<BlackjackState>): BlackjackState {
  const s = initialState(rngFrom('1729', 'blackjack'))
  return { ...s, ...overrides }
}

function reducerOf() {
  return createBlackjackReducer(rngFrom('1729', 'blackjack'))
}

/** Independently recompute what a settled hand should have paid. */
function expectedPayout(hand: { cards: Card[]; status: string; bet: number }, dealer: Card[]): number {
  if (hand.status === 'bust') return -hand.bet
  const dt = handTotal(dealer)
  if (dt > 21) return hand.bet
  const pt = handTotal(hand.cards)
  return pt > dt ? hand.bet : pt < dt ? -hand.bet : 0
}

const hiLoOf = (card: Card) =>
  ['2', '3', '4', '5', '6'].includes(card.rank) ? 1 : ['7', '8', '9'].includes(card.rank) ? 0 : -1

describe('betting phase', () => {
  it('rejects dealing with no bet', () => {
    const s = reducerOf()(makeState(), { type: 'DEAL' })
    expect(s.phase).toBe('betting')
    expect(s.message).toBe('Place a bet first!')
  })
  it('caps the bet at the bankroll', () => {
    const s = reducerOf()(makeState({ bank: 30 }), { type: 'ADD_BET', amount: 100 })
    expect(s.bet).toBe(30)
  })
  it('clear bet resets to zero', () => {
    let s = makeState()
    s = reducerOf()(s, { type: 'ADD_BET', amount: 25 })
    s = reducerOf()(s, { type: 'CLEAR_BET' })
    expect(s.bet).toBe(0)
  })
})

describe('deal', () => {
  it('deals two cards each and updates the count', () => {
    let s = makeState()
    s = reducerOf()(s, { type: 'ADD_BET', amount: 25 })
    s = reducerOf()(s, { type: 'DEAL' })
    if (s.phase === 'player' || s.phase === 'settled') {
      expect(s.hands[0].cards.length).toBe(2)
      expect(s.dealer.length).toBe(2)
      expect(s.cardsSeen).toBe(4)
      const expectedCount = [...s.hands[0].cards, ...s.dealer].reduce((acc, card) => acc + hiLoOf(card), 0)
      expect(s.runningCount).toBe(expectedCount)
    }
  })
})

describe('hit and settle', () => {
  it('hits until bust, then settles with the bank reduced', () => {
    // Construct a near-bust hand directly so the outcome is forced.
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('K'), c('6'), c('5')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('7'), c('9')],
      shoe: [...makeState().shoe.slice(1), c('10', '♥')],
    })
    const r = reducerOf()
    const hitState = r(state, { type: 'HIT' })
    expect(hitState.phase).toBe('settled')
    expect(hitState.hands[0].status).toBe('bust')
    expect(hitState.bank).toBe(500 - 100)
    expect(hitState.tone).toBe('lose')
  })
  it('a hit that reaches 21 stands automatically', () => {
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('7'), c('4'), c('5')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('2'), c('3')],
      shoe: [...makeState().shoe.slice(1), c('5', '♥')],
    })
    const s = reducerOf()(state, { type: 'HIT' })
    expect(s.phase).toBe('settled') // dealer draws to 17 and settles
    expect(s.hands[0].status).toBe('stood')
  })
})

describe('split', () => {
  it('splits into two hands, stakes the second, and settles both', () => {
    const shoe = makeState().shoe
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      bank: 500,
      hands: [{ cards: [c('8', '♠'), c('8', '♥')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('9'), c('7')],
      shoe,
    })
    const r = reducerOf()
    let s = r(state, { type: 'SPLIT' })
    expect(s.hands.length).toBe(2)
    expect(s.bank).toBe(400)
    expect(s.hands[0].cards.length).toBe(2)
    expect(s.hands[1].cards.length).toBe(2)
    expect(s.activeHand).toBe(0)

    // Play the first hand, then the second, and settle both.
    s = r(s, { type: 'STAND' })
    if (s.phase === 'player') s = r(s, { type: 'STAND' })
    expect(s.phase).toBe('settled')

    const expectedNet = s.hands.reduce((acc, h) => acc + expectedPayout(h, s.dealer), 0)
    expect(s.bank).toBe(400 + expectedNet)
  })
  it('split aces auto-stand both hands', () => {
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('A', '♠'), c('A', '♥')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('9'), c('7')],
    })
    const s = reducerOf()(state, { type: 'SPLIT' })
    expect(s.phase).toBe('settled')
    expect(s.hands.every((h) => h.status === 'stood')).toBe(true)
  })
  it('refuses to split a non-pair', () => {
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('8', '♠'), c('9', '♥')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('9'), c('7')],
    })
    const s = reducerOf()(state, { type: 'SPLIT' })
    expect(s.hands.length).toBe(1)
  })
})

describe('double', () => {
  it('doubles the stake, draws one card, and settles', () => {
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      bank: 500,
      hands: [{ cards: [c('5'), c('6')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('9'), c('7')],
    })
    const s = reducerOf()(state, { type: 'DOUBLE' })
    expect(s.hands[0].bet).toBe(200)
    expect(s.hands[0].doubled).toBe(true)
    expect(s.hands[0].cards.length).toBe(3)
    expect(s.phase).toBe('settled')
    const expectedNet = expectedPayout(s.hands[0], s.dealer)
    expect(s.bank).toBe(400 + expectedNet)
  })
  it('refuses to double with insufficient bank', () => {
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      bank: 50,
      hands: [{ cards: [c('5'), c('6')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('9'), c('7')],
    })
    const s = reducerOf()(state, { type: 'DOUBLE' })
    expect(s.hands[0].bet).toBe(100)
  })
})

describe('blackjack', () => {
  it('pays 3:2 on a natural', () => {
    const state: BlackjackState = makeState({
      phase: 'betting',
      bet: 100,
      // draw order pops from the END: player gets A♦, K♥; dealer gets 2♠, 9♠
      shoe: [...makeState().shoe.slice(4), c('9'), c('2'), c('K', '♥'), c('A', '♦')],
    })
    const s = reducerOf()(state, { type: 'DEAL' })
    expect(s.phase).toBe('settled')
    expect(s.hands[0].status).toBe('blackjack')
    expect(s.bank).toBe(500 + 150)
    expect(s.tone).toBe('win')
  })
  it('pushes when both have blackjack', () => {
    const state: BlackjackState = makeState({
      phase: 'betting',
      bet: 100,
      // player: A♠, K♥ → BJ; dealer: A♦, 10♦ → BJ
      shoe: [...makeState().shoe.slice(4), c('10', '♦'), c('A', '♦'), c('K', '♥'), c('A')],
    })
    const s = reducerOf()(state, { type: 'DEAL' })
    expect(s.phase).toBe('settled')
    expect(s.tone).toBe('push')
    expect(s.bank).toBe(500)
  })
})

describe('shoe management', () => {
  it('reshuffles between rounds when the shoe is thin, resetting the count', () => {
    const state: BlackjackState = makeState({
      phase: 'betting',
      bet: 100,
      shoe: makeState().shoe.slice(0, 40), // under RESHUFFLE_AT
      cardsSeen: 272,
      runningCount: 7,
    })
    const s = reducerOf()(state, { type: 'DEAL' })
    expect(s.newShoe).toBe(true)
    expect(s.cardsSeen).toBe(4)
    expect(s.shoe.length).toBe(312 - 4)
    const expectedCount = [...s.hands[0].cards, ...s.dealer].reduce((acc, card) => acc + hiLoOf(card), 0)
    expect(s.runningCount).toBe(expectedCount)
  })
})

describe('dealer rules', () => {
  it('dealer stands on soft 17 (S17)', () => {
    // Dealer holds A+6 with a shoe guaranteed not to matter: stand must keep 17.
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('10'), c('7')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('A'), c('6')],
    })
    const s = reducerOf()(state, { type: 'STAND' })
    expect(s.phase).toBe('settled')
    expect(handTotal(s.dealer)).toBe(17)
    expect(s.hands[0].status).toBe('stood')
    // 17 vs 17 → push
    expect(s.bank).toBe(500)
  })
})

describe('coach mode', () => {
  it('tracks optimal plays and flags deviations', () => {
    // Hard 12 vs 6: optimal is Stand. Hitting must register a deviation.
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('7'), c('5')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('6'), c('9')],
    })
    const s = reducerOf()(state, { type: 'HIT' })
    expect(s.totalPlays).toBe(1)
    expect(s.optimalPlays).toBe(0)
    expect(s.coachFeedback).toContain('Optimal: Stand')
  })
  it('credits the optimal play', () => {
    const state: BlackjackState = makeState({
      phase: 'player',
      bet: 100,
      hands: [{ cards: [c('7'), c('5')], bet: 100, status: 'active', doubled: false }],
      dealer: [c('6'), c('9')],
    })
    const s = reducerOf()(state, { type: 'STAND' })
    expect(s.optimalPlays).toBe(1)
    expect(s.coachFeedback).toBeNull()
  })
})
