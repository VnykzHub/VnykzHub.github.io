import type { AtlasAnim } from '../../llm-atlas/types'
import {
  AMBER,
  PATINA,
  RUST,
  BRASS,
  SOFT,
  RULE,
  box,
  arrow,
  arrowDown,
  dashed,
  seg,
  caption,
  rr,
  label,
  MONO,
  SANS,
} from './_shared'

/* ── 10 System Design ──────────────────────────────────────────────────── */

/**
 * The request forks into five questions, each landing on a different piece
 * of the architecture. A travelling highlight cycles through the branches;
 * all five read fine as a static tree at t=0.
 */
const framingQuestionTree: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 600)
  const ox = (w - W) / 2

  const rows: { q: string; leaf: string }[] = [
    { q: 'who, how many', leaf: 'auth, limits' },
    { q: 'how often', leaf: 'cache, sizing' },
    { q: 'how wrong', leaf: 'abstention' },
    { q: 'who pays', leaf: 'cost ceiling' },
    { q: 'on failure', leaf: 'fallback, kill sw' },
  ]

  const rootW = Math.min(76, W * 0.16)
  const rootH = 30
  const rootX = ox + 6
  const rootY = h / 2 - rootH / 2

  const midX = rootX + rootW + 30
  const midW = Math.min(130, W * 0.3)
  const leafX = midX + midW + 26
  const leafW = Math.max(70, ox + W - leafX - 8)

  const top = 20
  const bottom = h - 22
  const rowH = (bottom - top) / rows.length
  const active = Math.floor(t * 0.6) % rows.length

  box(ctx, rootX, rootY, rootW, rootH, 'the request', SOFT)

  rows.forEach((r, i) => {
    const cy = top + rowH * (i + 0.5)
    const on = i === active

    ctx.strokeStyle = on ? AMBER : RULE
    ctx.lineWidth = on ? 1.4 : 1
    ctx.beginPath()
    ctx.moveTo(rootX + rootW, rootY + rootH / 2)
    ctx.lineTo(midX - 6, cy)
    ctx.stroke()

    box(ctx, midX, cy - 11, midW, 22, r.q, on ? AMBER : PATINA, on ? 1 : 0.85)
    arrow(ctx, midX + midW + 4, cy, leafX - 4, on ? AMBER : RUST)
    box(ctx, leafX, cy - 11, leafW, 22, r.leaf, RUST, on ? 1 : 0.75)
  })

  caption(ctx, 'five questions, five different pieces of the design', ox + W / 2, h - 6)
}

/**
 * The flagship figure. Two flows — corpus through ingestion/index, query
 * through retrieval/orchestration/serving — with evaluation and
 * observability drawn as a band alongside the whole pipeline, tapping every
 * stage and feeding back into the index. Solid = load-bearing at small
 * scale; faint = safe to start as a placeholder.
 */
const systemDesignReferenceArchitecture: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 660)
  const ox = (w - W) / 2
  const bh = Math.min(26, h * 0.13)
  const bandBh = Math.min(24, h * 0.12)

  const row1Y = h * 0.12
  const row2Y = h * 0.46
  const row3Y = h * 0.76

  const leftMargin = Math.min(60, W * 0.1)
  const gapSmall = Math.min(28, W * 0.035)

  const x_ing = ox + leftMargin
  const ingBW = Math.min(84, W * 0.18)
  const x_idx = x_ing + ingBW + gapSmall
  const idxBW = Math.min(92, W * 0.19)

  const x_ret = x_idx
  const retBW = idxBW
  const x_orch = x_ret + retBW + gapSmall
  const orchBW = Math.min(120, W * 0.23)
  const x_serv = x_orch + orchBW + gapSmall
  const servBW = Math.min(92, W * 0.18)

  const bandLeft = x_ret
  const bandRight = x_serv + servBW
  const bandSpan = bandRight - bandLeft
  const evalBW = bandSpan * 0.46
  const obsBW = bandSpan * 0.46
  const gapBand = bandSpan * 0.08
  const x_eval = bandLeft
  const x_obs = x_eval + evalBW + gapBand

  // a faint band behind evaluation + observability — "alongside the whole
  // pipeline", not inside it
  ctx.globalAlpha = 0.22
  ctx.fillStyle = RULE
  rr(ctx, bandLeft - 10, row3Y - 10, bandSpan + 20, bandBh + 20, 10)
  ctx.fill()
  ctx.globalAlpha = 1

  // corpus -> ingestion, query -> retrieval: both enter from the left margin
  label(ctx, 'corpus', ox + 2, row1Y + bh / 2 + 3, SOFT, 9)
  arrow(ctx, ox + 34, row1Y + bh / 2, x_ing - 4, SOFT)
  label(ctx, 'query', ox + 2, row2Y + bh / 2 + 3, SOFT, 9)
  arrow(ctx, ox + 34, row2Y + bh / 2, x_ret - 4, SOFT)

  const active = Math.floor(t * 0.7) % 4
  const c0 = active === 0 ? AMBER : PATINA
  const c1 = active === 1 ? AMBER : PATINA
  const c2 = active === 2 ? AMBER : PATINA
  const c3 = active === 3 ? AMBER : PATINA

  box(ctx, x_ing, row1Y, ingBW, bh, 'ingestion', PATINA, 1)
  box(ctx, x_idx, row1Y, idxBW, bh, 'index', PATINA, 1)
  arrow(ctx, x_ing + ingBW + 2, row1Y + bh / 2, x_idx - 2, c0)

  box(ctx, x_ret, row2Y, retBW, bh, 'retrieval', PATINA, 1)
  arrowDown(ctx, x_idx + idxBW / 2, row1Y + bh + 2, row2Y - 2, c1)

  box(ctx, x_orch, row2Y, orchBW, bh, 'orchestration', SOFT, 0.5)
  arrow(ctx, x_ret + retBW + 2, row2Y + bh / 2, x_orch - 2, c2)

  box(ctx, x_serv, row2Y, servBW, bh, 'serving', PATINA, 1)
  arrow(ctx, x_orch + orchBW + 2, row2Y + bh / 2, x_serv - 2, c3)

  box(ctx, x_eval, row3Y, evalBW, bandBh, 'evaluation', SOFT, 0.5)
  box(ctx, x_obs, row3Y, obsBW, bandBh, 'observability', SOFT, 0.5)

  // observability taps every stage of the query flow; evaluation feeds back
  // into the index
  const tapY = row2Y + bh + 10
  dashed(ctx, bandLeft, tapY, bandRight, tapY, RULE)
  ;[x_ret + retBW / 2, x_orch + orchBW / 2, x_serv + servBW / 2].forEach((cx) => {
    dashed(ctx, cx, row2Y + bh, cx, tapY, RULE)
  })
  dashed(ctx, x_obs + obsBW / 2, tapY, x_obs + obsBW / 2, row3Y, RULE)
  dashed(ctx, x_eval + evalBW / 2, row3Y, x_idx + idxBW / 2, row1Y + bh, RULE)

  caption(
    ctx,
    'solid = load-bearing at small scale · faint = starts as a placeholder',
    ox + W / 2,
    h - 8
  )
}

/**
 * A fixed 3s P95 budget, segmented to scale, beside the same five stages
 * run unconstrained — a second bar that runs straight past the budget line.
 */
const latencyBudgetAllocation: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 600)
  const ox = (w - W) / 2
  const pad = 20
  const barW = W - pad * 2
  const budgetMs = 3000

  const budget: { label: string; ms: number; c: string; a: number }[] = [
    { label: 'embed', ms: 50, c: SOFT, a: 0.85 },
    { label: 'search', ms: 100, c: PATINA, a: 0.85 },
    { label: 'rerank', ms: 400, c: BRASS, a: 0.85 },
    { label: 'generate', ms: 2000, c: AMBER, a: 0.85 },
    { label: 'margin', ms: 450, c: RULE, a: 0.5 },
  ]
  const uncon: { label: string; ms: number; c: string }[] = [
    { label: 'embed', ms: 50, c: SOFT },
    { label: 'search', ms: 250, c: PATINA },
    { label: 'rerank', ms: 900, c: BRASS },
    { label: 'generate', ms: 3200, c: AMBER },
  ]

  const y1 = h * 0.26
  const y2 = h * 0.56
  const bh = Math.min(22, h * 0.12)

  ctx.fillStyle = SOFT
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('3.0s P95 budget', ox + pad, y1 - 10)

  let x = ox + pad
  budget.forEach((s) => {
    const sw = barW * (s.ms / budgetMs)
    seg(ctx, x, y1, Math.max(sw - 2, 0), bh, s.c, s.a)
    if (sw > 34) {
      ctx.fillStyle = '#100E0C'
      ctx.font = `600 8.5px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(s.label, x + sw / 2, y1 + bh / 2)
      ctx.textBaseline = 'alphabetic'
    }
    x += sw
  })

  ctx.fillStyle = SOFT
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('same five stages, unconstrained', ox + pad, y2 - 10)

  x = ox + pad
  const totalUncon = uncon.reduce((a, s) => a + s.ms, 0)
  uncon.forEach((s) => {
    const sw = barW * (s.ms / budgetMs)
    seg(ctx, x, y2, Math.max(sw - 2, 0), bh, s.c, 0.85)
    if (sw > 34) {
      ctx.fillStyle = '#100E0C'
      ctx.font = `600 8.5px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(s.label, x + sw / 2, y2 + bh / 2)
      ctx.textBaseline = 'alphabetic'
    }
    x += sw
  })

  // the budget line, drawn through both bars so the overrun is unambiguous
  const lineX = ox + pad + barW
  const pulse = 0.55 + 0.3 * Math.sin(t * 2)
  ctx.strokeStyle = RUST
  ctx.globalAlpha = pulse
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(lineX, y1 - 16)
  ctx.lineTo(lineX, y2 + bh + 8)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  const overMs = totalUncon - budgetMs
  caption(
    ctx,
    `rerank + generate push it ${(overMs / 1000).toFixed(1)}s over budget`,
    ox + W / 2,
    y2 + bh + 26
  )
}

/**
 * Index size, ingestion throughput and concurrency all get absorbed by more
 * hardware at 10x, then hit a wall at 100x — a memory wall for the index, an
 * account-level rate limit for the other two. Cost per request carries no
 * wall at all: a straight line climbing through every column.
 */
const scalingBreakpoints: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 600)
  const ox = (w - W) / 2
  const leftColW = Math.min(108, W * 0.26)
  const gridX0 = ox + leftColW + 8
  const gridW = W - leftColW - 8
  const colW = gridW / 3

  const rows: { label: string; cells: [string, string, string]; colors: [string, string, string] } [] = [
    { label: 'index size', cells: ['—', 'absorbed', 'memory wall'], colors: [SOFT, PATINA, RUST] },
    { label: 'ingest throughput', cells: ['—', 'absorbed', 'rate limit'], colors: [SOFT, PATINA, AMBER] },
    { label: 'concurrency', cells: ['—', 'absorbed', 'acct ceiling'], colors: [SOFT, PATINA, AMBER] },
  ]

  const headerY = h * 0.1
  const rowsTop = headerY + 20
  const rowH = Math.min(28, h * 0.15)

  ;['1x', '10x', '100x'].forEach((c, j) => {
    ctx.fillStyle = SOFT
    ctx.font = `600 9px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText(c, gridX0 + colW * (j + 0.5), headerY)
  })

  const highlightCol = Math.floor(t * 0.4) % 3

  rows.forEach((r, i) => {
    const y = rowsTop + i * rowH
    label(ctx, r.label, ox, y + rowH / 2 + 3, SOFT, 9.5)
    r.cells.forEach((txt, j) => {
      const cx = gridX0 + colW * j
      const on = j === highlightCol
      box(ctx, cx, y + 4, colW - 8, rowH - 8, txt, r.colors[j], on ? 1 : 0.75)
    })
  })

  // cost per request: no wall, climbs straight through every column
  const costY = rowsTop + rows.length * rowH + 10
  const costH = Math.min(30, rowH)
  label(ctx, 'cost / request', ox, costY + costH / 2 + 3, SOFT, 9.5)

  const lx0 = gridX0 + 8
  const lx1 = gridX0 + gridW - 8
  const ly0 = costY + costH - 6
  const ly1 = costY + 6
  ctx.strokeStyle = RUST
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(lx0, ly0)
  ctx.lineTo(lx1, ly1)
  ctx.stroke()
  ;[0, 1, 2].forEach((j) => {
    const px = gridX0 + colW * (j + 0.5)
    const py = ly0 + (ly1 - ly0) * (j / 2)
    ctx.fillStyle = RUST
    ctx.beginPath()
    ctx.arc(px, py, 2.5, 0, Math.PI * 2)
    ctx.fill()
  })

  caption(
    ctx,
    'rust = hardware wall · amber = account ceiling · patina = absorbed',
    ox + W / 2,
    h - 8
  )
}

/**
 * Accuracy, latency and cost at the corners of one triangle: pulling any
 * corner further out drags the other two in. Two named resolutions sit
 * pulled inside the triangle rather than at a corner. Freshness vs
 * stability sits off to the side, on its own axis.
 */
const conflictingConstraintsTriangle: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 560)
  const ox = (w - W) / 2
  const cx = ox + W * 0.36
  const cy = h * 0.42
  const R = Math.min(64, h * 0.3, W * 0.22)

  const top = { x: cx, y: cy - R, l: 'accuracy', c: PATINA }
  const bl = { x: cx - R * 0.87, y: cy + R * 0.55, l: 'latency', c: AMBER }
  const br = { x: cx + R * 0.87, y: cy + R * 0.55, l: 'cost', c: RUST }
  const corners = [top, bl, br]
  const centroid = { x: (top.x + bl.x + br.x) / 3, y: (top.y + bl.y + br.y) / 3 }

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(top.x, top.y)
  ctx.lineTo(bl.x, bl.y)
  ctx.lineTo(br.x, br.y)
  ctx.closePath()
  ctx.stroke()

  const pullIdx = Math.floor(t * 0.4) % 3

  const diagArrow = (x1: number, y1: number, x2: number, y2: number, colour: string) => {
    ctx.strokeStyle = colour
    ctx.fillStyle = colour
    ctx.lineWidth = 1.4
    const ang = Math.atan2(y2 - y1, x2 - x1)
    const backX = x2 - Math.cos(ang) * 6
    const backY = y2 - Math.sin(ang) * 6
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(backX, backY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(backX - Math.sin(ang) * 3.5, backY + Math.cos(ang) * 3.5)
    ctx.lineTo(backX + Math.sin(ang) * 3.5, backY - Math.cos(ang) * 3.5)
    ctx.closePath()
    ctx.fill()
  }

  corners.forEach((c, i) => {
    const on = i === pullIdx
    const dx = c.x - centroid.x
    const dy = c.y - centroid.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    if (on) {
      diagArrow(c.x + ux * 6, c.y + uy * 6, c.x + ux * 20, c.y + uy * 20, AMBER)
    } else {
      dashed(ctx, c.x - ux * 6, c.y - uy * 6, c.x - ux * 20, c.y - uy * 20, RUST)
    }
    box(ctx, c.x - 34, c.y - 11, 68, 22, c.l, c.c, 1)
  })

  // two named resolutions, pulled inside the triangle rather than at a corner
  const rerankPt = {
    x: ((top.x + bl.x) / 2) * 0.65 + centroid.x * 0.35,
    y: ((top.y + bl.y) / 2) * 0.65 + centroid.y * 0.35,
  }
  const routePt = {
    x: ((top.x + br.x) / 2) * 0.65 + centroid.x * 0.35,
    y: ((top.y + br.y) / 2) * 0.65 + centroid.y * 0.35,
  }
  ;[
    { p: rerankPt, txt: 'conditional rerank' },
    { p: routePt, txt: 'difficulty routing' },
  ].forEach(({ p, txt }) => {
    ctx.fillStyle = BRASS
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = SOFT
    ctx.font = `8.5px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText(txt, p.x, p.y - 8)
  })

  // freshness vs stability: a separate axis, not part of this triangle
  const axisY = Math.min(cy + R + 34, h - 30)
  const axisX0 = ox + W * 0.62
  const axisX1 = Math.min(ox + W - 12, axisX0 + 110)
  ctx.fillStyle = SOFT
  ctx.font = `8.5px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('separate axis', (axisX0 + axisX1) / 2, axisY - 14)
  arrow(ctx, axisX0, axisY, axisX1, SOFT)
  arrow(ctx, axisX1, axisY + 6, axisX0, SOFT)
  ctx.textAlign = 'left'
  ctx.fillText('freshness', axisX0, axisY + 20)
  ctx.textAlign = 'right'
  ctx.fillText('stability', axisX1, axisY + 20)

  caption(ctx, 'pulling one corner drags the other two inward', ox + W / 2, h - 6)
}

/* ── 11 Rapid Fire ──────────────────────────────────────────────────────── */

type DepNode = { x: number; w: number; y: number; cx: number }

/**
 * Fundamentals and Embeddings & Search feed both RAG and Vector Databases,
 * which feed Agents and MCP through a shared collector, which fork into
 * Production and Model Choice, which converge into System Design.
 * Multimodal sits alongside RAG, tied in with a dashed line — a parallel
 * concern, not a hard dependency.
 */
const rapidFireDependencyMap: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 600)
  const ox = (w - W) / 2
  const bh = Math.min(20, h * 0.09)

  const rowBoxes = (labels: string[], y: number, colour: string): DepNode[] => {
    const gap = 10
    const bw = Math.min(120, (W - gap * (labels.length - 1)) / labels.length)
    const totalW = bw * labels.length + gap * (labels.length - 1)
    let x = ox + (W - totalW) / 2
    return labels.map((lab) => {
      box(ctx, x, y, bw, bh, lab, colour, 1)
      const node = { x, w: bw, y, cx: x + bw / 2 }
      x += bw + gap
      return node
    })
  }

  const y0 = h * 0.08
  const y1 = h * 0.28
  const y2 = h * 0.48
  const yBus = h * 0.62
  const y3 = h * 0.76
  const y4 = h * 0.9

  const l0 = rowBoxes(['Fundamentals', 'Embed & Search'], y0, SOFT)
  const l1 = rowBoxes(['RAG', 'Vector DBs'], y1, PATINA)

  const mmX = l1[1].x + l1[1].w + 14
  const mmW = Math.max(60, Math.min(90, ox + W - mmX - 4))
  box(ctx, mmX, y1, mmW, bh, 'Multimodal', PATINA, 0.55)
  const mmCx = mmX + mmW / 2

  const l2 = rowBoxes(['Agents', 'MCP'], y2, PATINA)

  const l4w = Math.min(220, W * 0.5)
  const l4x = ox + (W - l4w) / 2
  const l4: DepNode = { x: l4x, w: l4w, y: y4, cx: l4x + l4w / 2 }

  const active = Math.floor(t * 0.3) % 3
  const c01 = active === 0 ? AMBER : RULE
  const c12 = active === 1 ? AMBER : RULE
  const c23 = active === 2 ? AMBER : RULE

  const connect = (a: DepNode, b: DepNode, colour: string) => {
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(a.cx, a.y + bh)
    ctx.lineTo(b.cx, b.y)
    ctx.stroke()
  }

  l0.forEach((a) => l1.forEach((b) => connect(a, b, c01)))
  dashed(ctx, l0[1].cx, l0[1].y + bh, mmCx, y1, c01)

  l1.forEach((a) => l2.forEach((b) => connect(a, b, c12)))

  const l3 = rowBoxes(['Production', 'Model Choice'], y3, AMBER)

  const busLeft = Math.min(l2[0].x, l3[0].x)
  const busRight = Math.max(l2[1].x + l2[1].w, l3[1].x + l3[1].w)
  ctx.strokeStyle = c23
  ctx.lineWidth = 1
  l2.forEach((n) => {
    ctx.beginPath()
    ctx.moveTo(n.cx, n.y + bh)
    ctx.lineTo(n.cx, yBus)
    ctx.stroke()
  })
  ctx.beginPath()
  ctx.moveTo(busLeft, yBus)
  ctx.lineTo(busRight, yBus)
  ctx.stroke()
  l3.forEach((n) => {
    ctx.beginPath()
    ctx.moveTo(n.cx, yBus)
    ctx.lineTo(n.cx, n.y)
    ctx.stroke()
  })

  box(ctx, l4.x, l4.y, l4.w, bh, 'System Design', RUST, 1)
  l3.forEach((a, i) => {
    const tx = l4.x + l4.w * (i === 0 ? 0.3 : 0.7)
    ctx.strokeStyle = RULE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(a.cx, a.y + bh)
    ctx.lineTo(tx, y4)
    ctx.stroke()
  })

  caption(ctx, 'Fundamentals underlies every node above it', ox + W / 2, h - 6)
}

/**
 * A three-question decision tree — better prompting, then retrieval, then
 * fine-tuning, in that order of last resort — beside a separate branch for
 * self-hosting, gated on infrastructure thresholds rather than capability.
 */
const rapidFireDecisionTree: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 620)
  const ox = (w - W) / 2
  const leftW = W * 0.6
  const bh = Math.min(24, h * 0.1)

  const steps: { q: string; yes: string }[] = [
    { q: 'prompting enough?', yes: 'ship it — done' },
    { q: 'live or private data?', yes: 'add retrieval' },
    { q: 'strict format needed?', yes: 'fine-tune' },
  ]

  const top = h * 0.1
  const bottom = h * 0.86
  const stepH = (bottom - top) / (steps.length + 1)

  const qW = Math.min(170, leftW * 0.62)
  const qX = ox + 4
  const yesW = Math.min(120, leftW - qW - 40)
  const yesX = qX + qW + 30

  const active = Math.floor(t * 0.5) % steps.length

  steps.forEach((s, i) => {
    const y = top + i * stepH
    const on = i === active
    box(ctx, qX, y, qW, bh, s.q, on ? AMBER : PATINA, on ? 1 : 0.85)
    arrow(ctx, qX + qW + 4, y + bh / 2, yesX - 4, on ? AMBER : PATINA)
    ctx.fillStyle = SOFT
    ctx.font = `8px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText('yes', (qX + qW + yesX) / 2, y + bh / 2 - 5)
    box(ctx, yesX, y, yesW, bh, s.yes, PATINA, on ? 1 : 0.7)

    if (i < steps.length - 1) {
      arrowDown(ctx, qX + qW / 2, y + bh + 2, y + stepH - 2, RULE)
      ctx.fillStyle = SOFT
      ctx.font = `8px ${MONO}`
      ctx.textAlign = 'left'
      ctx.fillText('no', qX + qW / 2 + 6, y + bh + 14)
    }
  })

  const lastY = top + steps.length * stepH
  arrowDown(ctx, qX + qW / 2, top + (steps.length - 1) * stepH + bh + 2, lastY - 2, RULE)
  box(ctx, qX, lastY, qW, bh, 'prompting is enough', SOFT, 0.85)

  // self-hosting: a separate branch, gated on infrastructure thresholds
  const divX = ox + leftW + 14
  ctx.strokeStyle = RULE
  ctx.setLineDash([2, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(divX, top - 6)
  ctx.lineTo(divX, bottom + bh)
  ctx.stroke()
  ctx.setLineDash([])

  const shX = divX + 14
  const shW = Math.max(80, ox + W - shX - 4)
  box(ctx, shX, top, shW, bh, 'self-host?', RUST, 0.9)

  const gates = ['throughput', 'latency floor', 'residency']
  gates.forEach((g, i) => {
    const gy = top + bh + 16 + i * 18
    ctx.fillStyle = SOFT
    ctx.font = `8.5px ${MONO}`
    ctx.textAlign = 'left'
    ctx.fillText(`· ${g}`, shX + 4, gy)
  })

  const gateBottom = top + bh + 16 + gates.length * 18
  arrowDown(ctx, shX + shW / 2, gateBottom, gateBottom + 20, RUST)
  box(ctx, shX, gateBottom + 22, shW, bh, 'self-hosted deploy', RUST, 0.85)

  caption(ctx, 'gated on capability first, then on infrastructure thresholds', ox + W / 2, h - 6)
}

/**
 * The fifteen interview questions, rolled up by which section anchors them.
 * System Design and Agents each anchor several; Fundamentals answers none of
 * them directly while underlying every row above it.
 */
const rapidFireQuestionMap: AtlasAnim = (ctx, w, h, t) => {
  const W = Math.min(w, 600)
  const ox = (w - W) / 2
  const leftLabelW = Math.min(120, W * 0.32)
  const barX = ox + leftLabelW + 6
  const barAreaW = W - leftLabelW - 6 - 26
  const maxCount = 3

  const rows: { label: string; count: number }[] = [
    { label: 'System Design', count: 3 },
    { label: 'Agents', count: 3 },
    { label: 'RAG', count: 2 },
    { label: 'Model Choice', count: 2 },
    { label: 'Embed & Search', count: 1 },
    { label: 'Vector DBs', count: 1 },
    { label: 'MCP', count: 1 },
    { label: 'Production', count: 1 },
    { label: 'Multimodal', count: 1 },
  ]

  const topY = h * 0.06
  const rowH = Math.min(20, (h * 0.68) / rows.length)
  const active = Math.floor(t * 0.4) % rows.length

  rows.forEach((r, i) => {
    const y = topY + i * rowH
    const on = i === active
    label(ctx, r.label, ox, y + rowH * 0.68, SOFT, 9.5)
    const barW = barAreaW * (r.count / maxCount)
    seg(ctx, barX, y + 3, barW, rowH - 6, r.count === 3 ? AMBER : PATINA, on ? 0.95 : 0.75)
    ctx.fillStyle = SOFT
    ctx.font = `9px ${MONO}`
    ctx.textAlign = 'left'
    ctx.fillText(String(r.count), barX + barW + 6, y + rowH * 0.68)
  })

  const foundY = topY + rows.length * rowH + 10
  const foundH = Math.min(26, h * 0.12)
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = RUST
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.2
  rr(ctx, ox, foundY, W, foundH, 6)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  ctx.fillStyle = SOFT
  ctx.font = `9px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    'Fundamentals — underlies all, asked about directly in none',
    ox + W / 2,
    foundY + foundH / 2
  )
  ctx.textBaseline = 'alphabetic'

  ;[0, 1].forEach((idx) => {
    const rx = idx === 0 ? barX + barAreaW * 0.2 : barX + barAreaW * 0.8
    dashed(ctx, rx, foundY, rx, topY + rows.length * rowH, RULE)
  })

  caption(ctx, 'bar length = questions of 15 the section directly answers', ox + W / 2, h - 6)
}

/* ── Registry ───────────────────────────────────────────────────────────── */

export const FIGURES_10_11: Record<string, AtlasAnim> = {
  'framing-question-tree': framingQuestionTree,
  'system-design-reference-architecture': systemDesignReferenceArchitecture,
  'latency-budget-allocation': latencyBudgetAllocation,
  'scaling-breakpoints': scalingBreakpoints,
  'conflicting-constraints-triangle': conflictingConstraintsTriangle,
  'rapid-fire-dependency-map': rapidFireDependencyMap,
  'rapid-fire-decision-tree': rapidFireDecisionTree,
  'rapid-fire-question-map': rapidFireQuestionMap,
}
