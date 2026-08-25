/**
 * Connect Four engine: negamax with alpha-beta over a 7×6 board, moves ordered
 * centre-outward because centre columns participate in more winning lines and
 * good ordering is most of what makes pruning work. Ported from the prototype,
 * typed, plus findWinLine for the UI's winning-line highlight.
 */

export const W = 7
export const H = 6
export const HUMAN = 1
export const AI = 2
export const ORDER = [3, 2, 4, 1, 5, 0, 6]

export const idx = (r: number, c: number) => r * W + c

export function canPlay(b: Int8Array, c: number): boolean {
  return b[idx(0, c)] === 0
}

/** Drops a piece; returns the row it landed in, or −1 for a full column. */
export function play(b: Int8Array, c: number, p: number): number {
  for (let r = H - 1; r >= 0; r--) {
    if (b[idx(r, c)] === 0) {
      b[idx(r, c)] = p
      return r
    }
  }
  return -1
}

export function undo(b: Int8Array, c: number): void {
  for (let r = 0; r < H; r++) {
    if (b[idx(r, c)] !== 0) {
      b[idx(r, c)] = 0
      return
    }
  }
}

/** The four cells of a winning line through (r, c) for player p, or null. */
export function findWinLine(b: Int8Array, r: number, c: number, p: number): [number, number][] | null {
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]
  for (const [dr, dc] of dirs) {
    const line: [number, number][] = [[r, c]]
    for (const s of [1, -1]) {
      let rr = r + dr * s
      let cc = c + dc * s
      while (rr >= 0 && rr < H && cc >= 0 && cc < W && b[idx(rr, cc)] === p) {
        line.push([rr, cc])
        rr += dr * s
        cc += dc * s
      }
    }
    if (line.length >= 4) return line.slice(0, 4)
  }
  return null
}

export function wins(b: Int8Array, r: number, c: number, p: number): boolean {
  return findWinLine(b, r, c, p) !== null
}

function windowScore(cnt: number[], me: number): number {
  const mine = cnt[me]
  const theirs = cnt[me === AI ? HUMAN : AI]
  const empty = cnt[0]
  if (mine && theirs) return 0
  if (mine === 3 && empty === 1) return 60
  if (mine === 2 && empty === 2) return 8
  if (theirs === 3 && empty === 1) return -70
  if (theirs === 2 && empty === 2) return -9
  return 0
}

export function evaluate(b: Int8Array, me: number): number {
  let s = 0
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (b[idx(r, c)] === me && c === 3) s += 4
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ] as [number, number][]) {
        const er = r + 3 * dr
        const ec = c + 3 * dc
        if (er < 0 || er >= H || ec < 0 || ec >= W) continue
        const cnt = [0, 0, 0]
        for (let k = 0; k < 4; k++) cnt[b[idx(r + k * dr, c + k * dc)]]++
        s += windowScore(cnt, me)
      }
    }
  }
  return s
}

export function negamax(
  b: Int8Array,
  depth: number,
  alpha: number,
  beta: number,
  me: number,
  prune: boolean,
  counter: { nodes: number }
): number {
  counter.nodes++
  const legal = ORDER.filter((c) => canPlay(b, c))
  if (!legal.length) return 0
  if (depth === 0) return evaluate(b, me)
  let best = -Infinity
  for (const c of legal) {
    const r = play(b, c, me)
    let v: number
    if (wins(b, r, c, me)) v = 100000 + depth
    else v = -negamax(b, depth - 1, -beta, -alpha, me === AI ? HUMAN : AI, prune, counter)
    undo(b, c)
    if (v > best) best = v
    if (prune) {
      if (best > alpha) alpha = best
      if (alpha >= beta) break
    }
  }
  return best
}

export interface ThinkResult {
  bestCol: number
  scores: (number | null)[]
  nodes: number
  ms: number
}

export function think(b: Int8Array, depth: number, prune: boolean): ThinkResult {
  const counter = { nodes: 0 }
  const t0 = performance.now()
  const scores: (number | null)[] = new Array(W).fill(null)
  let best = -Infinity
  let bestCol = ORDER.find((c) => canPlay(b, c))!
  for (const c of ORDER) {
    if (!canPlay(b, c)) continue
    const r = play(b, c, AI)
    const v = wins(b, r, c, AI) ? 100000 : -negamax(b, depth - 1, -Infinity, Infinity, HUMAN, prune, counter)
    undo(b, c)
    scores[c] = v
    if (v > best) {
      best = v
      bestCol = c
    }
  }
  return { bestCol, scores, nodes: counter.nodes, ms: performance.now() - t0 }
}
