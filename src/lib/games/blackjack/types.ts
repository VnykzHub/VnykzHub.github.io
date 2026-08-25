export type Suit = '♠' | '♣' | '♥' | '♦'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export interface Card {
  rank: Rank
  suit: Suit
}
export type Move = 'Hit' | 'Stand' | 'Double' | 'Split'
export type Phase = 'betting' | 'dealing' | 'player' | 'dealer' | 'settled'
export type Tone = 'neutral' | 'win' | 'lose' | 'push'
export type HandStatus = 'active' | 'stood' | 'bust' | 'blackjack'

export interface PlayerHand {
  cards: Card[]
  bet: number
  status: HandStatus
  doubled: boolean
}

export interface BlackjackState {
  phase: Phase
  shoe: Card[]
  cardsSeen: number
  decksRemaining: number
  runningCount: number
  newShoe: boolean
  bank: number
  bet: number
  hands: PlayerHand[]
  activeHand: number
  dealer: Card[]
  message: string
  tone: Tone
  lastOptimal: { move: Move; reason: string } | null
  hintShown: boolean
  coachFeedback: string | null
  optimalPlays: number
  totalPlays: number
}

export type BlackjackAction =
  | { type: 'ADD_BET'; amount: number }
  | { type: 'CLEAR_BET' }
  | { type: 'DEAL' }
  | { type: 'HIT' }
  | { type: 'STAND' }
  | { type: 'DOUBLE' }
  | { type: 'SPLIT' }
  | { type: 'SHOW_HINT' }
  | { type: 'RESET_BANK' }
  | { type: 'NEW_ROUND' }
