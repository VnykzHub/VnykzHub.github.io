import type { AtlasAnim } from '../../llm-atlas/types'
import { AMBER, PATINA, RUST, BRASS, CORAL, SOFT, RULE, box, arrow, arrowDown, caption, rr, label, MONO, SANS } from './_shared'

/**
 * Figures for sections 07 (Production), 08 (Model Landscape) and 09
 * (Multimodal). See ../figures/_shared.ts for the palette and primitives,
 * and ../anims.ts for the style bar these match.
 */

/* ── 07 Production ──────────────────────────────────────────────────────── */

/**
 * Three cache layers nested like gates a request passes through — exact-match
 * outermost, semantic inside it, prefix caching drawn as a separate band
 * underneath because it operates at the provider level regardless of what
 * happens above. A pulse traces the miss-miss-generate path; the boxes and
 * labels are the content and read correctly with the pulse anywhere.
 */
const cacheLayers: AtlasAnim = (ctx, w, h, t) => {
  const pad = 20
  const s = Math.min(1, h / 340)

  const outerX = pad
  const outerW = w - pad * 2
  const outerY = 28 * s + 10
  const outerH = Math.min(150, h * 0.42) * s + 60

  box(ctx, outerX, outerY, outerW, outerH, '', PATINA, 0.45)
  label(ctx, '1 · exact-match', outerX + 10, outerY + 16, PATINA, 10)
  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText('fails: any prompt diff invalidates it', outerX + outerW - 10, outerY + 16)

  const mInset = Math.min(24, outerW * 0.08)
  const midX = outerX + mInset
  const midY = outerY + 30
  const midW = outerW - mInset * 2
  const midH = outerH - 30 - 14

  box(ctx, midX, midY, midW, midH, '', AMBER, 0.45)
  label(ctx, '2 · semantic', midX + 10, midY + 16, AMBER, 10)
  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText('fails: confident wrong-question answer', midX + midW - 10, midY + 16)

  const coreW = Math.min(110, midW * 0.55)
  const coreH = 26
  const coreX = midX + (midW - coreW) / 2
  const coreY = midY + midH - coreH - 12
  box(ctx, coreX, coreY, coreW, coreH, 'generate', RUST)

  // entry arrow, threading down through both gates to the core
  const topY = outerY - 16
  ctx.strokeStyle = SOFT
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.moveTo(w / 2, topY)
  ctx.lineTo(w / 2, coreY - 6)
  ctx.stroke()
  ctx.fillStyle = SOFT
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('query', w / 2, topY - 6)

  // miss marks where the query fails each gate
  ctx.strokeStyle = RUST
  ctx.lineWidth = 1.3
  ;[outerY + 6, midY + 6].forEach((my) => {
    ctx.beginPath()
    ctx.moveTo(w / 2 - 4, my - 4)
    ctx.lineTo(w / 2 + 4, my + 4)
    ctx.moveTo(w / 2 + 4, my - 4)
    ctx.lineTo(w / 2 - 4, my + 4)
    ctx.stroke()
  })

  // travelling pulse — highlight only, never the content
  const cyc = 2.6
  const p = (t % cyc) / cyc
  const py = topY + p * (coreY - 6 - topY)
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(w / 2, py, 3, 0, Math.PI * 2)
  ctx.fill()

  // prefix caching — a separate layer, underneath both, at the provider level
  const bandY = outerY + outerH + 18
  const bandH = 38
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = BRASS
  ctx.lineWidth = 1.3
  rr(ctx, outerX, bandY, outerW, bandH, 6)
  ctx.stroke()
  ctx.setLineDash([])
  label(ctx, '3 · prefix caching — provider-side, underneath both', outerX + 10, bandY + 15, BRASS, 9.5)
  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('fails: edit before the cached boundary invalidates it', outerX + 10, bandY + 28)

  caption(ctx, 'exact and semantic can miss; prefix caching still trims the call underneath', w / 2, bandY + bandH + 22)
}

/**
 * One request as a tree: query fans out into retrieved chunks and a tool
 * call, those converge into the assembled prompt, which feeds the model
 * call and its streamed output. Every node carries its own latency and
 * token count — the unit an engineer opens to investigate one bad answer.
 */
const traceAnatomy: AtlasAnim = (ctx, w, h, t) => {
  const s = Math.min(1, h / 380)
  const cx = w / 2

  const rootW = Math.min(90, w * 0.28)
  const rootH = 22
  const rootY = 12
  const rootX = cx - rootW / 2
  box(ctx, rootX, rootY, rootW, rootH, 'query', SOFT)
  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('22 tok', cx, rootY + rootH + 12)

  const leaves = [
    { label: 'chunk A', note: '0.91 · 310t · 38ms', c: PATINA },
    { label: 'chunk B', note: '0.87 · 290t · 38ms', c: PATINA },
    { label: 'tool call', note: 'lookup() · 210ms', c: BRASS },
  ]
  const leafGap = 12
  const leafW = Math.min(96, (w - 40 - (leaves.length - 1) * leafGap) / leaves.length)
  const leafH = 22
  const leafY = rootY + rootH + 58 * s + 10
  const totalLeavesW = leaves.length * leafW + (leaves.length - 1) * leafGap
  const leavesStartX = cx - totalLeavesW / 2

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.2
  leaves.forEach((lf, i) => {
    const lx = leavesStartX + i * (leafW + leafGap)
    ctx.beginPath()
    ctx.moveTo(cx, rootY + rootH + 4)
    ctx.lineTo(lx + leafW / 2, leafY - 4)
    ctx.stroke()
    box(ctx, lx, leafY, leafW, leafH, lf.label, lf.c)
    ctx.fillStyle = SOFT
    ctx.font = `10px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText(lf.note, lx + leafW / 2, leafY + leafH + 11)
  })

  const mergeW = Math.min(120, w * 0.4)
  const mergeH = 22
  const mergeY = leafY + leafH + 50 * s + 12
  const mergeX = cx - mergeW / 2
  ctx.strokeStyle = RULE
  leaves.forEach((_, i) => {
    const lx = leavesStartX + i * (leafW + leafGap)
    ctx.beginPath()
    ctx.moveTo(lx + leafW / 2, leafY + leafH + 4)
    ctx.lineTo(cx, mergeY - 4)
    ctx.stroke()
  })
  box(ctx, mergeX, mergeY, mergeW, mergeH, 'prompt assembled', SOFT)
  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('1,240 tok in · 4ms', cx, mergeY + mergeH + 12)

  const modelW = Math.min(130, w * 0.42)
  const modelH = 24
  const modelY = mergeY + mergeH + 42 * s + 10
  arrowDown(ctx, cx, mergeY + mergeH + 4, modelY - 4, RULE)
  box(ctx, cx - modelW / 2, modelY, modelW, modelH, 'model call', AMBER)
  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('640ms · 180 tok out', cx, modelY + modelH + 12)

  const outW = Math.min(120, w * 0.36)
  const outH = 22
  const outY = modelY + modelH + 42 * s + 10
  arrowDown(ctx, cx, modelY + modelH + 4, outY - 4, RULE)
  box(ctx, cx - outW / 2, outY, outW, outH, 'output', CORAL)
  ctx.fillStyle = SOFT
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('streamed · 80ms', cx, outY + outH + 12)

  // a highlight travelling the root→output spine, never the tree itself
  const cyc = 3
  const pr = (t % cyc) / cyc
  const spineTop = rootY + rootH / 2
  const spineBottom = outY + outH / 2
  ctx.fillStyle = AMBER
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.arc(cx + Math.min(60, w * 0.3), spineTop + pr * (spineBottom - spineTop), 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  caption(ctx, 'one request, every node timed and counted', cx, outY + outH + 28)
}

/* ── 08 Model Landscape ────────────────────────────────────────────────── */

/**
 * A decision tree whose gates are the axes that actually decide API vs.
 * self-hosted. Each axis feeds an OR into "self-hosted"; the default path,
 * taken when none is unambiguous, goes to "API" — matching the prose's
 * claim that API is the honest default and self-hosting must be earned.
 */
const apiVsSelfHostedDecision: AtlasAnim = (ctx, w, h) => {
  const pad = 20
  const bw = Math.min(150, w * 0.4)
  const bh = 24
  const gap = 14
  const top = Math.max(24, h * 0.12)

  const axes = [
    { label: 'data residency', note: 'must stay on-prem' },
    { label: 'latency floor', note: 'network hop too slow' },
    { label: 'rate limits', note: "contract can't scale" },
    { label: "who's paged at 3am", note: 'team already on call' },
  ]

  const busX = pad + bw + 46
  axes.forEach((a, i) => {
    const y = top + i * (bh + gap)
    box(ctx, pad, y, bw, bh, a.label, SOFT)
    ctx.fillStyle = SOFT
    ctx.font = `10px ${SANS}`
    ctx.textAlign = 'left'
    ctx.fillText(a.note, pad + bw + 8, y + bh / 2 - 8)
    ctx.strokeStyle = RULE
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(pad + bw + 8, y + bh / 2 + 4)
    ctx.lineTo(busX, y + bh / 2 + 4)
    ctx.stroke()
  })

  const busTop = top + bh / 2 + 4
  const busBottom = top + (axes.length - 1) * (bh + gap) + bh / 2 + 4
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(busX, busTop)
  ctx.lineTo(busX, busBottom)
  ctx.stroke()

  const leafW = Math.min(130, w - busX - 30)
  const leafH = 30
  const leafX = Math.min(busX + 24, w - pad - leafW)

  const selfY = (busTop + busBottom) / 2 - leafH / 2
  arrow(ctx, busX, (busTop + busBottom) / 2, leafX - 4, RUST)
  box(ctx, leafX, selfY, leafW, leafH, 'self-hosted', RUST)
  ctx.fillStyle = SOFT
  ctx.font = `10px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('any one, unambiguous', leafX + leafW / 2, selfY - 8)

  const apiY = busBottom + gap + 20
  const apiX = leafX
  ctx.strokeStyle = PATINA
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.moveTo(pad + bw / 2, top + axes.length * (bh + gap) - gap + 6)
  ctx.lineTo(pad + bw / 2, apiY + leafH / 2)
  ctx.lineTo(apiX - 4, apiY + leafH / 2)
  ctx.stroke()
  ctx.setLineDash([])
  box(ctx, apiX, apiY, leafW, leafH, 'API', PATINA)
  ctx.fillStyle = SOFT
  ctx.font = `10px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('default — none unambiguous', apiX + leafW / 2, apiY + leafH + 14)

  caption(ctx, 'the honest default is API; self-hosting has to be earned', w / 2, apiY + leafH + 30)
}

/**
 * A spectrum bar from permissive through source-available-with-restrictions
 * to research-only, each band marked with what it actually permits — the
 * point being that "open" spans a wide range and the middle band is where
 * teams get burned assuming permissive terms.
 */
const openWeightsLicenceSpectrum: AtlasAnim = (ctx, w, h) => {
  const pad = 20
  const gap = 10
  const bw = (w - pad * 2 - gap * 2) / 3
  const bh = 32
  const y = h * 0.34

  const bands = [
    {
      label: 'permissive',
      c: PATINA,
      lines: ['commercial ok', 'modify freely', 'no share-back'],
    },
    {
      label: 'source-available',
      c: BRASS,
      lines: ['commercial: capped', 'no competing use'],
    },
    {
      label: 'research-only',
      c: RUST,
      lines: ['no commercial use', 'eval / research'],
    },
  ]

  ctx.strokeStyle = SOFT
  ctx.lineWidth = 1.2
  arrow(ctx, pad, y - 22, w - pad, SOFT)
  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('fewer restrictions', pad, y - 30)
  ctx.textAlign = 'right'
  ctx.fillText('more restrictions', w - pad, y - 30)

  bands.forEach((b, i) => {
    const x = pad + i * (bw + gap)
    box(ctx, x, y, bw, bh, b.label, b.c)
    ctx.fillStyle = SOFT
    ctx.font = `10px ${SANS}`
    ctx.textAlign = 'center'
    b.lines.forEach((ln, li) => {
      ctx.fillText(ln, x + bw / 2, y + bh + 16 + li * 15)
    })
  })

  caption(ctx, '"open" is a range, not a binary — read the middle band closely', w / 2, y + bh + 16 + 3 * 13 + 14)
}

/** Small helper: centred word-wrap for the short "stops being enough" notes. */
function wrapCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  words.forEach((word) => {
    const trial = line ? `${line} ${word}` : word
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = trial
    }
  })
  if (line) lines.push(line)
  const startY = cy - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((ln, i) => ctx.fillText(ln, cx, startY + i * lineHeight))
}

/**
 * Three rungs climbing from prompting to fine-tuning, each marked with what
 * it buys and what it costs, and the point at which the rung below stops
 * being enough. Fine-tuning sits highest and is drawn narrowest — the rarest
 * move, not the default second one.
 */
const promptingRagFineTuningLadder: AtlasAnim = (ctx, w, h) => {
  const pad = 20
  const s = Math.min(1, h / 360)
  const bw = Math.min(148, w * 0.36)
  const bh = 28
  const stepX = Math.min(70, w * 0.18)
  const gapY = 64 * s + 20

  const rungs = [
    {
      label: 'prompting',
      c: PATINA,
      buys: 'buys: fast iteration, zero infra',
      costs: 'costs: rebuilt context every call',
      stop: 'stops being enough when facts must come from outside the prompt',
    },
    {
      label: 'retrieval',
      c: AMBER,
      buys: 'buys: grounded, updatable knowledge',
      costs: 'costs: a pipeline to build & run',
      stop: 'stops being enough when behavior itself must change, not just knowledge',
    },
    {
      label: 'fine-tuning',
      c: RUST,
      buys: 'buys: baked-in style, format, behavior',
      costs: 'costs: a training run, re-run per update',
      stop: '',
    },
  ]

  const baseY = h - pad - bh
  const positions = rungs.map((_, i) => ({
    x: pad + i * stepX,
    y: baseY - i * gapY,
  }))

  // connectors first, so boxes sit cleanly on top
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.2
  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i]
    const b = positions[i + 1]
    ctx.beginPath()
    ctx.moveTo(a.x + bw / 2, a.y)
    ctx.lineTo(b.x + bw / 2, b.y + bh)
    ctx.stroke()
  }

  rungs.forEach((r, i) => {
    const { x, y } = positions[i]
    box(ctx, x, y, bw, bh, r.label, r.c)
    ctx.fillStyle = SOFT
    ctx.font = `10px ${SANS}`
    ctx.textAlign = 'left'
    ctx.fillText(r.buys, x + bw + 10, y + 12)
    ctx.fillText(r.costs, x + bw + 10, y + 26)
    if (r.stop) {
      ctx.fillStyle = SOFT
      ctx.font = `10px ${SANS}`
      const midX = (x + bw / 2 + positions[i + 1].x + bw / 2) / 2
      const midY = (y + positions[i + 1].y + bh) / 2
      ctx.textAlign = 'center'
      wrapCentered(ctx, r.stop, midX, midY, Math.min(220, w - 60), 9)
    }
  })

  caption(ctx, 'fine-tuning is the rarest move, not the second one', w / 2, positions[2].y - 16)
}

/* ── 09 Multimodal ─────────────────────────────────────────────────────── */

/**
 * Raw image patches becoming tokens, with the pooling step that separates
 * what the vision tower produces from what actually gets billed. Both
 * quantities are drawn at once — the gap between them is the point.
 */
const vlmTokenCost: AtlasAnim = (ctx, w, h, t) => {
  const pad = 20
  const gridN = 7
  const cell = Math.min(11, (w * 0.32) / gridN)
  const gridW = gridN * cell
  const gridX = pad
  const gridY = h * 0.22

  ctx.fillStyle = SOFT
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('image → 16×16 patches', gridX, gridY - 14)

  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      ctx.globalAlpha = 0.75
      ctx.fillStyle = PATINA
      ctx.fillRect(gridX + c * cell, gridY + r * cell, cell - 1.5, cell - 1.5)
      ctx.globalAlpha = 1
    }
  }
  ctx.fillStyle = PATINA
  ctx.font = `600 12px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('~4,096 raw', gridX, gridY + gridW + 20)

  // pooling gate in the middle
  const poolX = gridX + gridW + 26
  const poolW = Math.min(96, w * 0.24)
  const poolH = 30
  const poolY = gridY + gridW / 2 - poolH / 2
  arrow(ctx, gridX + gridW + 4, gridY + gridW / 2, poolX - 4, BRASS)
  box(ctx, poolX, poolY, poolW, poolH, 'pool / tile', BRASS)

  // billed tokens — a much smaller row, same visual language, far fewer cells
  const outN = 4
  const outCell = cell
  const outX = poolX + poolW + 26
  const outY = gridY + gridW / 2 - outCell / 2
  arrow(ctx, poolX + poolW + 4, gridY + gridW / 2, outX - 4, AMBER)
  for (let c = 0; c < outN; c++) {
    ctx.fillStyle = AMBER
    ctx.globalAlpha = 0.85
    ctx.fillRect(outX + c * outCell, outY, outCell - 1.5, outCell - 1.5)
    ctx.globalAlpha = 1
  }
  ctx.fillStyle = AMBER
  ctx.font = `600 12px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('~300 billed', outX, gridY + gridW + 20)
  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.fillText('fixed budget, resolution-independent', outX, gridY - 14)

  // the gap is the point — pulse a bracket between the two counts
  const bracketY = gridY + gridW + 34
  const bracketX1 = gridX
  const bracketX2 = outX + outN * outCell
  const pulse = 0.6 + 0.4 * Math.sin(t * 1.6)
  ctx.strokeStyle = RUST
  ctx.globalAlpha = 0.5 + 0.3 * pulse
  ctx.lineWidth = 1.3
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(bracketX1, bracketY)
  ctx.lineTo(bracketX2, bracketY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  ctx.fillStyle = RUST
  ctx.font = `600 12px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('~13× gap', (bracketX1 + bracketX2) / 2, bracketY + 18)

  caption(ctx, 'bill the pooled tokens, not the raw patch count — text page ≈ 400 tok', w / 2, bracketY + 32)
}

/* ── Registry ───────────────────────────────────────────────────────────── */

/**
 * Figures for sections 07-09, keyed by the ids declared in their markdown
 * :::figure blocks.
 */
export const FIGURES_07_09: Record<string, AtlasAnim> = {
  'cache-layers': cacheLayers,
  'trace-anatomy': traceAnatomy,
  'api-vs-self-hosted-decision': apiVsSelfHostedDecision,
  'open-weights-licence-spectrum': openWeightsLicenceSpectrum,
  'prompting-rag-fine-tuning-ladder': promptingRagFineTuningLadder,
  'vlm-token-cost': vlmTokenCost,
}
