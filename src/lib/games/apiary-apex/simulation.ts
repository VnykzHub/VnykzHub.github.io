import type { Rng } from '@/lib/games/shared/rng'
import * as V from './vec2'
import type { Vec2 } from './vec2'
import { chunksAround, type Obstacle } from './terrain'
import { terrainSpeedMultiplier } from './terrainField'
import { fleeForce, pursueForce, separationForce, obstacleAvoidForce, stepWander, resolveObstacleCollisions } from './steering'
import { computeRewards, applyMilestoneTick, type StepRewards } from './rewards'
import * as C from './config'

export interface Agent {
  pos: Vec2
  vel: Vec2
  wanderAngle: number
}

export interface AgentStats {
  cumulativeReward: number
  distanceTraveled: number
  topSpeed: number
}

function freshStats(): AgentStats {
  return { cumulativeReward: 0, distanceTraveled: 0, topSpeed: 0 }
}

export interface SimState {
  seed: string
  t: number
  predators: [Agent, Agent]
  prey: Agent
  captures: number
  closeCalls: number
  inCloseRange: boolean
  survivalTime: number
  bestSurvival: number
  lastCaptureAt: number
  /** World position of the most recent capture (pre-respawn) — drives the capture visual effect. */
  lastCapturePos: Vec2 | null
  /** Which hunter made the most recent catch (0 or 1); null before any capture. */
  lastCatcherIndex: 0 | 1 | null
  lastRewards: StepRewards
  /** Sim time at which the post-capture "hunters lost the trail" window ends. */
  confusionUntil: number
  /** Sim time until which a fresh respawn can't be captured (respawn i-frames). */
  immuneUntil: number
  /** Which hunter is currently closer to the prey — used only to detect a lead swap. */
  currentLeader: 0 | 1 | null
  /** How many times the trailing hunter has overtaken the leader. */
  overtakes: number
  predatorStats: [AgentStats, AgentStats]
  preyStats: AgentStats
}

function makeAgent(x: number, z: number, angle: number): Agent {
  return { pos: { x, z }, vel: V.fromAngle(angle, 2), wanderAngle: angle }
}

export function createSimState(seed: string): SimState {
  return {
    seed,
    t: 0,
    predators: [makeAgent(-14, -6, 0.4), makeAgent(14, -6, Math.PI - 0.4)],
    prey: makeAgent(0, 10, -Math.PI / 2),
    captures: 0,
    closeCalls: 0,
    inCloseRange: false,
    survivalTime: 0,
    bestSurvival: 0,
    lastCaptureAt: 0,
    lastCapturePos: null,
    lastCatcherIndex: null,
    lastRewards: { predator: [0, 0], prey: 0 },
    confusionUntil: 0,
    immuneUntil: 0,
    currentLeader: null,
    overtakes: 0,
    predatorStats: [freshStats(), freshStats()],
    preyStats: freshStats(),
  }
}

/**
 * Combined hunter speed/force multiplier for this step: reduced right after
 * a capture (they've lost the trail), rising with an unbroken chase (rising
 * tension), both linear ramps. 1.0 is "normal."
 */
function predatorIntensity(state: SimState): number {
  const confusionRemaining = Math.max(0, state.confusionUntil - state.t)
  const confusionT = confusionRemaining > 0 ? confusionRemaining / C.POST_CAPTURE_CONFUSION_DURATION : 0
  const forceFactor = 1 - confusionT * (1 - C.POST_CAPTURE_CONFUSION_FORCE_FACTOR)
  const tensionBonus = Math.min(state.survivalTime / C.TENSION_RAMP_TIME, 1) * C.TENSION_RAMP_MAX_BONUS
  return (1 + tensionBonus) * forceFactor
}

/**
 * The two hunters race each other too: whichever is currently farther from
 * the prey gets a speed bonus proportional to the gap, so the lead swaps
 * back and forth instead of settling — an overtake, not just a formation.
 */
function rivalryMultipliers(distA: number, distB: number): [number, number] {
  const diff = distA - distB // positive => A is trailing
  const t = Math.max(-1, Math.min(1, diff / C.RIVALRY_MAX_DIFF))
  return [1 + Math.max(0, t) * C.RIVALRY_MAX_BOOST, 1 + Math.max(0, -t) * C.RIVALRY_MAX_BOOST]
}

/** Center-of-mass of the whole pack — also what the terrain streamer and camera track. */
export function clusterCenter(state: SimState): Vec2 {
  return {
    x: (state.predators[0].pos.x + state.predators[1].pos.x + state.prey.pos.x) / 3,
    z: (state.predators[0].pos.z + state.predators[1].pos.z + state.prey.pos.z) / 3,
  }
}

function activeObstacles(state: SimState): Obstacle[] {
  const center = clusterCenter(state)
  return chunksAround(state.seed, center.x, center.z).flatMap((c) => c.obstacles)
}

function respawnPrey(predators: [Agent, Agent], rng: Rng): Agent {
  const cx = (predators[0].pos.x + predators[1].pos.x) / 2
  const cz = (predators[0].pos.z + predators[1].pos.z) / 2
  const angle = rng() * Math.PI * 2
  const dist = C.RESPAWN_MIN_DIST + rng() * (C.RESPAWN_MAX_DIST - C.RESPAWN_MIN_DIST)
  const pos = { x: cx + Math.cos(angle) * dist, z: cz + Math.sin(angle) * dist }
  return { pos, vel: V.fromAngle(angle + Math.PI, 3), wanderAngle: angle }
}

function integrate(agent: Agent, force: Vec2, maxSpeed: number, maxForce: number, dt: number): Agent {
  const f = V.limit(force, maxForce)
  const vel = V.limit(V.add(agent.vel, V.scale(f, dt)), maxSpeed)
  const pos = V.add(agent.pos, V.scale(vel, dt))
  return { ...agent, pos, vel }
}

export function stepSimulation(state: SimState, rng: Rng, dt: number = C.FIXED_DT): SimState {
  const obstacles = activeObstacles(state)
  const [p0, p1] = state.predators
  const prey = state.prey

  const p0Wander = stepWander(p0.wanderAngle, rng)
  const p1Wander = stepWander(p1.wanderAngle, rng)
  const preyWander = stepWander(prey.wanderAngle, rng)

  const predatorForce = (self: Agent, mate: Agent, wanderDir: Vec2): Vec2 => {
    let force = pursueForce(self.pos, self.vel, prey.pos, prey.vel, C.PREDATOR_MAX_SPEED)
    force = V.add(force, V.scale(separationForce(self.pos, [mate.pos], C.TEAM_SEPARATION_RADIUS), C.TEAM_SEPARATION_WEIGHT))
    force = V.add(force, obstacleAvoidForce(self.pos, self.vel, obstacles, C.OBSTACLE_AVOID_WEIGHT))
    force = V.add(force, V.scale(wanderDir, C.WANDER_WEIGHT * 0.25))
    return force
  }

  const intensity = predatorIntensity(state)
  const [rivalryA, rivalryB] = rivalryMultipliers(V.distance(p0.pos, prey.pos), V.distance(p1.pos, prey.pos))
  const terrainA = terrainSpeedMultiplier(state.seed, p0.pos, p0.vel)
  const terrainB = terrainSpeedMultiplier(state.seed, p1.pos, p1.vel)
  const terrainPrey = terrainSpeedMultiplier(state.seed, prey.pos, prey.vel)

  const p0Mult = intensity * rivalryA * terrainA
  const p1Mult = intensity * rivalryB * terrainB
  const rawP0 = integrate(p0, predatorForce(p0, p1, p0Wander.dir), C.PREDATOR_MAX_SPEED * p0Mult, C.PREDATOR_MAX_FORCE * p0Mult, dt)
  const rawP1 = integrate(p1, predatorForce(p1, p0, p1Wander.dir), C.PREDATOR_MAX_SPEED * p1Mult, C.PREDATOR_MAX_FORCE * p1Mult, dt)
  const correctedP0 = resolveObstacleCollisions(rawP0.pos, rawP0.vel, obstacles)
  const correctedP1 = resolveObstacleCollisions(rawP1.pos, rawP1.vel, obstacles)
  const nextP0: Agent = { pos: correctedP0.pos, vel: correctedP0.vel, wanderAngle: p0Wander.angle }
  const nextP1: Agent = { pos: correctedP1.pos, vel: correctedP1.vel, wanderAngle: p1Wander.angle }

  let preyForce = V.add(
    fleeForce(prey.pos, prey.vel, p0.pos, C.PREY_MAX_SPEED),
    fleeForce(prey.pos, prey.vel, p1.pos, C.PREY_MAX_SPEED),
  )
  preyForce = V.add(preyForce, obstacleAvoidForce(prey.pos, prey.vel, obstacles, C.OBSTACLE_AVOID_WEIGHT * 1.3))
  preyForce = V.add(preyForce, V.scale(preyWander.dir, C.WANDER_WEIGHT))
  const rawPrey = integrate(prey, preyForce, C.PREY_MAX_SPEED * terrainPrey, C.PREY_MAX_FORCE * terrainPrey, dt)
  const correctedPrey = resolveObstacleCollisions(rawPrey.pos, rawPrey.vel, obstacles)
  const nextPreyRaw: Agent = { pos: correctedPrey.pos, vel: correctedPrey.vel, wanderAngle: preyWander.angle }

  const nextD0 = V.distance(nextPreyRaw.pos, nextP0.pos)
  const nextD1 = V.distance(nextPreyRaw.pos, nextP1.pos)
  const outsideImmunity = state.t >= state.immuneUntil
  const catchers: [boolean, boolean] = [outsideImmunity && nextD0 < C.CAPTURE_RADIUS, outsideImmunity && nextD1 < C.CAPTURE_RADIUS]
  const captured = catchers[0] || catchers[1]

  let rewards = computeRewards(prey.pos, [p0.pos, p1.pos], nextPreyRaw.pos, [nextP0.pos, nextP1.pos], catchers, dt)
  const survivalTimeCandidate = captured ? 0 : state.survivalTime + dt
  rewards = applyMilestoneTick(rewards, state.survivalTime, survivalTimeCandidate)

  let captures = state.captures
  let closeCalls = state.closeCalls
  let survivalTime = state.survivalTime + dt
  let bestSurvival = state.bestSurvival
  let lastCaptureAt = state.lastCaptureAt
  let lastCapturePos = state.lastCapturePos
  let lastCatcherIndex = state.lastCatcherIndex
  let inCloseRange = state.inCloseRange
  let nextPrey = nextPreyRaw
  let confusionUntil = state.confusionUntil
  let immuneUntil = state.immuneUntil
  let currentLeader = state.currentLeader
  let overtakes = state.overtakes

  if (captured) {
    captures += 1
    bestSurvival = Math.max(bestSurvival, survivalTime)
    lastCaptureAt = state.t + dt
    lastCapturePos = nextPreyRaw.pos
    lastCatcherIndex = catchers[0] ? 0 : 1
    survivalTime = 0
    inCloseRange = false
    confusionUntil = state.t + dt + C.POST_CAPTURE_CONFUSION_DURATION
    immuneUntil = state.t + dt + C.POST_RESPAWN_IMMUNITY
    currentLeader = null // the post-respawn distance jump isn't a real lead change
    nextPrey = respawnPrey([nextP0, nextP1], rng)
  } else {
    const nowClose = Math.min(nextD0, nextD1) < C.CLOSE_CALL_RADIUS
    if (nowClose && !state.inCloseRange) closeCalls += 1
    inCloseRange = nowClose

    const leaderNow: 0 | 1 = nextD0 < nextD1 ? 0 : 1
    if (currentLeader !== null && currentLeader !== leaderNow) overtakes += 1
    currentLeader = leaderNow
  }

  const speedOf = (v: Vec2): number => V.length(v)
  const predatorStats: [AgentStats, AgentStats] = [
    {
      cumulativeReward: state.predatorStats[0].cumulativeReward + rewards.predator[0],
      distanceTraveled: state.predatorStats[0].distanceTraveled + speedOf(nextP0.vel) * dt,
      topSpeed: Math.max(state.predatorStats[0].topSpeed, speedOf(nextP0.vel)),
    },
    {
      cumulativeReward: state.predatorStats[1].cumulativeReward + rewards.predator[1],
      distanceTraveled: state.predatorStats[1].distanceTraveled + speedOf(nextP1.vel) * dt,
      topSpeed: Math.max(state.predatorStats[1].topSpeed, speedOf(nextP1.vel)),
    },
  ]
  const preyStats: AgentStats = {
    cumulativeReward: state.preyStats.cumulativeReward + rewards.prey,
    distanceTraveled: state.preyStats.distanceTraveled + speedOf(nextPreyRaw.vel) * dt,
    topSpeed: Math.max(state.preyStats.topSpeed, speedOf(nextPreyRaw.vel)),
  }

  return {
    ...state,
    t: state.t + dt,
    predators: [nextP0, nextP1],
    prey: nextPrey,
    captures,
    closeCalls,
    inCloseRange,
    survivalTime,
    bestSurvival,
    lastCaptureAt,
    lastCapturePos,
    lastCatcherIndex,
    lastRewards: rewards,
    confusionUntil,
    immuneUntil,
    currentLeader,
    overtakes,
    predatorStats,
    preyStats,
  }
}
