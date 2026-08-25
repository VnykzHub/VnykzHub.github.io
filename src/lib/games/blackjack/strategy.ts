import type { Card, Move } from './types'
import { handTotal, isPair, softTotal } from './hand'

export interface OptimalMove {
  move: Move
  reason: string
}

/**
 * Basic strategy, 6-deck, dealer stands on all 17s (S17), no surrender.
 * Must agree cell-for-cell with the tables in chart.ts — the consistency
 * test in strategy.test.ts locks the two together.
 */
export function getOptimalMove(playerCards: Card[], upcard: Card): OptimalMove {
  const pTotal = handTotal(playerCards)
  const dRank = upcard.rank
  const dVal = ['J', 'Q', 'K'].includes(dRank) ? 10 : dRank === 'A' ? 11 : parseInt(dRank, 10)
  const dKey = dRank === 'A' ? 'A' : String(dVal)
  const twoCards = playerCards.length === 2

  const result = evaluate(playerCards, upcard)
  // Double is only legal on a two-card hand; coach a Hit instead on 3+.
  if (!twoCards && result.move === 'Double') {
    return { move: 'Hit', reason: `With ${playerCards.length} cards Double is off the table — Hit.` }
  }
  return result
}

function evaluate(playerCards: Card[], upcard: Card): OptimalMove {
  const pTotal = handTotal(playerCards)
  const dRank = upcard.rank
  const dVal = ['J', 'Q', 'K'].includes(dRank) ? 10 : dRank === 'A' ? 11 : parseInt(dRank, 10)
  const dKey = dRank === 'A' ? 'A' : String(dVal)
  const twoCards = playerCards.length === 2

  const pair = isPair(playerCards)
  const soft = softTotal(playerCards)

  if (pair) {
    const pRank = playerCards[0].rank
    if (pRank === 'A')
      return { move: 'Split', reason: 'Always split Aces — each Ace can become a strong 21.' }
    if (pRank === '8')
      return { move: 'Split', reason: 'Always split 8s — 16 is the worst hand. Give each 8 a chance.' }
    if (['K', 'Q', 'J', '10'].includes(pRank))
      return { move: 'Stand', reason: 'Never split 10s — 20 is a near-winning hand.' }
    if (pRank === '5') return hard10(dKey, dVal, 'Never split 5s — treat as 10.')
    if (pRank === '9') {
      if (['7', '10', 'A'].includes(dRank) || dVal === 10)
        return { move: 'Stand', reason: '18 is strong enough vs dealer 7, 10, or Ace.' }
      return { move: 'Split', reason: 'Split 9s vs dealer 2–6, 8, 9 — two chances at 19.' }
    }
    if (pRank === '6') {
      if (dVal >= 2 && dVal <= 6) return { move: 'Split', reason: 'Split 6s vs dealer 2–6.' }
      return { move: 'Hit', reason: "Don't split 6s vs strong dealer — just Hit." }
    }
    if (['2', '3', '7'].includes(pRank)) {
      if (dVal <= 7) return { move: 'Split', reason: `Split ${pRank}s vs weak dealer (2–7).` }
      return { move: 'Hit', reason: `Don't split ${pRank}s vs strong dealer — just Hit.` }
    }
    if (pRank === '4') {
      if (dVal === 5 || dVal === 6) return { move: 'Split', reason: 'Split 4s only vs dealer 5 or 6.' }
      return { move: 'Hit', reason: 'Hit 4s vs other dealer cards.' }
    }
  }

  if (soft !== null) {
    if (soft >= 19) return { move: 'Stand', reason: `Soft ${soft} — always Stand.` }
    if (soft === 18) {
      if (dVal >= 9) return { move: 'Hit', reason: 'Soft 18 vs 9/10/A — dealer likely beats 18, Hit.' }
      if (dVal >= 3 && dVal <= 6 && twoCards)
        return { move: 'Double', reason: 'Soft 18 vs 3–6 — Double to maximize value.' }
      return { move: 'Stand', reason: "Soft 18 vs 2/7/8 — Stand (18 beats dealer's likely 17/18)." }
    }
    if (soft === 17) {
      if (dVal >= 3 && dVal <= 6 && twoCards)
        return { move: 'Double', reason: 'Soft 17 vs 3–6 — Double Down.' }
      return { move: 'Hit', reason: 'Soft 17 — always Hit (can only improve or stay same).' }
    }
    if (soft === 15 || soft === 16) {
      if (dVal >= 4 && dVal <= 6 && twoCards)
        return { move: 'Double', reason: `Soft ${soft} vs ${dKey} — Double vs weak dealer.` }
      return { move: 'Hit', reason: `Soft ${soft} — Hit, you can't bust and might improve.` }
    }
    // soft 13–14
    if ((dVal === 5 || dVal === 6) && twoCards)
      return { move: 'Double', reason: `Soft ${soft} vs ${dKey} — Double vs weak dealer.` }
    return { move: 'Hit', reason: `Soft ${soft} — Hit, you can't bust and might improve.` }
  }

  // Hard totals
  if (pTotal >= 17) return { move: 'Stand', reason: `Hard ${pTotal} — always Stand. Bust risk is too high.` }
  if (pTotal <= 8) return { move: 'Hit', reason: `${pTotal} — always Hit, you can't bust.` }
  if (pTotal === 11) {
    if (dRank === 'A') return { move: 'Hit', reason: 'Hard 11 vs Ace — just Hit (dealer might have BJ).' }
    return { move: 'Double', reason: 'Hard 11 — Double Down, any 10-value card gives you 21.' }
  }
  if (pTotal === 10) return hard10(dKey, dVal)
  if (pTotal === 9) {
    if (dVal >= 3 && dVal <= 6) return { move: 'Double', reason: 'Hard 9 vs weak dealer (3–6) — Double.' }
    return { move: 'Hit', reason: 'Hard 9 vs strong dealer — Hit.' }
  }
  // 12 stands only vs 4–6; 13–16 stand vs 2–6
  const stand12 = pTotal === 12 && dVal >= 4 && dVal <= 6
  const stand13to16 = pTotal >= 13 && dVal <= 6
  if (stand12 || stand13to16)
    return { move: 'Stand', reason: `Hard ${pTotal} vs weak dealer (${dKey}) — Stand. Dealer likely busts.` }
  return {
    move: 'Hit',
    reason: `Hard ${pTotal} vs strong dealer (${dKey}) — Hit. Can't afford to give dealer a free win.`,
  }
}

function hard10(dKey: string, dVal: number, customReason?: string): OptimalMove {
  const reason = customReason ?? 'Hard 10 vs 2–9 — Double, likely to land a strong hand.'
  if (dVal >= 10) return { move: 'Hit', reason: `Hard 10 vs ${dKey} — dealer is strong, just Hit.` }
  return { move: 'Double', reason }
}
