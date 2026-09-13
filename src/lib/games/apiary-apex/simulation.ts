import type { Rng } from '@/lib/games/shared/rng'
import * as V from './vec2'
import type { Vec2 } from './vec2'
import { chunksAround, type Obstacle } from './terrain'
import { fleeForce, pursueForce, separationForce, obstacleAvoidForce, stepWander } from './steering'
import { computeRewards, type StepRewards } from './rewards'
import * as C from './config'

export interface Agent {
  pos: Vec2
  vel: Vec2
  wanderAngle: number
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
  distanceTraveled: number
  lastCaptureAt: number
  lastRewards: StepRewards
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
    distanceTraveled: 0,
    lastCaptureAt: 0,
    lastRewards: { predator: [0, 0], prey: 0 },
  }
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

  const nextP0 = { ...integrate(p0, predatorForce(p0, p1, p0Wander.dir), C.PREDATOR_MAX_SPEED, C.PREDATOR_MAX_FORCE, dt), wanderAngle: p0Wander.angle }
  const nextP1 = { ...integrate(p1, predatorForce(p1, p0, p1Wander.dir), C.PREDATOR_MAX_SPEED, C.PREDATOR_MAX_FORCE, dt), wanderAngle: p1Wander.angle }

  let preyForce = V.add(
    fleeForce(prey.pos, prey.vel, p0.pos, C.PREY_MAX_SPEED),
    fleeForce(prey.pos, prey.vel, p1.pos, C.PREY_MAX_SPEED),
  )
  preyForce = V.add(preyForce, obstacleAvoidForce(prey.pos, prey.vel, obstacles, C.OBSTACLE_AVOID_WEIGHT * 1.3))
  preyForce = V.add(preyForce, V.scale(preyWander.dir, C.WANDER_WEIGHT))
  const nextPreyRaw = { ...integrate(prey, preyForce, C.PREY_MAX_SPEED, C.PREY_MAX_FORCE, dt), wanderAngle: preyWander.angle }

  const nextD0 = V.distance(nextPreyRaw.pos, nextP0.pos)
  const nextD1 = V.distance(nextPreyRaw.pos, nextP1.pos)
  const nearest = Math.min(nextD0, nextD1)
  const captured = nearest < C.CAPTURE_RADIUS

  const lastRewards = computeRewards(prey.pos, [p0.pos, p1.pos], nextPreyRaw.pos, [nextP0.pos, nextP1.pos], captured, dt)

  let captures = state.captures
  let closeCalls = state.closeCalls
  let survivalTime = state.survivalTime + dt
  let bestSurvival = state.bestSurvival
  let lastCaptureAt = state.lastCaptureAt
  let inCloseRange = state.inCloseRange
  let nextPrey = nextPreyRaw

  if (captured) {
    captures += 1
    bestSurvival = Math.max(bestSurvival, survivalTime)
    lastCaptureAt = state.t + dt
    survivalTime = 0
    inCloseRange = false
    nextPrey = respawnPrey([nextP0, nextP1], rng)
  } else {
    const nowClose = nearest < C.CLOSE_CALL_RADIUS
    if (nowClose && !state.inCloseRange) closeCalls += 1
    inCloseRange = nowClose
  }

  const distanceTraveled = state.distanceTraveled + V.length(nextPreyRaw.vel) * dt

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
    distanceTraveled,
    lastCaptureAt,
    lastRewards,
  }
}
