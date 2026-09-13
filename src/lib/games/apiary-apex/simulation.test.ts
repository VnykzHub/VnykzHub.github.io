import { describe, it, expect } from 'vitest'
import { rngFrom } from '@/lib/games/shared/rng'
import { createSimState, stepSimulation, type SimState } from './simulation'

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
    for (const agent of [...state.predators, state.prey]) {
      expect(Number.isFinite(agent.pos.x)).toBe(true)
      expect(Number.isFinite(agent.pos.z)).toBe(true)
      expect(Math.hypot(agent.vel.x, agent.vel.z)).toBeLessThanOrEqual(9)
    }
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
