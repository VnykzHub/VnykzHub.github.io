'use client'

import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Trail, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { rngFrom, type Rng } from '@/lib/games/shared/rng'
import { createSimState, stepSimulation, clusterCenter, type SimState, type Agent, type AgentStats } from '@/lib/games/apiary-apex/simulation'
import { chunksAround, type Chunk } from '@/lib/games/apiary-apex/terrain'
import { elevationAt, elevationGradient } from '@/lib/games/apiary-apex/terrainField'
import { TelemetryHarvester } from '@/lib/games/apiary-apex/telemetry'
import {
  FIXED_DT,
  HOVER_HEIGHT,
  FLIGHT_MAX_TURN_RATE,
  FLIGHT_BANK_GAIN,
  FLIGHT_MAX_BANK,
  FLIGHT_PITCH_GAIN,
  FLIGHT_MAX_PITCH,
  FLIGHT_SMOOTHING,
  THIRD_PERSON_DISTANCE,
  THIRD_PERSON_BASE_PITCH,
  ORBIT_YAW_SENSITIVITY,
  ORBIT_PITCH_SENSITIVITY,
  ORBIT_MIN_PITCH,
  ORBIT_MAX_PITCH,
} from '@/lib/games/apiary-apex/config'
import { Bee, type BeeHandle } from './Bee'
import { ObstacleField } from './ObstacleField'
import { TerrainField } from './TerrainField'

/** Which bee the camera is locked to — the only three options, by design. */
export type FollowTarget = 'predator-0' | 'predator-1' | 'prey'

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
  follow: FollowTarget
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

function SimulationRoot({ seed, paused, follow, onStats }: SimulationRootProps) {
  const simRef = useRef<SimState>(createSimState(seed))
  const rngRef = useRef<Rng>(rngFrom(seed, 'apiary-apex'))
  const harvesterRef = useRef(new TelemetryHarvester())
  const accRef = useRef(0)
  const lastPush = useRef(0)
  const lastChunkKey = useRef('')
  const lastSeenCaptureAt = useRef(0)
  const cameraLookAt = useRef(new THREE.Vector3(0, 0.6, 0))

  // Orbit is camera-only: dragging changes where you look FROM, never
  // anything the sim reads, so it can't influence a bee's steering.
  const orbitYaw = useRef(0)
  const orbitPitch = useRef(0)
  const dragState = useRef({ dragging: false, lastX: 0, lastY: 0 })
  const { gl } = useThree()

  useEffect(() => {
    const dom = gl.domElement
    dom.style.cursor = 'grab'
    dom.style.touchAction = 'none'
    const onPointerDown = (e: PointerEvent) => {
      dragState.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
      dom.style.cursor = 'grabbing'
      dom.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.current.dragging) return
      const dx = e.clientX - dragState.current.lastX
      const dy = e.clientY - dragState.current.lastY
      dragState.current.lastX = e.clientX
      dragState.current.lastY = e.clientY
      orbitYaw.current -= dx * ORBIT_YAW_SENSITIVITY
      orbitPitch.current = THREE.MathUtils.clamp(orbitPitch.current - dy * ORBIT_PITCH_SENSITIVITY, ORBIT_MIN_PITCH, ORBIT_MAX_PITCH)
    }
    const onPointerUp = () => {
      dragState.current.dragging = false
      dom.style.cursor = 'grab'
    }
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl])

  // Switching who the camera follows resets the look-around offset, so
  // every bee starts from the same clean behind-the-bee view.
  useEffect(() => {
    orbitYaw.current = 0
    orbitPitch.current = 0
  }, [follow])

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

    // Third-person follow camera: locked to whichever bee is selected,
    // sitting behind its current heading by default. Dragging adds a yaw/
    // pitch offset on top of that heading — purely a viewing angle, never
    // fed back into the sim, so it can't affect what the bee does.
    const followedAgent: Agent = follow === 'prey' ? sim.prey : sim.predators[follow === 'predator-0' ? 0 : 1]
    const followGroundY = elevationAt(seed, followedAgent.pos.x, followedAgent.pos.z)
    const followWorldPos = new THREE.Vector3(followedAgent.pos.x, followGroundY + HOVER_HEIGHT, followedAgent.pos.z)

    const baseHeading = Math.atan2(followedAgent.vel.x, followedAgent.vel.z)
    const totalYaw = baseHeading + orbitYaw.current
    const totalPitch = THREE.MathUtils.clamp(THIRD_PERSON_BASE_PITCH + orbitPitch.current, ORBIT_MIN_PITCH, ORBIT_MAX_PITCH)
    const horizontalDist = THIRD_PERSON_DISTANCE * Math.cos(totalPitch)
    const verticalDist = THIRD_PERSON_DISTANCE * Math.sin(totalPitch)
    const offset = new THREE.Vector3(-Math.sin(totalYaw) * horizontalDist, verticalDist, -Math.cos(totalYaw) * horizontalDist)
    const desiredCamPos = followWorldPos.clone().add(offset)

    cameraLookAt.current.lerp(followWorldPos, 1 - Math.exp(-delta * 2.5))
    state.camera.position.lerp(desiredCamPos, 1 - Math.exp(-delta * 2))
    state.camera.lookAt(cameraLookAt.current)

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
  follow: FollowTarget
  onStats: (stats: ApiaryStats) => void
}

export function Scene({ seed, paused, follow, onStats }: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 12, 20], fov: 50 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}>
        <SimulationRoot key={seed} seed={seed} paused={paused} follow={follow} onStats={onStats} />
      </Suspense>
    </Canvas>
  )
}
