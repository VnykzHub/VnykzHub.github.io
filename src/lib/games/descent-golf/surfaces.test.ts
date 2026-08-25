import { describe, it, expect } from 'vitest'
import { LEVELS, freshOptState, stepAdam, stepMomentum, stepSGD } from './surfaces'
import { rngFrom } from '../shared/rng'

describe('analytic gradients', () => {
  it('match finite differences on every surface', () => {
    const r = rngFrom('1729', 'descent-test')
    const eps = 1e-6
    for (const L of LEVELS) {
      for (let k = 0; k < 5; k++) {
        const x = L.dom[0] + r() * (L.dom[1] - L.dom[0])
        const y = L.dom[2] + r() * (L.dom[3] - L.dom[2])
        const [gx, gy] = L.g(x, y)
        const fdx = (L.f(x + eps, y) - L.f(x - eps, y)) / (2 * eps)
        const fdy = (L.f(x, y + eps) - L.f(x, y - eps)) / (2 * eps)
        expect(Math.abs(gx - fdx)).toBeLessThan(1e-3)
        expect(Math.abs(gy - fdy)).toBeLessThan(1e-3)
      }
    }
  })
})

describe('SGD', () => {
  it('steps against the gradient', () => {
    const s = freshOptState(1, 1)
    const next = stepSGD(s, 0.1, 2, -4)
    expect(next.x).toBeCloseTo(1 - 0.1 * 2, 12)
    expect(next.y).toBeCloseTo(1 - 0.1 * -4, 12)
  })
  it('stays finite on the ravine at lr 0.05 for 100 steps', () => {
    const L = LEVELS[0]
    let s = freshOptState(L.start[0], L.start[1])
    for (let i = 0; i < 100; i++) {
      const [gx, gy] = L.g(s.x, s.y)
      s = stepSGD(s, 0.05, gx, gy)
      expect(Math.abs(s.x)).toBeLessThan(1e4)
      expect(Math.abs(s.y)).toBeLessThan(1e4)
    }
  })
})

describe('momentum', () => {
  it('accumulates velocity as v ← 0.9v + g', () => {
    let s = freshOptState(0, 0)
    s = stepMomentum(s, 0.1, 1, 0)
    expect(s.vx).toBeCloseTo(1, 12)
    s = stepMomentum(s, 0.1, 1, 0)
    expect(s.vx).toBeCloseTo(0.9 * 1 + 1, 12)
  })
})

describe('adam', () => {
  it('bias-corrects and moves toward the minimum of the ravine', () => {
    const L = LEVELS[0]
    let s = freshOptState(-1.9, 0.9)
    for (let i = 0; i < 2; i++) {
      const [gx, gy] = L.g(s.x, s.y)
      s = stepAdam(s, 0.01, gx, gy)
    }
    expect(s.t).toBe(2)
    // Ravine gradient in x is negative (x<0), so a correct step increases x.
    expect(s.x).toBeGreaterThan(-1.9)
  })
})
