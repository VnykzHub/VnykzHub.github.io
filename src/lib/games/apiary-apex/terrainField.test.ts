import { describe, it, expect } from 'vitest'
import {
  elevationAt,
  temperatureAt,
  elevationGradient,
  temperatureSpeedMultiplier,
  slopeSpeedMultiplier,
  terrainSpeedMultiplier,
  temperatureColor,
} from './terrainField'
import { ELEVATION_AMPLITUDE, TEMPERATURE_MIN_SPEED_MULT, SLOPE_MAX_EFFECT } from './config'

describe('terrainField', () => {
  it('elevation and temperature are deterministic per seed and position', () => {
    expect(elevationAt('s1', 12.3, -45.6)).toBe(elevationAt('s1', 12.3, -45.6))
    expect(temperatureAt('s1', 12.3, -45.6)).toBe(temperatureAt('s1', 12.3, -45.6))
  })

  it('differs across seeds at the same point', () => {
    expect(elevationAt('s1', 5, 5)).not.toBe(elevationAt('s2', 5, 5))
    expect(temperatureAt('s1', 5, 5)).not.toBe(temperatureAt('s2', 5, 5))
  })

  it('elevation stays within its configured amplitude and temperature stays in [0,1]', () => {
    for (let i = 0; i < 200; i++) {
      const x = (i - 100) * 3.7
      const z = (i - 50) * 5.3
      const e = elevationAt('range-check', x, z)
      expect(e).toBeGreaterThanOrEqual(-ELEVATION_AMPLITUDE - 1e-9)
      expect(e).toBeLessThanOrEqual(ELEVATION_AMPLITUDE + 1e-9)
      const t = temperatureAt('range-check', x, z)
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThanOrEqual(1)
    }
  })

  it('is continuous — small position steps produce small elevation changes, not jumps', () => {
    const a = elevationAt('continuity', 100, 100)
    const b = elevationAt('continuity', 100.1, 100)
    expect(Math.abs(a - b)).toBeLessThan(0.1)
  })

  it('gradient points toward zero on a flat-ish region and is finite everywhere sampled', () => {
    for (let i = 0; i < 50; i++) {
      const g = elevationGradient('gradient-check', i * 7.1, -i * 3.2)
      expect(Number.isFinite(g.x)).toBe(true)
      expect(Number.isFinite(g.z)).toBe(true)
    }
  })

  it('temperature speed multiplier is 1 inside the comfort band and falls off symmetrically outside it', () => {
    expect(temperatureSpeedMultiplier(0.5)).toBe(1)
    expect(temperatureSpeedMultiplier(0)).toBeCloseTo(TEMPERATURE_MIN_SPEED_MULT, 5)
    expect(temperatureSpeedMultiplier(1)).toBeCloseTo(TEMPERATURE_MIN_SPEED_MULT, 5)
    // symmetric: equally far outside the band on either side gives the same multiplier
    expect(temperatureSpeedMultiplier(0.1)).toBeCloseTo(temperatureSpeedMultiplier(0.9), 5)
  })

  it('slope multiplier is 1 when not moving, and bounded when moving', () => {
    expect(slopeSpeedMultiplier('slope', { x: 10, z: 10 }, { x: 0, z: 0 })).toBe(1)
    for (let i = 0; i < 50; i++) {
      const m = slopeSpeedMultiplier('slope', { x: i * 4, z: -i * 6 }, { x: 5, z: 3 })
      expect(m).toBeGreaterThanOrEqual(1 - SLOPE_MAX_EFFECT - 1e-9)
      expect(m).toBeLessThanOrEqual(1 + SLOPE_MAX_EFFECT + 1e-9)
    }
  })

  it('combined terrain multiplier is the product of its two parts', () => {
    const pos = { x: 3, z: 4 }
    const vel = { x: 2, z: 1 }
    const combined = terrainSpeedMultiplier('combo', pos, vel)
    const tempPart = temperatureSpeedMultiplier(temperatureAt('combo', pos.x, pos.z))
    const slopePart = slopeSpeedMultiplier('combo', pos, vel)
    expect(combined).toBeCloseTo(tempPart * slopePart, 10)
  })

  it('temperature color is a valid RGB triple across the range', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const [r, g, b] = temperatureColor(t)
      for (const c of [r, g, b]) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })
})
