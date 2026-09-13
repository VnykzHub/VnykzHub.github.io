import { describe, it, expect } from 'vitest'
import { rngFrom } from '@/lib/games/shared/rng'
import { createSimState, stepSimulation, type SimState } from './simulation'
import { PREDATOR_MAX_SPEED, PREY_MAX_SPEED, TENSION_RAMP_MAX_BONUS } from './config'

function run(seed: string, steps: number): SimState {
  let state = createSimState(seed)
  const rng = rngFrom(seed, 'apiary-apex')
  for (let i = 0; i < steps; i++) state = stepSimulation(state, rng)
  return state
}

describe('apiary apex simulation', () => {
  it('is deterministic for a given seed', () => {
    const a = run('honeycomb', 300)
    const b = run('honeycomb', 300)
    expect(a).toEqual(b)
  })

  it('produces different trajectories across seeds', () => {
    const a = run('seed-a', 300)
    const b = run('seed-b', 300)
    expect(a.prey.pos).not.toEqual(b.prey.pos)
  })

  it('stays numerically stable over a long run', () => {
    const state = run('stability', 5000)
    // Predators get a tension-ramp speed bonus the longer a chase runs, so
    // their true cap is above the base config constant — bound against that,
    // not the base speed, or this flakes once a run survives long enough.
    const predatorCap = PREDATOR_MAX_SPEED * (1 + TENSION_RAMP_MAX_BONUS) + 0.05
    for (const agent of state.predators) {
      expect(Number.isFinite(agent.pos.x)).toBe(true)
      expect(Number.isFinite(agent.pos.z)).toBe(true)
      expect(Math.hypot(agent.vel.x, agent.vel.z)).toBeLessThanOrEqual(predatorCap)
    }
    expect(Number.isFinite(state.prey.pos.x)).toBe(true)
    expect(Number.isFinite(state.prey.pos.z)).toBe(true)
    expect(Math.hypot(state.prey.vel.x, state.prey.vel.z)).toBeLessThanOrEqual(PREY_MAX_SPEED + 0.05)
  })

  it('gives a fresh respawn a brief window where it cannot be immediately re-caught', () => {
    let state = createSimState('immunity-check')
    const rng = rngFrom('immunity-check', 'apiary-apex')
    let sawCapture = false
    for (let i = 0; i < 6000; i++) {
      const prevCaptures = state.captures
      state = stepSimulation(state, rng)
      if (state.captures > prevCaptures) {
        sawCapture = true
        expect(state.immuneUntil).toBeGreaterThan(state.t)
        // The very next step must not immediately re-trigger a capture even
        // if a hunter is already close to the respawn point.
        const again = stepSimulation(state, rng)
        expect(again.captures).toBe(state.captures)
      }
    }
    expect(sawCapture).toBe(true)
  })

  it('records captures and resets survival time on a long run', () => {
    const state = run('captures', 6000)
    expect(state.captures).toBeGreaterThan(0)
    expect(state.bestSurvival).toBeGreaterThan(0)
  })

  it('tracks close calls without a capture inflating the count every frame', () => {
    const state = run('close-calls', 6000)
    // Close calls are edge-triggered (entering range), so there should be far
    // fewer of them than simulation steps even though many frames are "close".
    expect(state.closeCalls).toBeGreaterThan(0)
    expect(state.closeCalls).toBeLessThan(6000)
  })
})
