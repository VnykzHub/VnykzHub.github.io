/**
 * Four analytic loss surfaces, each a specific pathology: a ravine (condition
 * number 25), a curved valley (Rosenbrock), a saddle, and a bumpy basin. Every
 * surface has an analytic gradient — no autograd, no library.
 */

export interface Surface {
  name: string
  par: number
  budget: number
  /** [x0, x1, y0, y1] viewport domain. */
  dom: [number, number, number, number]
  target: number
  f: (x: number, y: number) => number
  g: (x: number, y: number) => [number, number]
  start: [number, number]
}

export const LEVELS: Surface[] = [
  {
    name: 'Ravine · κ=25',
    par: 35,
    budget: 300,
    dom: [-2.2, 2.2, -1.2, 1.2],
    target: 0.01,
    f: (x, y) => 0.5 * (x * x + 25 * y * y),
    g: (x, y) => [x, 25 * y],
    start: [-1.9, 0.9],
  },
  {
    name: 'Rosenbrock valley',
    par: 120,
    budget: 600,
    dom: [-2, 2, -0.8, 3],
    target: 0.02,
    f: (x, y) => Math.pow(1 - x, 2) + 100 * Math.pow(y - x * x, 2),
    g: (x, y) => [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)],
    start: [-1.5, 2.2],
  },
  {
    name: 'Saddle + quartic',
    par: 45,
    budget: 400,
    dom: [-1.6, 1.6, -1.6, 1.6],
    target: -0.24,
    f: (x, y) => x * x - y * y + y * y * y * y,
    g: (x, y) => [2 * x, -2 * y + 4 * y * y * y],
    start: [-0.9, 0.03],
  },
  {
    name: 'Bumpy basin',
    par: 60,
    budget: 500,
    dom: [-2.4, 2.4, -2.4, 2.4],
    target: 0.05,
    f: (x, y) => x * x + y * y + 0.6 * Math.sin(4 * x) * Math.sin(4 * y),
    g: (x, y) => [2 * x + 2.4 * Math.cos(4 * x) * Math.sin(4 * y), 2 * y + 2.4 * Math.sin(4 * x) * Math.cos(4 * y)],
    start: [1.9, -1.7],
  },
]

/** Optimizer state: position plus per-optimizer accumulators. */
export interface OptState {
  x: number
  y: number
  vx: number
  vy: number
  mx: number
  my: number
  sx: number
  sy: number
  t: number
}

export const freshOptState = (x: number, y: number): OptState => ({
  x,
  y,
  vx: 0,
  vy: 0,
  mx: 0,
  my: 0,
  sx: 0,
  sy: 0,
  t: 0,
})

export function stepSGD(s: OptState, lr: number, gx: number, gy: number): OptState {
  return { ...s, x: s.x - lr * gx, y: s.y - lr * gy }
}

export function stepMomentum(s: OptState, lr: number, gx: number, gy: number): OptState {
  const vx = 0.9 * s.vx + gx
  const vy = 0.9 * s.vy + gy
  return { ...s, vx, vy, x: s.x - lr * vx, y: s.y - lr * vy }
}

export function stepAdam(s: OptState, lr: number, gx: number, gy: number): OptState {
  const b1 = 0.9
  const b2 = 0.999
  const e = 1e-8
  const t = s.t + 1
  const mx = b1 * s.mx + (1 - b1) * gx
  const my = b1 * s.my + (1 - b1) * gy
  const sx = b2 * s.sx + (1 - b2) * gx * gx
  const sy = b2 * s.sy + (1 - b2) * gy * gy
  const mhx = mx / (1 - Math.pow(b1, t))
  const mhy = my / (1 - Math.pow(b1, t))
  const shx = sx / (1 - Math.pow(b2, t))
  const shy = sy / (1 - Math.pow(b2, t))
  return {
    ...s,
    t,
    mx,
    my,
    sx,
    sy,
    x: s.x - (lr * mhx) / (Math.sqrt(shx) + e),
    y: s.y - (lr * mhy) / (Math.sqrt(shy) + e),
  }
}

export type OptimizerId = 'sgd' | 'mom' | 'adam'

export const stepFor = (opt: OptimizerId) => (opt === 'sgd' ? stepSGD : opt === 'mom' ? stepMomentum : stepAdam)
