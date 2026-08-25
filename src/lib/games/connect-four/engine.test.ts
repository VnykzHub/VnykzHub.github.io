import { describe, it, expect } from 'vitest'
import { AI, H, HUMAN, W, canPlay, findWinLine, idx, play, think, wins } from './engine'

const board = () => new Int8Array(W * H)

describe('wins', () => {
  it('detects a horizontal four', () => {
    const b = board()
    for (let c = 0; c < 4; c++) play(b, c, HUMAN)
    const r = H - 1
    expect(wins(b, r, 3, HUMAN)).toBe(true)
  })
  it('detects a vertical four', () => {
    const b = board()
    let r = 0
    for (let i = 0; i < 4; i++) r = play(b, 0, HUMAN)
    expect(wins(b, r, 0, HUMAN)).toBe(true)
  })
  it('detects a diagonal four', () => {
    const b = board()
    // Human line: (5,0),(4,1),(3,2),(2,3); AI fills the cells below.
    play(b, 0, HUMAN)
    play(b, 1, AI)
    play(b, 1, HUMAN)
    play(b, 2, AI)
    play(b, 2, AI)
    play(b, 2, HUMAN)
    play(b, 3, AI)
    play(b, 3, AI)
    play(b, 3, AI)
    const r = play(b, 3, HUMAN)
    expect(wins(b, r, 3, HUMAN)).toBe(true)
  })
  it('no false positive on three', () => {
    const b = board()
    for (let c = 0; c < 3; c++) play(b, c, HUMAN)
    expect(wins(b, H - 1, 2, HUMAN)).toBe(false)
  })
})

describe('findWinLine', () => {
  it('returns exactly the four winning cells', () => {
    const b = board()
    for (let c = 0; c < 4; c++) play(b, c, HUMAN)
    const line = findWinLine(b, H - 1, 2, HUMAN)
    expect(line).not.toBeNull()
    expect(line!.length).toBe(4)
    expect(line).toContainEqual([H - 1, 0])
    expect(line).toContainEqual([H - 1, 3])
  })
  it('is null for a non-win', () => {
    const b = board()
    play(b, 3, HUMAN)
    expect(findWinLine(b, H - 1, 3, HUMAN)).toBeNull()
  })
})

describe('think', () => {
  it('finds the immediate winning move', () => {
    const b = board()
    // AI has three in column 3; one move wins.
    play(b, 3, HUMAN)
    play(b, 3, AI)
    play(b, 3, AI)
    play(b, 3, AI)
    const result = think(b, 3, true)
    expect(result.bestCol).toBe(3)
  })
  it('blocks an immediate human threat', () => {
    const b = board()
    // Human has three in column 4; AI must block.
    play(b, 4, AI)
    play(b, 4, HUMAN)
    play(b, 4, HUMAN)
    play(b, 4, HUMAN)
    const result = think(b, 3, true)
    expect(result.bestCol).toBe(4)
  })
  it('pruning never visits more nodes than plain search', () => {
    const b = board()
    // A few moves in, so the tree is non-trivial.
    play(b, 3, HUMAN)
    play(b, 3, AI)
    play(b, 2, AI)
    const pruned = think(b, 4, true)
    const plain = think(b, 4, false)
    expect(pruned.nodes).toBeLessThanOrEqual(plain.nodes)
    expect(plain.bestCol).toBeGreaterThanOrEqual(0)
    expect(plain.bestCol).toBeLessThan(W)
  })
})

describe('board mechanics', () => {
  it('full columns are unplayable and play returns −1', () => {
    const b = board()
    for (let i = 0; i < H; i++) play(b, 0, HUMAN)
    expect(canPlay(b, 0)).toBe(false)
    expect(play(b, 0, AI)).toBe(-1)
  })
  it('idx is row-major', () => {
    expect(idx(1, 0)).toBe(W)
    expect(idx(0, 6)).toBe(6)
  })
})
