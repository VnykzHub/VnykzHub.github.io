import type { Card, Move } from './types'

export interface Scenario {
  q: string
  player: Card[]
  dealer: Card
  correct: Move
  opts: Move[]
  explain: string
}

/** Practice quizzes ported from the original prototype, typed. */
export const SCENARIOS: Scenario[] = [
  {
    q: 'You have 16 vs dealer showing 7. What do you do?',
    player: [
      { rank: '9', suit: '♠' },
      { rank: '7', suit: '♣' },
    ],
    dealer: { rank: '7', suit: '♦' },
    correct: 'Hit',
    opts: ['Hit', 'Stand', 'Double'],
    explain:
      'Hard 16 vs 7 — always Hit. Dealer likely has 17 (with a 10 underneath). Standing gives you 0% chance to win. Hitting gives you a ~26% chance of improving. This is the correct play even though it feels scary.',
  },
  {
    q: 'You have 11 vs dealer showing 6. What do you do?',
    player: [
      { rank: '7', suit: '♥' },
      { rank: '4', suit: '♦' },
    ],
    dealer: { rank: '6', suit: '♣' },
    correct: 'Double',
    opts: ['Hit', 'Stand', 'Double'],
    explain:
      "Hard 11 vs dealer's 6 (worst dealer card) — always Double Down. You have a ~31% chance of drawing a 10-value card for 21. The dealer is weak and likely to bust. Maximum your profit here.",
  },
  {
    q: 'You have Ace-7 (soft 18) vs dealer showing 9. What do you do?',
    player: [
      { rank: 'A', suit: '♠' },
      { rank: '7', suit: '♥' },
    ],
    dealer: { rank: '9', suit: '♣' },
    correct: 'Hit',
    opts: ['Hit', 'Stand', 'Double'],
    explain:
      "Soft 18 vs dealer 9 — Hit. Dealer likely has 19 with a 10 underneath. Your 18 loses. Since you have a soft hand (Ace counts as 1 or 11), hitting can't bust you to anything unmanageable.",
  },
  {
    q: 'You have two 8s vs dealer showing 10. Split or not?',
    player: [
      { rank: '8', suit: '♣' },
      { rank: '8', suit: '♦' },
    ],
    dealer: { rank: '10', suit: '♠' },
    correct: 'Split',
    opts: ['Split', 'Hit', 'Stand'],
    explain:
      "Always split 8s — even vs dealer's 10. Hard 16 is the worst possible hand with near-zero EV. By splitting, each 8 becomes the start of a new hand that could reach 18. Yes it costs more, but you lose less overall.",
  },
  {
    q: 'You have two 10s vs dealer showing 6. What do you do?',
    player: [
      { rank: 'K', suit: '♦' },
      { rank: 'Q', suit: '♠' },
    ],
    dealer: { rank: '6', suit: '♥' },
    correct: 'Stand',
    opts: ['Stand', 'Split', 'Double'],
    explain:
      "Never split 10s! 20 is the second best hand in blackjack. You win ~92% of the time with 20. Splitting ruins a near-certain win for two risky hands. Classic mistake beginners make when they see dealer's weak 6.",
  },
  {
    q: 'You have 12 vs dealer showing 4. What do you do?',
    player: [
      { rank: '7', suit: '♣' },
      { rank: '5', suit: '♦' },
    ],
    dealer: { rank: '4', suit: '♠' },
    correct: 'Stand',
    opts: ['Hit', 'Stand', 'Double'],
    explain:
      'Hard 12 vs dealer 4 — Stand. Dealer has a weak upcard and likely has 14 (bust range). Hitting 12 means any card 10 or higher busts you (~31% chance). Let the dealer bust instead.',
  },
  {
    q: 'You have Ace-6 (soft 17) vs dealer showing 3. What do you do?',
    player: [
      { rank: 'A', suit: '♥' },
      { rank: '6', suit: '♣' },
    ],
    dealer: { rank: '3', suit: '♦' },
    correct: 'Double',
    opts: ['Hit', 'Stand', 'Double'],
    explain:
      "Soft 17 vs dealer 3 — Double Down! Soft 17 can't bust in one hit. Dealer showing 3 is weak. You're likely to improve your hand and dealer is likely to bust. Classic double-down spot that many players miss.",
  },
  {
    q: 'You have 9 vs dealer showing 2. What do you do?',
    player: [
      { rank: '5', suit: '♠' },
      { rank: '4', suit: '♥' },
    ],
    dealer: { rank: '2', suit: '♣' },
    correct: 'Hit',
    opts: ['Hit', 'Double', 'Stand'],
    explain:
      "Hard 9 vs dealer 2 — Hit, don't Double. You only Double 9 vs dealer 3–6. Dealer's 2 is weak but not weak enough to commit extra money. Just Hit and hope to improve.",
  },
]
