import type { AtlasAnim } from '../llm-atlas/types'

/**
 * Canvas figures for the AI Engineering Atlas.
 *
 * Hand-written rather than agent-generated: figure code is visual, bound to the
 * palette, and cannot be verified by reading — the three properties that make it
 * the worst thing in this project to delegate. Drafting agents declare a figure
 * id and describe the intended diagram in its caption; this module answers those
 * declarations.
 *
 * Figures render on --panel, which is warm-dark in BOTH themes (an instrument
 * panel sitting on paper), so these use one fixed palette and need no runtime
 * theming.
 *
 * Signature: (ctx, w, h, t) — ctx is DPR-normalised and pre-scaled, w/h are CSS
 * pixels, t is seconds since the figure became visible. AtlasFigure gates on
 * IntersectionObserver and honours prefers-reduced-motion by painting t=0 once,
 * so every figure here must read correctly as a still frame at t=0.
 */

const AMBER = '#F0B84C'
const PATINA = '#4A9E93'
const RUST = '#C4703F'
const BRASS = '#E8C77A'
const INK = '#D9D3CC'
const SOFT = '#9D968E'
const FAINT = '#3A342E'
const RULE = '#2A2622'
const PANEL2 = '#24211D'

const MONO = "'IBM Plex Mono', monospace"
const SANS = "'Space Grotesk', system-ui, sans-serif"

/** Rounded rectangle path. */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Filled and stroked box with a centred label. */
function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  colour: string,
  alpha = 1
) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = `${colour}22`
  ctx.strokeStyle = colour
  ctx.lineWidth = 1.5
  rr(ctx, x, y, w, h, 7)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = colour
  ctx.font = `600 10.5px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + w / 2, y + h / 2)
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 1
}

/** Horizontal arrow from x1 to x2 at y. */
function arrow(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, colour: string) {
  ctx.strokeStyle = colour
  ctx.fillStyle = colour
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2 - 5, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y)
  ctx.lineTo(x2 - 6, y - 3.5)
  ctx.lineTo(x2 - 6, y + 3.5)
  ctx.fill()
}

function caption(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour = SOFT) {
  ctx.fillStyle = colour
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/* ── 04 RAG ─────────────────────────────────────────────────────────────── */

/**
 * The four stages, with the corpus updating independently of the model. The
 * active stage advances so the direction of flow is unambiguous.
 */
const ragPipelineOverview: AtlasAnim = (ctx, w, h, t) => {
  const stages = [
    { label: 'Ingest', c: SOFT },
    { label: 'Index', c: PATINA },
    { label: 'Retrieve', c: PATINA },
    { label: 'Generate', c: AMBER },
  ]
  const bw = Math.min(96, (w - 40 - 3 * 18) / 4)
  const bh = 40
  const gap = (w - 40 - bw * 4) / 3
  const y = h / 2 - bh / 2
  const active = Math.floor(t * 0.9) % 4

  stages.forEach((s, i) => {
    const x = 20 + i * (bw + gap)
    box(ctx, x, y, bw, bh, s.label, s.c, i === active ? 1 : 0.45)
    if (i < 3) arrow(ctx, x + bw + 4, y + bh / 2, x + bw + gap - 4, i === active ? AMBER : FAINT)
  })

  // The corpus feeds ingest and is updated out of band — the whole point.
  ctx.strokeStyle = RULE
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20 + bw / 2, y - 10)
  ctx.lineTo(20 + bw / 2, y - 24)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = SOFT
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('corpus — updated without retraining', 20 + bw / 2 + 8, y - 22)

  caption(ctx, 'retrieved chunks enter the prompt, not the weights', w / 2, y + bh + 26)
}

/**
 * The same sentence split two ways, with a value severed from its term under
 * the naive boundary.
 */
const chunkingBoundaryLoss: AtlasAnim = (ctx, w, h) => {
  const rows = [
    { title: 'Fixed-size', broken: true, c: RUST },
    { title: 'Document-aware', broken: false, c: PATINA },
  ]
  const pad = 20
  const rowH = 46
  const top = h / 2 - rowH - 12

  rows.forEach((row, ri) => {
    const y = top + ri * (rowH + 26)
    ctx.fillStyle = SOFT
    ctx.font = `10px ${MONO}`
    ctx.textAlign = 'left'
    ctx.fillText(row.title, pad, y - 6)

    const cells = row.broken
      ? [
          { text: 'raise the', frac: 0.34 },
          { text: 'threshold to 40', frac: 0.38 },
          { text: '…', frac: 0.2 },
        ]
      : [
          { text: 'raise the threshold to 40', frac: 0.66 },
          { text: '…', frac: 0.26 },
        ]

    let x = pad
    const avail = w - pad * 2
    cells.forEach((c, i) => {
      const cw = avail * c.frac
      ctx.fillStyle = i < 2 ? `${row.c}1E` : PANEL2
      ctx.strokeStyle = i < 2 ? row.c : RULE
      ctx.lineWidth = 1.2
      rr(ctx, x, y, cw - 6, 26, 4)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = INK
      ctx.font = `10px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.text, x + (cw - 6) / 2, y + 13)
      ctx.textBaseline = 'alphabetic'
      x += cw
    })

    ctx.fillStyle = row.broken ? RUST : PATINA
    ctx.font = `9.5px ${SANS}`
    ctx.textAlign = 'left'
    ctx.fillText(
      row.broken
        ? 'term and its value land in different chunks'
        : 'the retrievable unit stays whole',
      pad,
      y + 40
    )
  })
}

/* ── 07 Production ──────────────────────────────────────────────────────── */

/** Where the time goes, and why the tail is the product. */
const latencyWaterfall: AtlasAnim = (ctx, w, h, t) => {
  const segs = [
    { label: 'embed', frac: 0.08, c: SOFT },
    { label: 'search', frac: 0.1, c: PATINA },
    { label: 'rerank', frac: 0.22, c: BRASS },
    { label: 'generate', frac: 0.6, c: AMBER },
  ]
  const pad = 24
  const barW = w - pad * 2
  const y = h / 2 - 34
  const grow = Math.min(t / 1.4, 1)

  let x = pad
  segs.forEach((s) => {
    const sw = barW * s.frac * grow
    ctx.fillStyle = s.c
    ctx.globalAlpha = 0.85
    rr(ctx, x, y, Math.max(sw - 2, 0), 22, 3)
    ctx.fill()
    ctx.globalAlpha = 1
    if (sw > 40) {
      ctx.fillStyle = '#100E0C'
      ctx.font = `600 9px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(s.label, x + sw / 2, y + 11)
      ctx.textBaseline = 'alphabetic'
    }
    x += sw
  })

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, y + 40)
  ctx.lineTo(pad + barW, y + 40)
  ctx.stroke()

  const marks = [
    { at: 0.42, label: 'p50', c: PATINA },
    { at: 0.72, label: 'p95', c: BRASS },
    { at: 0.95, label: 'p99', c: RUST },
  ]
  marks.forEach((m) => {
    const mx = pad + barW * m.at
    ctx.strokeStyle = m.c
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(mx, y + 34)
    ctx.lineTo(mx, y + 46)
    ctx.stroke()
    ctx.fillStyle = m.c
    ctx.font = `9px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText(m.label, mx, y + 58)
  })

  caption(ctx, 'the tail is what users describe as "slow"', w / 2, y + 76)
}

/** Cascading fallback with a quality-loss marker per rung. */
const fallbackChain: AtlasAnim = (ctx, w, h, t) => {
  const rungs = [
    { label: 'primary provider', c: PATINA, note: 'full quality' },
    { label: 'secondary provider', c: BRASS, note: 'slight drift' },
    { label: 'smaller model', c: AMBER, note: 'degraded' },
    { label: 'cached / refusal', c: RUST, note: 'honest, not blank' },
  ]
  const bw = Math.min(180, w - 130)
  const bh = 26
  const gap = 12
  const top = h / 2 - (rungs.length * (bh + gap)) / 2
  const failing = Math.floor(t * 0.5) % (rungs.length + 1)

  rungs.forEach((r, i) => {
    const y = top + i * (bh + gap)
    const x = 24
    const dead = i < failing
    box(ctx, x, y, bw, bh, r.label, dead ? FAINT : r.c, dead ? 0.5 : 1)
    if (dead) {
      ctx.strokeStyle = RUST
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x + 8, y + bh / 2)
      ctx.lineTo(x + bw - 8, y + bh / 2)
      ctx.stroke()
    }
    ctx.fillStyle = dead ? FAINT : SOFT
    ctx.font = `9px ${SANS}`
    ctx.textAlign = 'left'
    ctx.fillText(r.note, x + bw + 12, y + bh / 2 + 3)
    if (i < rungs.length - 1) {
      ctx.strokeStyle = dead ? RUST : RULE
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x + 14, y + bh)
      ctx.lineTo(x + 14, y + bh + gap)
      ctx.stroke()
    }
  })

  caption(ctx, 'degrade in steps; never fail blank', w / 2, top + rungs.length * (bh + gap) + 14)
}

/* ── 05 Agents ──────────────────────────────────────────────────────────── */

/** A pipeline you wrote, beside a loop the model steers. */
const agentVsPipelineControlFlow: AtlasAnim = (ctx, w, h, t) => {
  const half = w / 2
  const bh = 24
  const bw = Math.min(92, half - 48)

  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('your code decides', half / 2, 18)
  ctx.fillText('the model decides', half + half / 2, 18)

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(half, 10)
  ctx.lineTo(half, h - 10)
  ctx.stroke()

  const steps = ['step 1', 'step 2', 'step 3']
  steps.forEach((s, i) => {
    const y = 40 + i * (bh + 16)
    box(ctx, half / 2 - bw / 2, y, bw, bh, s, PATINA)
    if (i < 2) {
      ctx.strokeStyle = FAINT
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(half / 2, y + bh)
      ctx.lineTo(half / 2, y + bh + 16)
      ctx.stroke()
    }
  })

  const cx = half + half / 2
  const cy = h / 2
  const r = Math.min(44, half / 2 - 28)
  const ang = t * 1.1
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 4, 0, Math.PI * 2)
  ctx.fill()

  box(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 'choose tool', AMBER)
  caption(ctx, 'loops until it decides to stop', cx, cy + r + 18)
}

/* ── Registry ───────────────────────────────────────────────────────────── */

/**
 * Figures answered so far. An id declared in the markdown but absent here
 * renders as a labelled "Figure in progress" placeholder rather than a blank
 * box, so what is still owed stays visible on the page.
 */
export const AI_ATLAS_FIGURES: Record<string, AtlasAnim> = {
  'rag-pipeline-overview': ragPipelineOverview,
  'chunking-boundary-loss': chunkingBoundaryLoss,
  'latency-waterfall': latencyWaterfall,
  'fallback-chain': fallbackChain,
  'agent-vs-pipeline-control-flow': agentVsPipelineControlFlow,
}
