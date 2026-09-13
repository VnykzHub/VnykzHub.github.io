import { describe, it, expect } from 'vitest'
import { fleeForce, pursueForce, separationForce, obstacleAvoidForce, resolveObstacleCollisions } from './steering'
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
    const blocked = obstacleAvoidForce({ x: 0, z: 0 }, { x: 1, z: 0 }, [{ x: 3, z: 0, radius: 1 }], 40)
    const clear = obstacleAvoidForce({ x: 0, z: 0 }, { x: 1, z: 0 }, [{ x: 3, z: 10, radius: 1 }], 40)
    expect(V.length(blocked)).toBeGreaterThan(0)
    expect(V.length(clear)).toBe(0)
  })

  it('resolveObstacleCollisions pushes a penetrating agent back to the surface', () => {
    const obstacles = [{ x: 0, z: 0, radius: 2 }]
    // Agent ended up 0.5 units inside a radius-2 obstacle, moving further in.
    const { pos, vel } = resolveObstacleCollisions({ x: 1.5, z: 0 }, { x: -3, z: 0 }, obstacles, 0.5)
    expect(V.distance(pos, obstacles[0])).toBeCloseTo(2.5, 5) // radius + agentRadius
    expect(vel.x).toBeGreaterThanOrEqual(0) // the inward (-x) component is removed, not just reduced
  })

  it('resolveObstacleCollisions leaves an agent outside any obstacle untouched', () => {
    const obstacles = [{ x: 10, z: 10, radius: 2 }]
    const pos = { x: 0, z: 0 }
    const vel = { x: 3, z: 1 }
    const result = resolveObstacleCollisions(pos, vel, obstacles, 0.5)
    expect(result.pos).toEqual(pos)
    expect(result.vel).toEqual(vel)
  })

  it('resolveObstacleCollisions preserves the tangential (sliding) velocity component', () => {
    const obstacles = [{ x: 0, z: 0, radius: 2 }]
    // Penetrating straight along +x, moving along +z (tangential) and -x (inward).
    const { vel } = resolveObstacleCollisions({ x: 2.3, z: 0 }, { x: -2, z: 5 }, obstacles, 0.5)
    expect(vel.z).toBeCloseTo(5, 5)
  })
})
