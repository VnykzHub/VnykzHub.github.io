import { describe, it, expect } from 'vitest'
import { fleeForce, pursueForce, separationForce, obstacleAvoidForce } from './steering'
import * as V from './vec2'

describe('steering', () => {
  it('flee pushes away from the threat', () => {
    const f = fleeForce({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 1, z: 0 }, 5)
    expect(f.x).toBeLessThan(0)
  })

  it('flee force fades with distance', () => {
    const near = V.length(fleeForce({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 1, z: 0 }, 5))
    const far = V.length(fleeForce({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 20, z: 0 }, 5))
    expect(near).toBeGreaterThan(far)
  })

  it('pursue leads a moving target instead of chasing its current spot', () => {
    const static_ = pursueForce({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 10, z: 0 }, { x: 0, z: 0 }, 5, 0)
    const moving = pursueForce({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 10, z: 0 }, { x: 0, z: 5 }, 5, 1)
    expect(static_.z).toBeCloseTo(0, 5)
    expect(moving.z).toBeGreaterThan(0)
  })

  it('separation pushes apart within radius and ignores far agents', () => {
    const close = separationForce({ x: 0, z: 0 }, [{ x: 1, z: 0 }], 5)
    const far = separationForce({ x: 0, z: 0 }, [{ x: 100, z: 0 }], 5)
    expect(V.length(close)).toBeGreaterThan(0)
    expect(V.length(far)).toBe(0)
  })

  it('obstacle avoidance only fires when something blocks the heading', () => {
    const blocked = obstacleAvoidForce({ x: 0, z: 0 }, { x: 1, z: 0 }, [{ x: 3, z: 0, radius: 1, height: 2 }], 40)
    const clear = obstacleAvoidForce({ x: 0, z: 0 }, { x: 1, z: 0 }, [{ x: 3, z: 10, radius: 1, height: 2 }], 40)
    expect(V.length(blocked)).toBeGreaterThan(0)
    expect(V.length(clear)).toBe(0)
  })
})
