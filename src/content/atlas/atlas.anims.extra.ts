import type { AtlasAnim } from './types'

/**
 * Hand-authored animations that supplement the generated set.
 *
 * The original Atlas referenced `anim: "kvcache"` from the KV-cache subsection
 * but never defined it, so that figure rendered blank. Written here rather
 * than in atlas.anims.ts because the generator overwrites that file.
 */

const RULE = '#3A342E'
const INK = '#D9D3CC'
const FAINT = '#9D968E'
const CYAN = '#00D9FF'
const GREEN = '#10B981'
const AMBER = '#F0B84C'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/**
 * KV-cache: two passes over the same 6-token sequence.
 *
 * Top row recomputes every key/value on every step (cost grows as the square
 * of sequence length). Bottom row keeps past K/V resident and computes only
 * the newest token. The point is the shrinking amber band.
 */
const kvcache: AtlasAnim = (ctx, w, h, t) => {
  ctx.clearRect(0, 0, w, h)

  const tokens = 6
  const step = Math.floor(t * 1.1) % tokens // which token is being generated
  const cell = 46
  const gap = 7
  const totalW = tokens * (cell + gap) - gap
  const x0 = (w - totalW) / 2

  const label = (text: string, y: number, colour: string) => {
    ctx.font = "10px 'IBM Plex Mono'"
    ctx.fillStyle = colour
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, x0, y)
  }

  const row = (y: number, cached: boolean) => {
    for (let i = 0; i < tokens; i++) {
      const x = x0 + i * (cell + gap)
      const future = i > step
      const isNew = i === step
      // Without a cache every token up to `step` recomputes each step.
      const recomputing = !future && (cached ? isNew : true)

      let fill = 'rgba(255,255,255,0.03)'
      let stroke = RULE
      let ink = FAINT

      if (future) {
        ctx.setLineDash([3, 3])
      } else {
        ctx.setLineDash([])
        if (recomputing) {
          const pulse = 0.45 + 0.35 * Math.abs(Math.sin(t * 3))
          fill = `rgba(240,184,76,${pulse * 0.3})`
          stroke = AMBER
          ink = AMBER
        } else {
          fill = 'rgba(16,185,129,0.13)'
          stroke = GREEN
          ink = GREEN
        }
      }

      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = isNew ? 2 : 1.25
      roundRect(ctx, x, y, cell, 30, 6)
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = future ? RULE : ink
      ctx.font = "11px 'IBM Plex Mono'"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(future ? '·' : 'kv', x + cell / 2, y + 15)
    }
  }

  label('NO CACHE — recompute all', 22, INK)
  row(30, false)
  ctx.fillStyle = FAINT
  ctx.font = "10px 'IBM Plex Mono'"
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`${step + 1} recomputed`, x0 + totalW, 78)

  label('KV-CACHE — recompute one', 112, INK)
  row(120, true)
  ctx.fillStyle = FAINT
  ctx.textAlign = 'right'
  ctx.fillText('1 recomputed', x0 + totalW, 168)

  // Cost annotation
  ctx.textAlign = 'center'
  ctx.fillStyle = CYAN
  ctx.font = "10px 'IBM Plex Mono'"
  ctx.fillText('O(n²) total  →  O(n) total', w / 2, 195)
}

export const ATLAS_ANIMS_EXTRA: Record<string, AtlasAnim> = { kvcache }
