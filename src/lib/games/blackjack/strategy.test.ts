import { describe, it, expect } from 'vitest'
import type { Card, Rank } from './types'
import { getOptimalMove } from './strategy'
import { HARD_TABLE, SOFT_TABLE, PAIR_TABLE, UPCOLS, CELL_MOVE, type Cell, type StrategyTable } from './chart'

const c = (rank: Rank, suit: Card['suit'] = '♠'): Card => ({ rank, suit })

/** Pair-free representative two-card hands per hard total. */
const HARD_HAND: Record<string, Card[]> = {
  '8': [c('2'), c('6')],
  '9': [c('3'), c('6')],
  '10': [c('4'), c('6')],
  '11': [c('5'), c('6')],
  '12': [c('5'), c('7')],
  '13': [c('6'), c('7')],
  '14': [c('5'), c('9')],
  '15': [c('6'), c('9')],
  '16': [c('7'), c('9')],
  '17+': [c('10'), c('7')],
}

function handFor(table: StrategyTable, label: string): Card[] {
  if (table === HARD_TABLE) return HARD_HAND[label]
  if (table === SOFT_TABLE) return [c('A'), c(label.slice(1) as Rank)]
  // pairs
  if (label === '10-10') return [c('K', '♠'), c('K', '♥')]
  const rank = label.slice(0, 1) === 'A' ? 'A' : (label.split('-')[0] as Rank)
  return [c(rank, '♠'), c(rank, '♥')]
}

function upcardFor(col: string): Card {
  return c(col as Rank, '♦')
}

describe('chart–engine consistency', () => {
  for (const table of [HARD_TABLE, SOFT_TABLE, PAIR_TABLE]) {
    describe(table.heading, () => {
      for (const row of table.rows) {
        for (let i = 0; i < UPCOLS.length; i++) {
          const col = UPCOLS[i]
          const expected: Cell = row.cells[i]
          it(`${row.label} vs ${col} → ${expected}`, () => {
            const { move } = getOptimalMove(handFor(table, row.label), upcardFor(col))
            expect(move).toBe(CELL_MOVE[expected])
          })
        }
      }
    })
  }
})

describe('strategy spot checks', () => {
  const cases: [Card[], Card, ReturnType<typeof getOptimalMove>['move']][] = [
    [[c('10'), c('6')], c('7'), 'Hit'],
    [[c('10'), c('6')], c('6'), 'Stand'],
    [[c('5'), c('6')], c('A'), 'Hit'],
    [[c('A'), c('7')], c('2'), 'Stand'],
    [[c('A'), c('7')], c('5'), 'Double'],
    [[c('8'), c('8')], c('A'), 'Split'],
    [[c('9'), c('9')], c('7'), 'Stand'],
    [[c('5'), c('5')], c('4'), 'Double'],
    [[c('A'), c('2')], c('4'), 'Hit'],
    [[c('A'), c('6')], c('3'), 'Double'],
    [[c('5'), c('7')], c('2'), 'Hit'], // hard 12 vs 2
    [[c('5'), c('7')], c('4'), 'Stand'], // hard 12 vs 4
  ]
  for (const [hand, up, expected] of cases) {
    it(`${hand.map((x) => x.rank).join('')} vs ${up.rank} → ${expected}`, () => {
      expect(getOptimalMove(hand, up).move).toBe(expected)
    })
  }

  it('always returns a non-empty reason', () => {
    const { reason } = getOptimalMove([c('10'), c('6')], c('7'))
    expect(reason.length).toBeGreaterThan(0)
  })
})
