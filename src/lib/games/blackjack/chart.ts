export type Cell = 'H' | 'S' | 'D' | 'P'

export interface StrategyTable {
  heading: string
  rows: { label: string; cells: Cell[] }[]
}

/** Dealer upcard columns, left to right. */
export const UPCOLS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const

export const HARD_TABLE: StrategyTable = {
  heading: 'Hard totals (no Ace)',
  rows: [
    { label: '8', cells: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'] },
    { label: '9', cells: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { label: '10', cells: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'] },
    { label: '11', cells: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'] },
    { label: '12', cells: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { label: '13', cells: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { label: '14', cells: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { label: '15', cells: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { label: '16', cells: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { label: '17+', cells: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
  ],
}

export const SOFT_TABLE: StrategyTable = {
  heading: 'Soft totals (with Ace)',
  rows: [
    { label: 'A2', cells: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { label: 'A3', cells: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { label: 'A4', cells: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { label: 'A5', cells: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { label: 'A6', cells: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { label: 'A7', cells: ['S', 'D', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'] },
    { label: 'A8', cells: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
    { label: 'A9', cells: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
  ],
}

export const PAIR_TABLE: StrategyTable = {
  heading: 'Pairs',
  rows: [
    { label: 'A-A', cells: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
    { label: '10-10', cells: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
    { label: '9-9', cells: ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'] },
    { label: '8-8', cells: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
    { label: '7-7', cells: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
    { label: '6-6', cells: ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
    { label: '5-5', cells: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'] },
    { label: '4-4', cells: ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'] },
    { label: '3-3', cells: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
    { label: '2-2', cells: ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'] },
  ],
}

export const CELL_MOVE: Record<Cell, 'Hit' | 'Stand' | 'Double' | 'Split'> = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double',
  P: 'Split',
}
