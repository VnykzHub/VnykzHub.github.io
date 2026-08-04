/**
 * Shared drawing kit for AI Engineering Atlas figures.
 *
 * Every figure module imports from here rather than redefining colours or
 * primitives. That is what keeps 28 hand-drawn diagrams looking like one set
 * rather than twenty-eight separate ones.
 *
 * Figures render on --panel, which is warm-dark in BOTH themes (an instrument
 * panel on paper), so this palette is fixed and needs no runtime theming.
 *
 * Figure signature: (ctx, w, h, t). ctx is DPR-normalised and pre-scaled, w/h
 * are CSS pixels, t is seconds since the figure scrolled into view. AtlasFigure
 * paints a single frame at t=0 under prefers-reduced-motion, so EVERY figure
 * must read correctly as a still frame at t=0 — never hide the subject behind
 * an entrance animation.
 */

export const AMBER = '#F0B84C'
export const PATINA = '#4A9E93'
export const RUST = '#C4703F'
export const BRASS = '#E8C77A'
export const CORAL = '#E0705C'
export const INK = '#D9D3CC'
export const HEAD = '#E8E2D9'
export const SOFT = '#9D968E'
export const FAINT = '#3A342E'
export const RULE = '#2A2622'
export const PANEL = '#1A1714'
export const PANEL2 = '#24211D'
export const PAPER = '#100E0C'

export const MONO = "'IBM Plex Mono', monospace"
export const SANS = "'Space Grotesk', system-ui, sans-serif"

/** Rounded rectangle path. Does not fill or stroke. */
export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Filled and stroked box with a centred label. The workhorse. */
export function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
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
  ctx.fillText(text, x + w / 2, y + h / 2)
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 1
}

/** Horizontal arrow, left to right. */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  colour: string
) {
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

/** Vertical arrow, top to bottom. */
export function arrowDown(
  ctx: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  colour: string
) {
  ctx.strokeStyle = colour
  ctx.fillStyle = colour
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x, y2 - 5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y2)
  ctx.lineTo(x - 3.5, y2 - 6)
  ctx.lineTo(x + 3.5, y2 - 6)
  ctx.fill()
}

/** Small centred caption, for the one-line takeaway under a figure. */
export function caption(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  colour: string = SOFT
) {
  ctx.fillStyle = colour
  ctx.font = `9.5px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/** Left-aligned mono label, for axis names and row headers. */
export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  colour: string = SOFT,
  size = 10
) {
  ctx.fillStyle = colour
  ctx.font = `${size}px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
}

/** Dashed connector between two points. */
export function dashed(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colour: string = RULE
) {
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
}

/** Horizontal allocation-bar segment. */
export function seg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colour: string,
  alpha = 0.85
) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  rr(ctx, x, y, Math.max(w, 0), h, 3)
  ctx.fill()
  ctx.globalAlpha = 1
}

/** Eased 0..1 ramp, for figures that build in over the first second or two. */
export const ramp = (t: number, seconds = 1.2): number => Math.min(Math.max(t / seconds, 0), 1)
