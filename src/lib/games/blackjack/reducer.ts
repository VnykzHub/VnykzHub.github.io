import type { BlackjackAction, BlackjackState, Card, PlayerHand } from './types'

export type { BlackjackState }
import { buildShoe, RESHUFFLE_AT, TOTAL_CARDS, countOf } from './shoe'
import { handTotal, isBlackjack, isPair } from './hand'
import { getOptimalMove } from './strategy'
import type { Rng } from '../shared/rng'

const START_BANK = 500

export function initialState(rng: Rng): BlackjackState {
  return {
    phase: 'betting',
    shoe: buildShoe(6, rng),
    cardsSeen: 0,
    decksRemaining: 6,
    runningCount: 0,
    newShoe: false,
    bank: START_BANK,
    bet: 0,
    hands: [],
    activeHand: 0,
    dealer: [],
    message: 'Place your bet and deal!',
    tone: 'neutral',
    lastOptimal: null,
    hintShown: false,
    coachFeedback: null,
    optimalPlays: 0,
    totalPlays: 0,
  }
}

/**
 * Pure game state machine. Deterministic given the injected rng — the app
 * passes rngFrom(seed, 'blackjack') so reseed/share-link reproduce runs.
 * Dealer stands on all 17s (S17). Blackjack pays 3:2. Split is a single
 * split played as two hands sequentially; split Aces get one card each.
 */
export function createBlackjackReducer(rng: Rng) {
  return function reducer(state: BlackjackState, action: BlackjackAction): BlackjackState {
    switch (action.type) {
      case 'ADD_BET': {
        if (state.phase !== 'betting') return state
        if (state.bank <= 0) return { ...state, message: 'Bankrupt — reset to restart.', tone: 'lose' }
        const amount = Math.min(action.amount, state.bank - state.bet)
        return { ...state, bet: state.bet + amount }
      }
      case 'CLEAR_BET':
        if (state.phase !== 'betting') return state
        return { ...state, bet: 0 }
      case 'RESET_BANK':
        return { ...state, bank: START_BANK, message: 'Bankroll reset to $500.' }
      case 'NEW_ROUND':
        return {
          ...state,
          phase: 'betting',
          bet: 0,
          hands: [],
          activeHand: 0,
          dealer: [],
          newShoe: false,
          lastOptimal: null,
          hintShown: false,
          coachFeedback: null,
          message: 'Place your bet and deal!',
          tone: 'neutral',
        }
      case 'DEAL':
        return deal(state, rng)
      case 'HIT':
        return hit(state)
      case 'STAND':
        return stand(state)
      case 'DOUBLE':
        return double(state)
      case 'SPLIT':
        return split(state)
      case 'SHOW_HINT':
        return { ...state, hintShown: true }
      default:
        return state
    }
  }
}

/** Draw from the shoe and update count bookkeeping. Mutates the draft via s.shoe.slice. */
function draw(s: BlackjackState): Card {
  const card = s.shoe[s.shoe.length - 1]
  s.shoe = s.shoe.slice(0, -1)
  s.cardsSeen += 1
  s.runningCount += countOf(card)
  s.decksRemaining = Math.max(0.5, (TOTAL_CARDS - s.cardsSeen) / 52)
  return card
}

function deal(state: BlackjackState, rng: Rng): BlackjackState {
  if (state.bet === 0) return { ...state, message: 'Place a bet first!' }
  let s: BlackjackState = {
    ...state,
    hands: [],
    dealer: [],
    activeHand: 0,
    newShoe: false,
    coachFeedback: null,
    hintShown: false,
  }

  if (s.shoe.length < RESHUFFLE_AT) {
    s = { ...s, shoe: buildShoe(6, rng), runningCount: 0, cardsSeen: 0, decksRemaining: 6, newShoe: true }
  }

  const playerCards = [draw(s), draw(s)]
  const dealerCards = [draw(s), draw(s)]
  const hand: PlayerHand = { cards: playerCards, bet: s.bet, status: 'active', doubled: false }
  s = { ...s, hands: [hand], dealer: dealerCards, phase: 'player' }

  // Natural blackjack: pay 3:2 (or push on dealer blackjack) and end the round.
  if (isBlackjack(playerCards)) {
    hand.status = 'blackjack'
    const dealerBJ = isBlackjack(dealerCards)
    if (dealerBJ) {
      return { ...s, phase: 'settled', message: 'Push! Both Blackjack.', tone: 'push' }
    }
    const win = Math.floor(s.bet * 1.5)
    return {
      ...s,
      phase: 'settled',
      bank: s.bank + win,
      message: `Blackjack! You win $${win}!`,
      tone: 'win',
      lastOptimal: null,
    }
  }

  return { ...s, lastOptimal: getOptimalMove(playerCards, dealerCards[0]), message: 'Your move.', tone: 'neutral' }
}

function hit(state: BlackjackState): BlackjackState {
  if (state.phase !== 'player') return state
  const s: BlackjackState = { ...state, coachFeedback: null, hintShown: false }
  const handIdx = s.activeHand
  const optimal = getOptimalMove(s.hands[handIdx].cards, s.dealer[0])

  const cards = [...s.hands[handIdx].cards, draw(s)]
  const hand = { ...s.hands[handIdx], cards }
  const hands = s.hands.slice()
  hands[handIdx] = hand
  s.hands = hands

  const total = handTotal(cards)
  if (total > 21) {
    hands[handIdx] = { ...hand, status: 'bust' }
    const coached = coach(s, 'Hit', optimal)
    const advanced = advanceHands({ ...coached, hands }, handIdx)
    if (advanced.phase === 'dealer') return playDealer(advanced)
    return advanced
  }
  if (total === 21) {
    hands[handIdx] = { ...hand, status: 'stood' }
    const coached = coach(s, 'Hit', optimal)
    const advanced = advanceHands({ ...coached, hands }, handIdx)
    if (advanced.phase === 'dealer') return playDealer(advanced)
    return advanced
  }
  const coached = coach(s, 'Hit', optimal)
  return { ...coached, lastOptimal: getOptimalMove(cards, coached.dealer[0]) }
}

function stand(state: BlackjackState): BlackjackState {
  if (state.phase !== 'player') return state
  const s: BlackjackState = { ...state, coachFeedback: null, hintShown: false }
  const handIdx = s.activeHand
  const optimal = getOptimalMove(s.hands[handIdx].cards, s.dealer[0])
  const hands = s.hands.slice()
  hands[handIdx] = { ...hands[handIdx], status: 'stood' }
  const coached = coach(s, 'Stand', optimal)
  const advanced = advanceHands({ ...coached, hands }, handIdx)
  if (advanced.phase === 'dealer') return playDealer(advanced)
  return advanced
}

function double(state: BlackjackState): BlackjackState {
  if (state.phase !== 'player') return state
  const handIdx = state.activeHand
  const hand = state.hands[handIdx]
  if (hand.cards.length !== 2 || state.bank < hand.bet) return state
  const s: BlackjackState = { ...state, coachFeedback: null, hintShown: false }
  const optimal = getOptimalMove(hand.cards, s.dealer[0])

  const cards = [...hand.cards, draw(s)]
  const hands = s.hands.slice()
  const doubled: PlayerHand = {
    cards,
    bet: hand.bet * 2,
    status: handTotal(cards) > 21 ? 'bust' : 'stood',
    doubled: true,
  }
  hands[handIdx] = doubled
  const coached = coach({ ...s, bank: s.bank - hand.bet }, 'Double', optimal)
  const advanced = advanceHands({ ...coached, hands }, handIdx)
  if (advanced.phase === 'dealer') return playDealer(advanced)
  return advanced
}

function split(state: BlackjackState): BlackjackState {
  if (state.phase !== 'player') return state
  if (state.hands.length !== 1) return state
  const hand = state.hands[0]
  if (!isPair(hand.cards) || state.bank < hand.bet) return state
  const s: BlackjackState = { ...state, coachFeedback: null, hintShown: false }
  const optimal = getOptimalMove(hand.cards, s.dealer[0])

  const first: PlayerHand = { cards: [hand.cards[0], draw(s)], bet: hand.bet, status: 'active', doubled: false }
  const second: PlayerHand = { cards: [hand.cards[1], draw(s)], bet: hand.bet, status: 'active', doubled: false }

  // Split Aces: one card each, then both hands stand.
  if (hand.cards[0].rank === 'A') {
    first.status = 'stood'
    second.status = 'stood'
    const coached = coach({ ...s, bank: s.bank - hand.bet }, 'Split', optimal)
    const advanced = { ...coached, hands: [first, second], activeHand: 0, phase: 'dealer' as const }
    return playDealer(advanced)
  }

  const coached = coach({ ...s, bank: s.bank - hand.bet }, 'Split', optimal)
  return {
    ...coached,
    hands: [first, second],
    activeHand: 0,
    message: 'Split! Playing first hand.',
    lastOptimal: getOptimalMove(first.cards, coached.dealer[0]),
  }
}

/** Compare the player's action with the optimal move; update coach stats + feedback. */
function coach(
  s: BlackjackState,
  chosen: 'Hit' | 'Stand' | 'Double' | 'Split',
  optimal: { move: string; reason: string }
): BlackjackState {
  const totalPlays = s.totalPlays + 1
  const match = chosen === optimal.move
  const coachFeedback = match ? null : `You ${chosen.toLowerCase()}. Optimal: ${optimal.move} — ${optimal.reason}`
  return { ...s, totalPlays, optimalPlays: s.optimalPlays + (match ? 1 : 0), coachFeedback }
}

/** Move to the next split hand, or hand over to the dealer phase. */
function advanceHands(s: BlackjackState, handIdx: number): BlackjackState {
  if (handIdx < s.hands.length - 1) {
    const next = handIdx + 1
    return {
      ...s,
      activeHand: next,
      coachFeedback: null,
      message: 'Second hand.',
      lastOptimal: getOptimalMove(s.hands[next].cards, s.dealer[0]),
    }
  }
  return { ...s, phase: 'dealer' }
}

/** Dealer draws to 17 (S17), then every hand settles against the dealer total. */
function playDealer(state: BlackjackState): BlackjackState {
  const s: BlackjackState = { ...state }
  const dealer = [...s.dealer]
  while (handTotal(dealer) < 17) dealer.push(draw(s))
  s.dealer = dealer

  const dealerTotal = handTotal(s.dealer)
  let net = 0
  const hands = s.hands.map((h) => {
    if (h.status === 'bust') {
      net -= h.bet
      return h
    }
    const total = handTotal(h.cards)
    if (dealerTotal > 21 || total > dealerTotal) {
      net += h.bet
    } else if (total < dealerTotal) {
      net -= h.bet
    }
    return h
  })

  const bank = s.bank + net
  const tone = net > 0 ? 'win' : net < 0 ? 'lose' : 'push'
  let message: string
  if (hands.length > 1) {
    message =
      net > 0
        ? `You win $${net} across both hands.`
        : net < 0
          ? `Dealer wins. You lose $${-net} overall.`
          : 'Push! Bet returned.'
  } else {
    message =
      dealerTotal > 21
        ? `Dealer busts! You win $${hands[0].bet}`
        : hands[0].status === 'bust'
          ? `Bust! You lose $${hands[0].bet}`
          : net > 0
            ? `You win $${net}!`
            : net < 0
              ? `Dealer wins. You lose $${-net}`
              : 'Push! Bet returned.'
  }

  return { ...s, hands, bank, phase: 'settled', message, tone, lastOptimal: null }
}
