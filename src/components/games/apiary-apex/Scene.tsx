'use client'

import { Suspense, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Trail, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { rngFrom, type Rng } from '@/lib/games/shared/rng'
import { createSimState, stepSimulation, clusterCenter, type SimState, type AgentStats } from '@/lib/games/apiary-apex/simulation'
import { chunksAround, type Chunk } from '@/lib/games/apiary-apex/terrain'
import { elevationAt, elevationGradient } from '@/lib/games/apiary-apex/terrainField'
import { TelemetryHarvester } from '@/lib/games/apiary-apex/telemetry'
import { FIXED_DT, HOVER_HEIGHT, FLIGHT_MAX_TURN_RATE, FLIGHT_BANK_GAIN, FLIGHT_MAX_BANK, FLIGHT_PITCH_GAIN, FLIGHT_MAX_PITCH, FLIGHT_SMOOTHING } from '@/lib/games/apiary-apex/config'
import { Bee, type BeeHandle } from './Bee'
import { ObstacleField } from './ObstacleField'
import { TerrainField } from './TerrainField'

export interface ApiaryStats {
  captures: number
  bestSurvival: number
  survivalTime: number
  closeCalls: number
  chunkCount: number
  bufferedFrames: number
  overtakes: number
  predatorStats: [AgentStats, AgentStats]
  preyStats: AgentStats
}

interface SimulationRootProps {
  seed: string
  paused: boolean
  onStats: (stats: ApiaryStats) => void
}

/** Per-bee smoothed flight state — yaw is turn-rate-limited, bank/pitch derived from that and terrain slope. */
interface FlightState {
  yaw: number
  bank: number
  pitch: number
}

function shortestAngleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

function SimulationRoot({ seed, paused, onStats }: SimulationRootProps) {
  const simRef = useRef<SimState>(createSimState(seed))
  const rngRef = useRef<Rng>(rngFrom(seed, 'apiary-apex'))
  const harvesterRef = useRef(new TelemetryHarvester())
  const accRef = useRef(0)
  const lastPush = useRef(0)
  const lastChunkKey = useRef('')
  const lastSeenCaptureAt = useRef(0)
  const cameraTarget = useRef(new THREE.Vector3(0, 0.6, 0))

  const predatorRefA = useRef<BeeHandle>(null)
  const predatorRefB = useRef<BeeHandle>(null)
  const preyRef = useRef<BeeHandle>(null)
  const preyObjRef = useRef<THREE.Object3D | null>(null)
  const ambienceRef = useRef<THREE.Group>(null)
  const flashRef = useRef<THREE.PointLight>(null)
  const flightP0 = useRef<FlightState>({ yaw: 0.4, bank: 0, pitch: 0 })
  const flightP1 = useRef<FlightState>({ yaw: Math.PI - 0.4, bank: 0, pitch: 0 })
  const flightPrey = useRef<FlightState>({ yaw: -Math.PI / 2, bank: 0, pitch: 0 })

  const [chunks, setChunks] = useState<Chunk[]>(() => chunksAround(seed, 0, 0))

  useFrame((state, rawDelta) => {
    if (paused) return
    const delta = Math.min(rawDelta, 0.25) // clamp huge deltas from a backgrounded tab
    accRef.current += delta
    let steps = 0
    while (accRef.current >= FIXED_DT && steps < 6) {
      const prev = simRef.current
      const next = stepSimulation(prev, rngRef.current, FIXED_DT)
      const h = harvesterRef.current
      h.record({ agentId: 'prey', obs: [next.prey.pos.x, next.prey.pos.z], action: [next.prey.vel.x, next.prey.vel.z], reward: next.lastRewards.prey, t: next.t })
      h.record({ agentId: 'predator-0', obs: [next.predators[0].pos.x, next.predators[0].pos.z], action: [next.predators[0].vel.x, next.predators[0].vel.z], reward: next.lastRewards.predator[0], t: next.t })
      h.record({ agentId: 'predator-1', obs: [next.predators[1].pos.x, next.predators[1].pos.z], action: [next.predators[1].vel.x, next.predators[1].vel.z], reward: next.lastRewards.predator[1], t: next.t })
      simRef.current = next
      accRef.current -= FIXED_DT
      steps++
    }

    const sim = simRef.current
    const center = clusterCenter(sim)

    const visibleChunks = chunksAround(seed, center.x, center.z)
    const chunkKey = visibleChunks
      .map((c) => c.id)
      .sort()
      .join('|')
    if (chunkKey !== lastChunkKey.current) {
      lastChunkKey.current = chunkKey
      setChunks(visibleChunks)
    }

    // Flight: yaw is turn-rate-limited (not snapped), which gives a genuine
    // turn rate to bank into; pitch follows ground slope under the heading.
    // Position sits on the local terrain elevation, not a flat y=0.
    const applyFlight = (handle: BeeHandle | null, pos: { x: number; z: number }, vel: { x: number; z: number }, flight: FlightState) => {
      if (!handle?.group) return
      const speed = Math.hypot(vel.x, vel.z)
      if (speed > 0.3) {
        const targetYaw = Math.atan2(vel.x, vel.z)
        const maxStep = FLIGHT_MAX_TURN_RATE * delta
        const rawDelta = shortestAngleDelta(flight.yaw, targetYaw)
        const turnDelta = Math.max(-maxStep, Math.min(maxStep, rawDelta))
        flight.yaw += turnDelta
        const turnRate = turnDelta / Math.max(delta, 1e-4)
        const targetBank = Math.max(-FLIGHT_MAX_BANK, Math.min(FLIGHT_MAX_BANK, turnRate * FLIGHT_BANK_GAIN))
        const smoothing = 1 - Math.exp(-FLIGHT_SMOOTHING * delta)
        flight.bank += (targetBank - flight.bank) * smoothing

        const grad = elevationGradient(seed, pos.x, pos.z)
        const headingX = Math.sin(flight.yaw)
        const headingZ = Math.cos(flight.yaw)
        const slopeAlongHeading = grad.x * headingX + grad.z * headingZ
        const targetPitch = Math.max(-FLIGHT_MAX_PITCH, Math.min(FLIGHT_MAX_PITCH, -slopeAlongHeading * FLIGHT_PITCH_GAIN))
        flight.pitch += (targetPitch - flight.pitch) * smoothing
      }
      const groundY = elevationAt(seed, pos.x, pos.z)
      handle.group.position.set(pos.x, groundY + HOVER_HEIGHT, pos.z)
      handle.group.rotation.set(flight.pitch, flight.yaw, flight.bank)
    }
    applyFlight(predatorRefA.current, sim.predators[0].pos, sim.predators[0].vel, flightP0.current)
    applyFlight(predatorRefB.current, sim.predators[1].pos, sim.predators[1].vel, flightP1.current)
    applyFlight(preyRef.current, sim.prey.pos, sim.prey.vel, flightPrey.current)
    preyObjRef.current = preyRef.current?.group ?? null
    ambienceRef.current?.position.set(center.x, 1.5, center.z)

    const d0 = Math.hypot(sim.prey.pos.x - sim.predators[0].pos.x, sim.prey.pos.z - sim.predators[0].pos.z)
    const d1 = Math.hypot(sim.prey.pos.x - sim.predators[1].pos.x, sim.prey.pos.z - sim.predators[1].pos.z)
    preyRef.current?.setDanger(Math.max(0, 1 - Math.min(d0, d1) / 8))

    // Capture feedback: a brief warm flash at the catch site and a scale
    // "gulp" on whichever hunter actually made it.
    if (sim.lastCaptureAt > lastSeenCaptureAt.current) {
      lastSeenCaptureAt.current = sim.lastCaptureAt
      if (sim.lastCatcherIndex === 0) predatorRefA.current?.pulse()
      else if (sim.lastCatcherIndex === 1) predatorRefB.current?.pulse()
      if (flashRef.current && sim.lastCapturePos) {
        const flashY = elevationAt(seed, sim.lastCapturePos.x, sim.lastCapturePos.z) + HOVER_HEIGHT
        flashRef.current.position.set(sim.lastCapturePos.x, flashY, sim.lastCapturePos.z)
        flashRef.current.intensity = 18
      }
    }
    if (flashRef.current && flashRef.current.intensity > 0.01) {
      flashRef.current.intensity *= Math.exp(-delta * 6)
    }

    // Chase camera: settle in behind the prey's heading, looking at the pack.
    // Distance and height scale with how spread out the three agents are, so
    // a fresh respawn (everyone far apart) pulls back to keep the whole chase
    // in frame instead of cropping a hunter out, and a tight chase pushes in
    // for a more intense close-up. Both track the local terrain elevation,
    // not a flat y=0, so the camera doesn't dip through hills or hover oddly
    // over valleys.
    const spread = Math.max(
      Math.hypot(sim.predators[0].pos.x - center.x, sim.predators[0].pos.z - center.z),
      Math.hypot(sim.predators[1].pos.x - center.x, sim.predators[1].pos.z - center.z),
      Math.hypot(sim.prey.pos.x - center.x, sim.prey.pos.z - center.z),
    )
    const camDistance = THREE.MathUtils.clamp(13 + spread * 0.9, 13, 34)
    const camHeight = THREE.MathUtils.clamp(7 + spread * 0.45, 7, 20)
    const centerGroundY = elevationAt(seed, center.x, center.z)
    const preyGroundY = elevationAt(seed, sim.prey.pos.x, sim.prey.pos.z)

    cameraTarget.current.lerp(new THREE.Vector3(center.x, centerGroundY + 0.6, center.z), 1 - Math.exp(-delta * 2.5))
    const heading = Math.atan2(sim.prey.vel.x, sim.prey.vel.z)
    const behind = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading)).multiplyScalar(camDistance)
    const desiredCamPos = new THREE.Vector3(sim.prey.pos.x, preyGroundY + camHeight, sim.prey.pos.z).add(behind)
    state.camera.position.lerp(desiredCamPos, 1 - Math.exp(-delta * 2))
    state.camera.lookAt(cameraTarget.current)

    const now = performance.now()
    if (now - lastPush.current > 180) {
      lastPush.current = now
      onStats({
        captures: sim.captures,
        bestSurvival: sim.bestSurvival,
        survivalTime: sim.survivalTime,
        closeCalls: sim.closeCalls,
        chunkCount: visibleChunks.length,
        bufferedFrames: harvesterRef.current.size,
        overtakes: sim.overtakes,
        predatorStats: sim.predatorStats,
        preyStats: sim.preyStats,
      })
    }
  })

  return (
    <>
      <fog attach="fog" args={['#0c1512', 20, 85]} />
      <ambientLight intensity={0.6} color="#cfe8c0" />
      <directionalLight position={[20, 30, 10]} intensity={1.1} color="#fff2cf" />
      <pointLight ref={flashRef} intensity={0} distance={14} decay={2} color="#ffb347" />
      <TerrainField seed={seed} chunks={chunks} />
      <ObstacleField obstacles={chunks.flatMap((c) => c.obstacles)} />
      <Bee ref={predatorRefA} role="predator" />
      <Bee ref={predatorRefB} role="predator" />
      <Bee ref={preyRef} role="prey" />
      {/* A faint motion streak on the survivor — the one agent worth tracking by eye. */}
      <Trail target={preyObjRef as RefObject<THREE.Object3D>} width={2} length={5} color="#f4c542" attenuation={(t) => t * t} />
      {/* Ambient pollen, recentered on the pack each frame so it never gets left behind. */}
      <group ref={ambienceRef}>
        <Sparkles count={70} scale={[50, 8, 50]} size={3.5} speed={0.25} color="#ffe9a8" opacity={0.65} />
      </group>
    </>
  )
}

interface SceneProps {
  seed: string
  paused: boolean
  onStats: (stats: ApiaryStats) => void
}

export function Scene({ seed, paused, onStats }: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 12, 20], fov: 50 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}>
        <SimulationRoot key={seed} seed={seed} paused={paused} onStats={onStats} />
      </Suspense>
    </Canvas>
  )
}
