import { describe, it, expect } from 'vitest'
import { rngFrom } from '@/lib/games/shared/rng'
import { createSimState, stepSimulation, clusterCenter, type SimState } from './simulation'
import { chunksAround } from './terrain'
import { PREDATOR_MAX_SPEED, PREY_MAX_SPEED, TENSION_RAMP_MAX_BONUS, RIVALRY_MAX_BOOST, SLOPE_MAX_EFFECT, AGENT_COLLISION_RADIUS } from './config'

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
    // Predators stack three multiplicative speed bonuses at once in the
    // worst case: the tension ramp, the rivalry (trailing-hunter) boost, and
    // a downhill terrain bonus. Bound against that full stack, not the base
    // speed, or this flakes the first time a run's dynamics reach it.
    const predatorCap = PREDATOR_MAX_SPEED * (1 + TENSION_RAMP_MAX_BONUS) * (1 + RIVALRY_MAX_BOOST) * (1 + SLOPE_MAX_EFFECT) + 0.05
    for (const agent of state.predators) {
      expect(Number.isFinite(agent.pos.x)).toBe(true)
      expect(Number.isFinite(agent.pos.z)).toBe(true)
      expect(Math.hypot(agent.vel.x, agent.vel.z)).toBeLessThanOrEqual(predatorCap)
    }
    // The prey has no tension/rivalry bonus, only the same downhill terrain bonus.
    const preyCap = PREY_MAX_SPEED * (1 + SLOPE_MAX_EFFECT) + 0.05
    expect(Number.isFinite(state.prey.pos.x)).toBe(true)
    expect(Number.isFinite(state.prey.pos.z)).toBe(true)
    expect(Math.hypot(state.prey.vel.x, state.prey.vel.z)).toBeLessThanOrEqual(preyCap)
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

  it('the two hunters overtake each other over a long chase', () => {
    const state = run('overtakes', 10000)
    expect(state.overtakes).toBeGreaterThan(0)
  })

  it('accumulates per-agent stats for all three agents over a run', () => {
    const state = run('agent-stats', 6000)
    for (const s of [...state.predatorStats, state.preyStats]) {
      expect(s.distanceTraveled).toBeGreaterThan(0)
      expect(s.topSpeed).toBeGreaterThan(0)
      expect(Number.isFinite(s.cumulativeReward)).toBe(true)
    }
    // At least one capture happens in 6000 steps at this pacing (per the
    // "records captures" test above with a different seed) — when it does,
    // the catching hunter's cumulative reward should reflect the bonus.
    expect(Math.max(state.predatorStats[0].cumulativeReward, state.predatorStats[1].cumulativeReward)).toBeGreaterThan(100)
  })

  it('records which hunter made the most recent catch and where', () => {
    const state = run('catcher-check', 6000)
    expect(state.captures).toBeGreaterThan(0)
    expect(state.lastCatcherIndex === 0 || state.lastCatcherIndex === 1).toBe(true)
    expect(state.lastCapturePos).not.toBeNull()
  })

  it('never lets an agent end a step inside an obstacle, over a long run', () => {
    let state = createSimState('no-clipping')
    const rng = rngFrom('no-clipping', 'apiary-apex')
    const tolerance = 1e-6
    for (let i = 0; i < 4000; i++) {
      state = stepSimulation(state, rng)
      const center = clusterCenter(state)
      const obstacles = chunksAround(state.seed, center.x, center.z).flatMap((c) => c.obstacles)
      for (const agent of [state.predators[0], state.predators[1], state.prey]) {
        for (const obs of obstacles) {
          const d = Math.hypot(agent.pos.x - obs.x, agent.pos.z - obs.z)
          expect(d).toBeGreaterThanOrEqual(obs.radius + AGENT_COLLISION_RADIUS - tolerance)
        }
      }
    }
  })
})
