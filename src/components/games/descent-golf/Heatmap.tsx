'use client'

import { useEffect, useRef } from 'react'
import type { Surface } from '@/lib/games/descent-golf/surfaces'

interface HeatmapProps {
  surface: Surface
  path: [number, number][]
  solved: boolean
  running: boolean
}

/**
 * Canvas heatmap of the loss surface with the descent path drawn over it.
 * Ported from the prototype's buildField/draw — the pixel math is correct
 * there; restyled: brass trail, patina target marker, DPR capped at 2.
 */
export function Heatmap({ surface, path, solved, running }: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth || 640
    const h = 320
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // heatmap field
    const img = ctx.createImageData(canvas.width, canvas.height)
    const [x0, x1, y0, y1] = surface.dom
    let lo = Infinity
    let hi = -Infinity
    const vals = new Float64Array(img.width * img.height)
    for (let j = 0; j < img.height; j++) {
      for (let i = 0; i < img.width; i++) {
        const x = x0 + (i / img.width) * (x1 - x0)
        const y = y1 - (j / img.height) * (y1 - y0)
        const v = Math.log1p(Math.max(0, surface.f(x, y) - surface.target + 0.001))
        vals[j * img.width + i] = v
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
    for (let k = 0; k < vals.length; k++) {
      const t = (vals[k] - lo) / Math.max(1e-9, hi - lo)
      const band = Math.sin(t * 46) * 0.06 + t
      const o = k * 4
      img.data[o] = 14 + band * 26
      img.data[o + 1] = 22 + band * 44
      img.data[o + 2] = 30 + band * 58
      img.data[o + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const X = (x: number) => ((x - x0) / (x1 - x0)) * w
    const Y = (y: number) => h - ((y - y0) / (y1 - y0)) * h

    // descent trail — brass
    ctx.strokeStyle = 'var(--accent-1)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    path.forEach(([px, py], i) => {
      const cx = X(px)
      const cy = Y(py)
      if (i === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    })
    ctx.stroke()

    // current position marker
    const [lx, ly] = path[path.length - 1]
    ctx.fillStyle = solved ? 'var(--accent-2)' : 'var(--accent-1)'
    ctx.beginPath()
    ctx.arc(X(lx), Y(ly), 4, 0, 6.284)
    ctx.fill()

    ctx.fillStyle = 'var(--ink-faint)'
    ctx.font = '10px monospace'
    ctx.fillText(`target  f ≤ ${surface.target}`, 10, 16)
    if (running) ctx.fillText('descending…', w - 92, 16)
  }, [surface, path, solved, running])

  return <canvas ref={canvasRef} style={{ width: '100%', height: 320 }} className="block rounded-sm" />
}
