import * as V from './vec2'
import type { Vec2 } from './vec2'
import * as C from './config'

export interface StepRewards {
  predator: [number, number]
  prey: number
}

/**
 * Reward = w1*Δdistance - w2*time + captureBonus for each hunter, and
 * Reward = w1*survival + w2*distanceToNearestHunter - caughtPenalty for the
 * survivor — the formulas from the project spec, computed every step
 * regardless of whether anything is currently learning from them (v1 isn't).
 * Positions are pre-respawn: on the step a capture happens, `nextPreyPos`
 * should still be where the catch occurred, not the post-respawn position.
 */
export function computeRewards(
  prevPreyPos: Vec2,
  prevPredatorPos: [Vec2, Vec2],
  nextPreyPos: Vec2,
  nextPredatorPos: [Vec2, Vec2],
  captured: boolean,
  dt: number,
): StepRewards {
  const prevD0 = V.distance(prevPreyPos, prevPredatorPos[0])
  const prevD1 = V.distance(prevPreyPos, prevPredatorPos[1])
  const nextD0 = V.distance(nextPreyPos, nextPredatorPos[0])
  const nextD1 = V.distance(nextPreyPos, nextPredatorPos[1])

  const predatorReward = (prevD: number, nextD: number): number => {
    let r = C.REWARD_PREDATOR_DISTANCE_WEIGHT * (prevD - nextD)
    r -= C.REWARD_PREDATOR_TIME_PENALTY * dt
    if (captured) r += C.REWARD_PREDATOR_CAPTURE_BONUS
    return r
  }

  const nearest = Math.min(nextD0, nextD1)
  let preyReward = C.REWARD_PREY_SURVIVAL_WEIGHT * dt + C.REWARD_PREY_DISTANCE_WEIGHT * nearest
  if (captured) preyReward -= C.REWARD_PREY_CAUGHT_PENALTY

  return { predator: [predatorReward(prevD0, nextD0), predatorReward(prevD1, nextD1)], prey: preyReward }
}
