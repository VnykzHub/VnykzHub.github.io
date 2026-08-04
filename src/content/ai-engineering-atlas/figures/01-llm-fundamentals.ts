import type { AtlasAnim } from '../../llm-atlas/types'
import {
  AMBER,
  PATINA,
  RUST,
  SOFT,
  RULE,
  FAINT,
  box,
  arrow,
  caption,
  rr,
  label,
  dashed,
  MONO,
  SANS,
} from './_shared'

/* ── Helpers shared within this module ─────────────────────────────────── */

/** Reshape a probability distribution by temperature: log, scale, softmax back. */
function softmaxTemp(probs: number[], temp: number): number[] {
  const logits = probs.map((p) => Math.log(p))
  const scaled = logits.map((l) => l / temp)
  const mx = Math.max(...scaled)
  const exps = scaled.map((s) => Math.exp(s - mx))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/** Small bar-chart panel. `keep` dims bars that a filter (top-k / top-p) drops. */
function drawHist(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  values: number[],
  colour: string,
  keep?: boolean[]
) {
  const n = values.length
  const bw = w / n
  const mx = Math.max(...values)
  values.forEach((v, i) => {
    const barH = (v / mx) * h
    const on = !keep || keep[i]
    ctx.globalAlpha = on ? 0.9 : 0.25
    ctx.fillStyle = on ? colour : SOFT
    ctx.fillRect(x + i * bw + 1, y + h - barH, Math.max(bw - 2, 1), barH)
  })
  ctx.globalAlpha = 1
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x + w, y + h)
  ctx.stroke()
}

/* ── 01 LLM Fundamentals ────────────────────────────────────────────────── */

/**
 * The decode loop as a chain of stages with the sampled token feeding back
 * as the next input. A pulse travels the whole loop so the "repeat" is
 * legible even though the loop itself is fully drawn at t=0.
 */
const nextTokenPredictionLoop: AtlasAnim = (ctx, w, h, t) => {
  const pad = 20
  const avail = w - pad * 2
  const gap = Math.min(16, avail * 0.05)
  const bh = Math.min(34, h * 0.16)
  const y = h * 0.32

  const fracs = [0.22, 0.27, 0.3, 0.21]
  const widths = fracs.map((f) => (avail - gap * 3) * f)
  const xs: number[] = []
  let x = pad
  widths.forEach((wd) => {
    xs.push(x)
    x += wd + gap
  })
  const [x0, x1, x2, x3] = xs
  const [w0, w1, w2, w3] = widths

  box(ctx, x0, y, w0, bh, 'context', SOFT)
  arrow(ctx, x0 + w0 + 3, y + bh / 2, x1 - 3, PATINA)

  box(ctx, x1, y, w1, bh, 'transformer', PATINA)
  arrow(ctx, x1 + w1 + 3, y + bh / 2, x2 - 3, AMBER)

  // logits: a mini distribution, one bar picked out as the sampled token
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 1.2
  rr(ctx, x2, y, w2, bh, 6)
  ctx.stroke()
  const bars = [0.3, 0.5, 0.25, 0.42, 0.85, 0.34]
  const sampledIdx = 4
  const barW = (w2 - 10) / bars.length
  bars.forEach((f, i) => {
    const bx = x2 + 5 + i * barW
    const barH = (bh - 8) * f
    ctx.fillStyle = i === sampledIdx ? AMBER : SOFT
    ctx.globalAlpha = i === sampledIdx ? 1 : 0.4
    ctx.fillRect(bx, y + bh - 4 - barH, Math.max(barW - 2, 1), barH)
  })
  ctx.globalAlpha = 1
  label(ctx, 'logits', x2, y - 6, SOFT, 9)
  ctx.fillStyle = SOFT
  ctx.font = `9px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('sample', x2 + w2 + gap / 2, y - 6)
  arrow(ctx, x2 + w2 + 3, y + bh / 2, x3 - 3, RUST)

  box(ctx, x3, y, w3, bh, 'token', RUST)

  // feedback: sampled token becomes next input
  const loopY = y + bh + 34
  const startX = x3 + w3 / 2
  const endX = x0 + w0 / 2
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.3
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(startX, y + bh + 4)
  ctx.lineTo(startX, loopY)
  ctx.lineTo(endX, loopY)
  ctx.lineTo(endX, y + bh + 10)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = RULE
  ctx.beginPath()
  ctx.moveTo(endX, y + bh + 4)
  ctx.lineTo(endX - 3.5, y + bh + 11)
  ctx.lineTo(endX + 3.5, y + bh + 11)
  ctx.fill()

  caption(ctx, 'append & repeat until stop token or length limit', w / 2, loopY + 18)

  // pulse travelling the full cycle: context -> transformer -> logits -> token -> back
  const cycle = 4.4
  const ct = t % cycle
  const segs: Array<[number, number, number, number]> = [
    [x0 + w0, y + bh / 2, x1, y + bh / 2],
    [x1 + w1, y + bh / 2, x2, y + bh / 2],
    [x2 + w2, y + bh / 2, x3, y + bh / 2],
    [startX, y + bh + 4, startX, loopY],
    [startX, loopY, endX, loopY],
    [endX, loopY, endX, y + bh + 4],
  ]
  const segDur = cycle / segs.length
  const si = Math.min(Math.floor(ct / segDur), segs.length - 1)
  const sf = (ct - si * segDur) / segDur
  const [sx1, sy1, sx2, sy2] = segs[si]
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(sx1 + (sx2 - sx1) * sf, sy1 + (sy2 - sy1) * sf, 3, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * The same base distribution reshaped by temperature (real log/scale/softmax),
 * plus the same distribution filtered by top-k vs top-p to show what each keeps.
 */
const samplingParameterEffects: AtlasAnim = (ctx, w, h) => {
  const base = [0.32, 0.22, 0.14, 0.1, 0.08, 0.06, 0.05, 0.03]
  const pad = 18
  const gap = 14

  const row1Y = Math.max(28, h * 0.16)
  const rowH = Math.min(50, h * 0.22)
  const panelW3 = Math.min(120, (w - pad * 2 - gap * 2) / 3)
  const row1W = panelW3 * 3 + gap * 2
  const row1X = (w - row1W) / 2

  const temps: Array<[number, string]> = [
    [0.5, RUST],
    [1.0, PATINA],
    [2.0, AMBER],
  ]
  temps.forEach(([temp, c], i) => {
    const tx = row1X + i * (panelW3 + gap)
    label(ctx, `T = ${temp.toFixed(1)}`, tx, row1Y - 6, SOFT, 9.5)
    drawHist(ctx, tx, row1Y, panelW3, rowH, softmaxTemp(base, temp), c)
  })
  const cap1Y = row1Y + rowH + 16
  caption(ctx, 'temperature reshapes the same distribution', w / 2, cap1Y)

  const row2Y = cap1Y + Math.max(20, h * 0.1)
  const panelW2 = Math.min(160, (w - pad * 2 - gap) / 2)
  const row2W = panelW2 * 2 + gap
  const row2X = (w - row2W) / 2

  const kKeep = base.map((_, i) => i < 5)
  label(ctx, 'top-k, k = 5', row2X, row2Y - 6, SOFT, 9.5)
  drawHist(ctx, row2X, row2Y, panelW2, rowH, base, PATINA, kKeep)

  let cum = 0
  const pKeep = base.map((v) => {
    const prior = cum
    cum += v
    return prior < 0.9
  })
  const x2 = row2X + panelW2 + gap
  label(ctx, 'top-p, p = 0.9', x2, row2Y - 6, SOFT, 9.5)
  drawHist(ctx, x2, row2Y, panelW2, rowH, base, AMBER, pKeep)

  caption(ctx, 'top-k keeps a fixed count; top-p keeps a probability mass', w / 2, row2Y + rowH + 16)
}

/**
 * Legal-token mask -> sample -> validate, with the invalid path drawn as a
 * dashed repair loop straight back into the model rather than a dead end.
 */
const constrainedDecodingFlow: AtlasAnim = (ctx, w, h, t) => {
  const pad = 18
  const avail = w - pad * 2
  const gap = Math.min(14, avail * 0.04)
  const bh = Math.min(30, h * 0.14)
  const y = h * 0.22

  const fracs = [0.18, 0.32, 0.2, 0.22]
  const widths = fracs.map((f) => (avail - gap * 3) * f)
  const xs: number[] = []
  let x = pad
  widths.forEach((wd) => {
    xs.push(x)
    x += wd + gap
  })
  const [x0, x1, x2, x3] = xs
  const [w0, w1, w2, w3] = widths

  box(ctx, x0, y, w0, bh, 'model', SOFT)
  arrow(ctx, x0 + w0 + 3, y + bh / 2, x1 - 3, PATINA)

  // legal-token mask: a grid of candidate tokens, illegal ones struck out
  ctx.strokeStyle = PATINA
  ctx.lineWidth = 1.2
  rr(ctx, x1, y, w1, bh, 6)
  ctx.stroke()
  const cols = 6
  const legal = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1]
  const cw = (w1 - 8) / cols
  const ch = (bh - 8) / 2
  const activeIdx = Math.floor(t * 1.5) % legal.length
  legal.forEach((on, i) => {
    const cx = x1 + 4 + (i % cols) * cw
    const cy = y + 4 + Math.floor(i / cols) * ch
    ctx.fillStyle = on ? PATINA : FAINT
    ctx.globalAlpha = on ? (i === activeIdx ? 1 : 0.55) : 0.5
    ctx.fillRect(cx, cy, cw - 2, ch - 2)
    ctx.globalAlpha = 1
    if (!on) {
      ctx.strokeStyle = RUST
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + cw - 2, cy + ch - 2)
      ctx.stroke()
    }
  })
  label(ctx, 'legal tokens', x1, y - 6, SOFT, 9)
  arrow(ctx, x1 + w1 + 3, y + bh / 2, x2 - 3, AMBER)

  box(ctx, x2, y, w2, bh, 'sample', AMBER)
  arrow(ctx, x2 + w2 + 3, y + bh / 2, x3 - 3, PATINA)

  box(ctx, x3, y, w3, bh, 'validate', PATINA)

  // valid -> output
  const outY = y + bh + 44
  const outX = x3 + w3 / 2
  box(ctx, outX - 40, outY, 80, bh * 0.8, 'output', PATINA, 0.9)
  ctx.strokeStyle = PATINA
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.moveTo(outX, y + bh)
  ctx.lineTo(outX, outY - 2)
  ctx.stroke()
  ctx.fillStyle = PATINA
  ctx.beginPath()
  ctx.moveTo(outX, outY)
  ctx.lineTo(outX - 3.5, outY - 7)
  ctx.lineTo(outX + 3.5, outY - 7)
  ctx.fill()
  ctx.font = `9px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('valid', outX + 46, outY + bh * 0.4 + 3)

  // invalid -> dashed repair loop back into the model
  const loopY = outY + bh * 0.8 + 22
  const modelX = x0 + w0 / 2
  ctx.strokeStyle = RUST
  ctx.lineWidth = 1.2
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(outX, outY + bh * 0.8)
  ctx.lineTo(outX, loopY)
  ctx.lineTo(modelX, loopY)
  ctx.lineTo(modelX, y + bh + 6)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = RUST
  ctx.beginPath()
  ctx.moveTo(modelX, y + bh + 2)
  ctx.lineTo(modelX - 3.5, y + bh + 9)
  ctx.lineTo(modelX + 3.5, y + bh + 9)
  ctx.fill()
  ctx.font = `9px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('invalid — "please fix this:"', (outX + modelX) / 2, loopY - 6)

  caption(ctx, 'the mask enforces syntax; validation and repair enforce meaning', w / 2, loopY + 20)
}

/**
 * The Lost-in-the-Middle curve: recall high near both edges of the context,
 * weakest mid-context, and slightly lower at the end than the start.
 */
const contextWindowDegradation: AtlasAnim = (ctx, w, h, t) => {
  const padL = 34
  const padR = 18
  const padT = 22
  const padB = 40
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const x0 = padL
  const y0 = padT
  const yBase = y0 + plotH

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x0, yBase)
  ctx.lineTo(x0 + plotW, yBase)
  ctx.stroke()

  // shade the weak middle band
  ctx.fillStyle = RUST
  ctx.globalAlpha = 0.1
  ctx.fillRect(x0 + plotW * 0.32, y0, plotW * 0.36, plotH)
  ctx.globalAlpha = 1

  const acc = (frac: number) => {
    const gauss = Math.exp(-((frac - 0.5) ** 2) / (2 * 0.18 ** 2))
    return 0.88 - 0.52 * gauss - 0.08 * frac
  }

  const n = 60
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const frac = i / n
    const px = x0 + plotW * frac
    const py = yBase - plotH * acc(frac)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // a marker sweeps the curve so the shape reads as "position in context"
  const frac = (Math.sin(t * 0.6) + 1) / 2
  const mx = x0 + plotW * frac
  const my = yBase - plotH * acc(frac)
  ctx.strokeStyle = RULE
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(mx, yBase)
  ctx.lineTo(mx, my)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(mx, my, 3.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = SOFT
  ctx.font = `9px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('start', x0, yBase + 14)
  ctx.textAlign = 'center'
  ctx.fillText('middle', x0 + plotW / 2, yBase + 14)
  ctx.textAlign = 'right'
  ctx.fillText('end', x0 + plotW, yBase + 14)

  label(ctx, 'recall', x0 - 4, y0 - 8, SOFT, 9)
  caption(ctx, 'recall dips well before the window limit, weakest mid-context', w / 2, h - 8)
}

/**
 * Four distinct causes drawn as separate panels, each with a dashed spoke
 * into a shared "hallucination" hub — one symptom, several unrelated sources.
 */
const hallucinationSources: AtlasAnim = (ctx, w, h, t) => {
  const items = [
    { n: '1', title: 'training data', c: SOFT },
    { n: '2', title: 'plausibility bias', c: AMBER },
    { n: '3', title: 'context conflict', c: PATINA },
    { n: '4', title: 'pattern blur', c: RUST },
  ]
  const pad = 18
  const gap = 14
  const cellW = Math.min(150, (w - pad * 2 - gap) / 2)
  const cellH = Math.min(56, (h - pad * 2 - gap) / 2)
  const totalW = cellW * 2 + gap
  const totalH = cellH * 2 + gap
  const startX = (w - totalW) / 2
  const startY = (h - totalH) / 2 - 4

  const cx = w / 2
  const cy = h / 2 - 4
  const hubW = 84
  const hubH = 22

  const active = Math.floor(t * 0.8) % items.length

  items.forEach((it, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const bx = startX + col * (cellW + gap)
    const by = startY + row * (cellH + gap)

    dashed(ctx, bx + cellW / 2, by + cellH / 2, cx, cy, RULE)
    box(ctx, bx, by, cellW, cellH, it.title, it.c, i === active ? 1 : 0.75)

    ctx.fillStyle = SOFT
    ctx.font = `600 8.5px ${MONO}`
    ctx.textAlign = 'left'
    ctx.fillText(it.n, bx + 5, by + 11)
  })

  box(ctx, cx - hubW / 2, cy - hubH / 2, hubW, hubH, 'hallucination', RUST)
  caption(ctx, 'four unrelated failure paths, one symptom', w / 2, startY + totalH + 20)
}

/* ── Registry ───────────────────────────────────────────────────────────── */

export const FIGURES_01: Record<string, AtlasAnim> = {
  'next-token-prediction-loop': nextTokenPredictionLoop,
  'sampling-parameter-effects': samplingParameterEffects,
  'constrained-decoding-flow': constrainedDecodingFlow,
  'context-window-degradation': contextWindowDegradation,
  'hallucination-sources': hallucinationSources,
}
