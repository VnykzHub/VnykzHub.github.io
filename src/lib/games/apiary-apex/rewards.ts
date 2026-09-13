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
 *
 * `catchers` says which hunter(s) actually made contact this step — only
 * those get the capture bonus, not both automatically, so the reward
 * signal stays honest about which one did the catching. The prey's caught
 * penalty applies whenever either did.
 */
export function computeRewards(
  prevPreyPos: Vec2,
  prevPredatorPos: [Vec2, Vec2],
  nextPreyPos: Vec2,
  nextPredatorPos: [Vec2, Vec2],
  catchers: [boolean, boolean],
  dt: number,
): StepRewards {
  const prevD0 = V.distance(prevPreyPos, prevPredatorPos[0])
  const prevD1 = V.distance(prevPreyPos, prevPredatorPos[1])
  const nextD0 = V.distance(nextPreyPos, nextPredatorPos[0])
  const nextD1 = V.distance(nextPreyPos, nextPredatorPos[1])
  const caught = catchers[0] || catchers[1]

  const predatorReward = (prevD: number, nextD: number, didCatch: boolean): number => {
    let r = C.REWARD_PREDATOR_DISTANCE_WEIGHT * (prevD - nextD)
    r -= C.REWARD_PREDATOR_TIME_PENALTY * dt
    if (didCatch) r += C.REWARD_PREDATOR_CAPTURE_BONUS
    return r
  }

  const nearest = Math.min(nextD0, nextD1)
  let preyReward = C.REWARD_PREY_SURVIVAL_WEIGHT * dt + C.REWARD_PREY_DISTANCE_WEIGHT * nearest
  if (caught) preyReward -= C.REWARD_PREY_CAUGHT_PENALTY

  return {
    predator: [predatorReward(prevD0, nextD0, catchers[0]), predatorReward(prevD1, nextD1, catchers[1])],
    prey: preyReward,
  }
}

/**
 * Layered on top of computeRewards: every MILESTONE_INTERVAL seconds the
 * prey survives, it banks a bonus and both hunters take a penalty — a
 * periodic incentive independent of the continuous per-step distance
 * reward. `prevSurvival`/`nextSurvival` are the survival-time clock before
 * and after this step; pass 0/0 (no-op) on a step where a capture just
 * reset it, since crossing back through past minute marks isn't a new milestone.
 */
export function applyMilestoneTick(rewards: StepRewards, prevSurvival: number, nextSurvival: number): StepRewards {
  const prevMark = Math.floor(prevSurvival / C.MILESTONE_INTERVAL)
  const nextMark = Math.floor(nextSurvival / C.MILESTONE_INTERVAL)
  if (nextMark <= prevMark) return rewards
  return {
    predator: [rewards.predator[0] - C.MILESTONE_PREDATOR_PENALTY, rewards.predator[1] - C.MILESTONE_PREDATOR_PENALTY],
    prey: rewards.prey + C.MILESTONE_PREY_BONUS,
  }
}
