import * as V from './vec2'
import type { Vec2 } from './vec2'
import type { Obstacle } from './terrain'
import { WHISKER_ANGLES, WHISKER_LOOKAHEAD } from './config'

/** Seek-style flee: strongest at close range, fading fast — a threat far away barely registers. */
export function fleeForce(pos: Vec2, vel: Vec2, threat: Vec2, maxSpeed: number): Vec2 {
  const away = V.sub(pos, threat)
  const dist = Math.max(V.length(away), 0.001)
  const urgency = Math.min(1, 30 / (dist * dist))
  const desired = V.scale(V.normalize(away), maxSpeed)
  return V.scale(V.sub(desired, vel), urgency)
}

/** Seek a target's predicted future position rather than where it is right now. */
export function pursueForce(
  pos: Vec2,
  vel: Vec2,
  targetPos: Vec2,
  targetVel: Vec2,
  maxSpeed: number,
  lead = 0.35,
): Vec2 {
  const predicted = V.add(targetPos, V.scale(targetVel, lead))
  const desired = V.scale(V.normalize(V.sub(predicted, pos)), maxSpeed)
  return V.sub(desired, vel)
}

/** Pushes away from nearby teammates so hunters flank instead of clustering on the same line. */
export function separationForce(pos: Vec2, others: Vec2[], radius: number): Vec2 {
  let force = V.v2(0, 0)
  for (const other of others) {
    const d = V.distance(pos, other)
    if (d > 0 && d < radius) {
      force = V.add(force, V.scale(V.normalize(V.sub(pos, other)), (radius - d) / radius))
    }
  }
  return force
}

/**
 * Whisker raycasting: cast a small fan of rays out to WHISKER_LOOKAHEAD along
 * (and around) the current heading, find the soonest obstacle any of them
 * would hit, and steer away from it. Zero when nothing is in the way.
 */
export function obstacleAvoidForce(pos: Vec2, vel: Vec2, obstacles: Obstacle[], maxForce: number, agentRadius = 0.6): Vec2 {
  const speed = V.length(vel)
  const heading = speed > 0.1 ? V.normalize(vel) : V.v2(1, 0)
  let best: { t: number; away: Vec2 } | null = null

  for (const angleOffset of WHISKER_ANGLES) {
    const dir = V.rotate(heading, angleOffset)
    for (const obs of obstacles) {
      const toObs = V.sub(obs, pos)
      const t = dir.x * toObs.x + dir.z * toObs.z
      if (t < 0 || t > WHISKER_LOOKAHEAD) continue
      const closest = V.add(pos, V.scale(dir, t))
      const d = V.distance(closest, obs)
      if (d < obs.radius + agentRadius && (!best || t < best.t)) {
        best = { t, away: V.normalize(V.sub(closest, obs)) }
      }
    }
  }

  if (!best) return V.v2(0, 0)
  const urgency = Math.max(1 - best.t / WHISKER_LOOKAHEAD, 0.15)
  return V.scale(best.away, maxForce * urgency)
}

/** One slow random-walk step for an agent's wander heading; returns the new angle and its direction. */
export function stepWander(angle: number, rng: () => number): { angle: number; dir: Vec2 } {
  const next = angle + (rng() - 0.5) * 0.6
  return { angle: next, dir: V.fromAngle(next) }
}
