import type { AtlasAnim } from '../../llm-atlas/types'
import {
  AMBER,
  PATINA,
  RUST,
  SOFT,
  RULE,
  FAINT,
  INK,
  box,
  arrow,
  arrowDown,
  caption,
  rr,
  label,
  dashed,
  ramp,
  MONO,
  SANS,
} from './_shared'

/**
 * Canvas figures for sections 02 (Embeddings & Search) and 03 (Vector
 * Databases) of the AI Engineering Atlas.
 *
 * Same contract as every other figure module: (ctx, w, h, t), ctx pre-scaled
 * to CSS pixels, t seconds since the figure became visible. AtlasFigure paints
 * t=0 once under prefers-reduced-motion, so every figure below is fully
 * legible at t=0 — animation only adds a pulse, sweep or travelling marker on
 * top of content that is already complete.
 *
 * Point clouds are hand-placed, normalised 0..1 coordinates — never
 * Math.random() — so the geometry is stable across renders and the specific
 * claims each figure makes (which points are nearest, which fall in/out of a
 * top-k set) stay true from frame to frame.
 */

/* ── 02: embedding geometry ────────────────────────────────────────────── */

/**
 * Three related texts cluster in a 2D projection; one unrelated text sits far
 * off. The point is that proximity here is semantic — "an animal makes
 * noise" lands inside the neighbourhood of the two concrete sentences even
 * though it shares no words with either.
 */
const embeddingGeometryProjection: AtlasAnim = (ctx, w, h, t) => {
  const x0 = 40
  const y0 = 30
  const bw = w - x0 * 2
  const bh = h - 66

  label(ctx, 'embedding space — 2d projection', x0, 16, SOFT, 9.5)

  ctx.strokeStyle = FAINT
  ctx.lineWidth = 1
  for (let i = 1; i < 6; i++) {
    const gx = x0 + (bw * i) / 6
    ctx.beginPath()
    ctx.moveTo(gx, y0)
    ctx.lineTo(gx, y0 + bh)
    ctx.stroke()
  }
  for (let j = 1; j < 4; j++) {
    const gy = y0 + (bh * j) / 4
    ctx.beginPath()
    ctx.moveTo(x0, gy)
    ctx.lineTo(x0 + bw, gy)
    ctx.stroke()
  }

  const P = (nx: number, ny: number): [number, number] => [x0 + nx * bw, y0 + ny * bh]
  const dog = P(0.3, 0.62)
  const cat = P(0.42, 0.68)
  const animal = P(0.34, 0.46)
  const unrelated = P(0.85, 0.18)

  // A loose boundary around the semantic neighbourhood. Radius breathes
  // slightly with t — a highlight, not the reason the boundary exists.
  const cx = (dog[0] + cat[0] + animal[0]) / 3
  const cy = (dog[1] + cat[1] + animal[1]) / 3
  const spread = Math.max(
    Math.hypot(cx - dog[0], cy - dog[1]),
    Math.hypot(cx - cat[0], cy - cat[1]),
    Math.hypot(cx - animal[0], cy - animal[1])
  )
  const r = spread + 24 + Math.sin(t * 1.1) * 1.5
  ctx.strokeStyle = PATINA
  ctx.globalAlpha = 0.5
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  const dot = (p: [number, number], colour: string) => {
    ctx.fillStyle = colour
    ctx.beginPath()
    ctx.arc(p[0], p[1], 4.5, 0, Math.PI * 2)
    ctx.fill()
  }
  dot(dog, PATINA)
  dot(cat, PATINA)
  dot(animal, PATINA)
  dot(unrelated, RUST)

  const tag = (p: [number, number], text: string, colour: string, dx: number, dy: number) => {
    ctx.fillStyle = colour
    ctx.font = `9.5px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText(text, p[0] + dx, p[1] + dy)
  }
  tag(dog, '"a dog barks"', INK, -6, -12)
  tag(cat, '"a cat meows"', INK, 22, 16)
  tag(animal, '"an animal makes noise"', AMBER, -4, -12)
  tag(unrelated, '"revenue fell 3%"', RUST, 0, -12)

  caption(
    ctx,
    'semantic proximity, not lexical overlap — a keyword search for "animal" finds none of these',
    w / 2,
    h - 10
  )
}

/* ── 02: ANN index trade-off ───────────────────────────────────────────── */

/** One fixed 14-point corpus, shared by both index panels below. Index 0 is the query. */
const CLOUD_02_03: [number, number][] = [
  [0.46, 0.56],
  [0.3, 0.35],
  [0.42, 0.28],
  [0.58, 0.3],
  [0.68, 0.4],
  [0.62, 0.55],
  [0.48, 0.62],
  [0.34, 0.58],
  [0.22, 0.48],
  [0.2, 0.68],
  [0.38, 0.78],
  [0.55, 0.75],
  [0.72, 0.65],
  [0.78, 0.22],
]

/** A small hand-built navigable graph over CLOUD_02_03. */
const HNSW_EDGES: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 8],
  [8, 7],
  [7, 6],
  [6, 5],
  [5, 4],
  [6, 10],
  [7, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 5],
  [2, 13],
  [4, 13],
  [0, 6],
  [0, 5],
  [0, 7],
]

/** Greedy descent from a far entry point down to the query's neighbourhood. */
const HNSW_PATH = [13, 4, 5, 6, 7, 0]

/**
 * The same corpus searched two ways. HNSW descends a graph and visits more
 * nodes on the way to a good answer; IVF restricts the search to whichever
 * partition the query fell into and stops there.
 */
const annIndexTradeoff: AtlasAnim = (ctx, w, h, t) => {
  const half = w / 2
  const bw = Math.min(half - 52, 300)
  const bh = h - 64
  const y0 = 34
  const leftX0 = half / 2 - bw / 2
  const rightX0 = half + half / 2 - bw / 2

  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('HNSW — graph descent', half / 2, 18)
  ctx.fillText('IVF — cluster partitions', half + half / 2, 18)

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(half, 8)
  ctx.lineTo(half, h - 8)
  ctx.stroke()

  const Pl = ([nx, ny]: [number, number]): [number, number] => [leftX0 + nx * bw, y0 + ny * bh]
  const Pr = ([nx, ny]: [number, number]): [number, number] => [rightX0 + nx * bw, y0 + ny * bh]

  /* left: HNSW */
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  HNSW_EDGES.forEach(([a, b]) => {
    const [ax, ay] = Pl(CLOUD_02_03[a])
    const [bx, by] = Pl(CLOUD_02_03[b])
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  })

  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2
  for (let i = 0; i < HNSW_PATH.length - 1; i++) {
    const [ax, ay] = Pl(CLOUD_02_03[HNSW_PATH[i]])
    const [bx, by] = Pl(CLOUD_02_03[HNSW_PATH[i + 1]])
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }

  const visited = new Set(HNSW_PATH)
  CLOUD_02_03.forEach((n, i) => {
    const [px, py] = Pl(n)
    const onPath = visited.has(i) && i !== 0
    ctx.globalAlpha = i === 0 || onPath ? 1 : 0.4
    ctx.fillStyle = i === 0 ? RUST : onPath ? AMBER : SOFT
    ctx.beginPath()
    ctx.arc(px, py, i === 0 ? 5 : onPath ? 4 : 2.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  })
  const [qlx, qly] = Pl(CLOUD_02_03[0])
  label(ctx, 'query', qlx + 7, qly - 7, RUST, 8.5)

  // A marker travelling the traversal order — the path itself is already fully drawn.
  const steps = HNSW_PATH.length - 1
  const prog = (t * 0.35) % steps
  const seg0 = Math.floor(prog)
  const frac = prog - seg0
  const [sax, say] = Pl(CLOUD_02_03[HNSW_PATH[seg0]])
  const [sbx, sby] = Pl(CLOUD_02_03[HNSW_PATH[seg0 + 1]])
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(sax + (sbx - sax) * frac, say + (sby - say) * frac, 3, 0, Math.PI * 2)
  ctx.fill()

  caption(ctx, `${HNSW_PATH.length} of ${CLOUD_02_03.length} nodes visited — higher recall`, half / 2, h - 10)

  /* right: IVF */
  const midx = rightX0 + bw / 2
  const midy = y0 + bh / 2
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(midx, y0)
  ctx.lineTo(midx, y0 + bh)
  ctx.moveTo(rightX0, midy)
  ctx.lineTo(rightX0 + bw, midy)
  ctx.stroke()

  const quadrant = ([nx, ny]: [number, number]) => (nx < 0.5 ? 0 : 1) + (ny < 0.5 ? 0 : 2)
  const queryQ = quadrant(CLOUD_02_03[0])

  CLOUD_02_03.forEach((n, i) => {
    const [px, py] = Pr(n)
    const active = quadrant(n) === queryQ
    ctx.globalAlpha = i === 0 || active ? 1 : 0.35
    ctx.fillStyle = i === 0 ? RUST : active ? PATINA : SOFT
    ctx.beginPath()
    ctx.arc(px, py, i === 0 ? 5 : 3.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  })
  const [qrx, qry] = Pr(CLOUD_02_03[0])
  label(ctx, 'query', qrx + 7, qry - 7, RUST, 8.5)

  caption(ctx, '1 of 4 partitions searched — lower latency, coarser recall', half + half / 2, h - 10)
}

/* ── 03: library vs. database ──────────────────────────────────────────── */

/**
 * A library lives inside one process: your code calls straight into an
 * in-RAM index. A database is a service: clients reach it over the network,
 * and it persists and replicates on its own.
 */
const vectorDbVsLibrary: AtlasAnim = (ctx, w, h, t) => {
  const half = w / 2

  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('library — one process', half / 2, 18)
  ctx.fillText('database — a service', half + half / 2, 18)

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(half, 8)
  ctx.lineTo(half, h - 8)
  ctx.stroke()

  /* left: in-process library */
  const lw = Math.min(half - 50, 220)
  const lx = half / 2 - lw / 2
  const ly = 34
  const lh = h - ly - 26

  ctx.strokeStyle = FAINT
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  rr(ctx, lx, ly, lw, lh, 8)
  ctx.stroke()
  ctx.setLineDash([])
  label(ctx, 'python process', lx + 8, ly + 14, SOFT, 9)

  const appW = Math.min(lw - 40, 110)
  const appX = lx + lw / 2 - appW / 2
  box(ctx, appX, ly + 24, appW, 24, 'your code', AMBER)
  arrowDown(ctx, appX + appW / 2, ly + 48, ly + 70, RULE)
  box(ctx, appX, ly + 70, appW, 26, 'vectors in RAM', PATINA)

  ctx.fillStyle = SOFT
  ctx.font = `10px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('in RAM only — no persistence', appX + appW / 2, ly + lh - 12)

  caption(ctx, 'no persistence, no failover — dies with the process', half / 2, h - 10)

  /* right: networked database */
  const clientW = Math.min(half * 0.24, 64)
  const c1x = half + half * 0.28 - clientW / 2
  const c2x = half + half * 0.72 - clientW / 2
  const c1y = 40
  const c2y = 92

  box(ctx, c1x, c1y, clientW, 20, 'client', SOFT)
  box(ctx, c2x, c2y, clientW, 20, 'client', SOFT)

  const dbW = Math.min(half - 70, 110)
  const dbX = half + half / 2 - dbW / 2 + 14
  const dbY = c1y - 8
  const dbH = c2y + 20 - dbY + 8
  box(ctx, dbX, dbY + dbH / 2 - 15, dbW, 30, 'primary db', PATINA)

  arrow(ctx, c1x + clientW, c1y + 10, dbX - 4, PATINA)
  arrow(ctx, c2x + clientW, c2y + 10, dbX - 4, PATINA)

  const repW = Math.min(dbW, 100)
  const repX = dbX + dbW / 2 - repW / 2
  const repY = dbY + dbH + 22
  dashed(ctx, dbX + dbW / 2, dbY + dbH / 2 + 15, repX + repW / 2, repY, RUST)
  box(ctx, repX, repY, repW, 22, 'replica', RUST, 0.85)

  // A packet travelling the replication link — the link itself is already drawn.
  const rp = (t * 0.4) % 1
  const rax = dbX + dbW / 2
  const ray = dbY + dbH / 2 + 15
  const rbx = repX + repW / 2
  const rby = repY
  ctx.fillStyle = RUST
  ctx.beginPath()
  ctx.arc(rax + (rbx - rax) * rp, ray + (rby - ray) * rp, 2.6, 0, Math.PI * 2)
  ctx.fill()

  caption(ctx, 'persists, replicates, serves many clients over the network', half + half / 2, h - 10)
}

/* ── 03: metadata filtering and recall ─────────────────────────────────── */

/**
 * ANN returns the k=3 nearest vectors first; the metadata predicate is
 * applied afterwards. Two of the three fail it, leaving one — and a vector
 * that does pass the predicate, and is closer, was never retrieved because
 * it fell outside the ANN search window.
 */
const metadataFilteringRecall: AtlasAnim = (ctx, w, h, t) => {
  const padX = Math.min(60, w * 0.1)
  const x0 = padX
  const y0 = 26
  const bw = w - padX * 2
  const bh = h * 0.56

  label(ctx, 'ann search, then filter by metadata', x0, 14, SOFT, 9.5)

  const P = (nx: number, ny: number): [number, number] => [x0 + nx * bw, y0 + ny * bh]
  const query = P(0.5, 0.46)
  const survivor = P(0.5, 0.66)
  const failA = P(0.36, 0.38)
  const failB = P(0.61, 0.4)
  const missed = P(0.28, 0.58)
  const distractors: [number, number][] = [P(0.82, 0.26), P(0.14, 0.22), P(0.85, 0.72), P(0.18, 0.8)]

  const rx = Math.min(bw, bh) * 0.24 + Math.sin(t * 1.2) * 1.5
  ctx.strokeStyle = AMBER
  ctx.globalAlpha = 0.55
  ctx.setLineDash([4, 3])
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.ellipse(query[0], query[1], rx, rx * 0.86, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  label(ctx, 'k=3 search window', query[0] + rx + 6, query[1], AMBER, 8.5)

  distractors.forEach((p) => {
    ctx.fillStyle = FAINT
    ctx.beginPath()
    ctx.arc(p[0], p[1], 3, 0, Math.PI * 2)
    ctx.fill()
  })

  const dot = (p: [number, number], colour: string, r: number) => {
    ctx.fillStyle = colour
    ctx.beginPath()
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2)
    ctx.fill()
  }
  const cross = (p: [number, number]) => {
    ctx.strokeStyle = RUST
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(p[0] - 5, p[1] - 5)
    ctx.lineTo(p[0] + 5, p[1] + 5)
    ctx.moveTo(p[0] + 5, p[1] - 5)
    ctx.lineTo(p[0] - 5, p[1] + 5)
    ctx.stroke()
  }
  const tag = (p: [number, number], text: string, colour: string) => {
    ctx.fillStyle = colour
    ctx.font = `10px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText(text, p[0], p[1] + 16)
  }

  dot(failA, RUST, 4.5)
  cross(failA)
  tag(failA, 'fails filter', RUST)
  dot(failB, RUST, 4.5)
  cross(failB)
  dot(survivor, PATINA, 5)
  tag(survivor, 'returned', PATINA)
  dot(missed, PATINA, 5)
  tag(missed, 'passes, missed', PATINA)
  dot(query, AMBER, 4)
  tag(query, 'query', AMBER)

  const barY = h - 40
  const slotW = 34
  const gap = 10
  const bx0 = w / 2 - (slotW * 3 + gap * 2) / 2
  const states = [false, false, true]
  states.forEach((ok, i) => {
    const sx = bx0 + i * (slotW + gap)
    box(ctx, sx, barY, slotW, 20, ok ? 'kept' : 'cut', ok ? PATINA : RUST, ok ? 1 : 0.55)
  })

  caption(ctx, 'requested k = 3 → post-filter returns 1, and not the closest match', w / 2, h - 6)
}

/* ── 03: quantization trade-off ────────────────────────────────────────── */

/** Six candidates with a fixed, hand-chosen float32→int8 drift each. */
const QPOINTS: { id: string; orig: [number, number]; quant: [number, number] }[] = [
  { id: 'A', orig: [0.4, 0.4], quant: [0.43, 0.42] },
  { id: 'B', orig: [0.58, 0.44], quant: [0.6, 0.4] },
  { id: 'C', orig: [0.47, 0.6], quant: [0.45, 0.63] },
  { id: 'D', orig: [0.63, 0.55], quant: [0.6, 0.52] },
  { id: 'E', orig: [0.35, 0.55], quant: [0.38, 0.5] },
  { id: 'F', orig: [0.55, 0.3], quant: [0.52, 0.35] },
]
const QUERY_N: [number, number] = [0.5, 0.5]
/** Nearest-3 by true (float32) distance to QUERY_N. */
const TOP3_ORIG = ['B', 'C', 'D']
/** Nearest-3 by quantised (int8) distance — B and C drop out; A and E enter. */
const TOP3_QUANT = ['D', 'A', 'E']

/**
 * Quantisation moves every vector a little. Two of the three nearest
 * neighbours by exact distance are no longer in the nearest three once
 * positions are rounded to int8 — the top-k set itself changes, not just the
 * distances.
 */
const quantizationTradeoff: AtlasAnim = (ctx, w, h, t) => {
  const padX = Math.min(70, w * 0.12)
  const x0 = padX
  const y0 = 30
  const bw = w - padX * 2
  const bh = h - 86

  label(ctx, 'float32 vs int8 — same query, different top-3', x0, 16, SOFT, 9.5)

  const P = ([nx, ny]: [number, number]): [number, number] => [x0 + nx * bw, y0 + ny * bh]
  const query = P(QUERY_N)

  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(query[0], query[1], 4.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('query', query[0], query[1] - 10)

  // Drift lines fade in slightly over the first second — a polish detail;
  // the lines themselves are already visible at t=0.
  const driftAlpha = 0.4 + 0.6 * ramp(t, 1.2)

  QPOINTS.forEach(({ id, orig, quant }) => {
    const po = P(orig)
    const pq = P(quant)
    const inOrig = TOP3_ORIG.includes(id)
    const inQuant = TOP3_QUANT.includes(id)

    ctx.strokeStyle = FAINT
    ctx.globalAlpha = driftAlpha
    ctx.setLineDash([2, 2])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(po[0], po[1])
    ctx.lineTo(pq[0], pq[1])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    if (inOrig) {
      ctx.strokeStyle = PATINA
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.arc(po[0], po[1], 8, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(po[0], po[1], 3.6, 0, Math.PI * 2)
    ctx.stroke()

    if (inQuant) {
      ctx.strokeStyle = RUST
      ctx.setLineDash([2, 2])
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.arc(pq[0], pq[1], 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.arc(pq[0], pq[1], 3.6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = SOFT
    ctx.font = `10px ${MONO}`
    ctx.textAlign = 'left'
    ctx.fillText(id, po[0] + 6, po[1] - 6)
  })

  const legendY = y0 + bh + 18
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.arc(x0 + 6, legendY, 3.6, 0, Math.PI * 2)
  ctx.stroke()
  label(ctx, 'float32 (original)', x0 + 16, legendY + 3, INK, 9)

  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(x0 + 150, legendY, 3.6, 0, Math.PI * 2)
  ctx.fill()
  label(ctx, 'int8 (quantised)', x0 + 160, legendY + 3, AMBER, 9)

  caption(ctx, 'top-3 by float32: B, C, D — by int8: D, A, E', w / 2, h - 8)
}

/* ── Registry ───────────────────────────────────────────────────────────── */

export const FIGURES_02_03: Record<string, AtlasAnim> = {
  'embedding-geometry-projection': embeddingGeometryProjection,
  'ann-index-tradeoff': annIndexTradeoff,
  'vector-db-vs-library': vectorDbVsLibrary,
  'metadata-filtering-recall': metadataFilteringRecall,
  'quantization-tradeoff': quantizationTradeoff,
}
