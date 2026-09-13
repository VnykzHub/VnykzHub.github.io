'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import * as THREE from 'three'
import { rngFrom, type Rng } from '@/lib/games/shared/rng'
import { createSimState, stepSimulation, clusterCenter, type SimState } from '@/lib/games/apiary-apex/simulation'
import { chunksAround, type Obstacle } from '@/lib/games/apiary-apex/terrain'
import { TelemetryHarvester } from '@/lib/games/apiary-apex/telemetry'
import { CHUNK_SIZE, FIXED_DT } from '@/lib/games/apiary-apex/config'
import { Bee, type BeeHandle } from './Bee'
import { ObstacleField } from './ObstacleField'

export interface ApiaryStats {
  captures: number
  bestSurvival: number
  survivalTime: number
  closeCalls: number
  chunkCount: number
  bufferedFrames: number
}

interface SimulationRootProps {
  seed: string
  paused: boolean
  onStats: (stats: ApiaryStats) => void
}

function SimulationRoot({ seed, paused, onStats }: SimulationRootProps) {
  const simRef = useRef<SimState>(createSimState(seed))
  const rngRef = useRef<Rng>(rngFrom(seed, 'apiary-apex'))
  const harvesterRef = useRef(new TelemetryHarvester())
  const accRef = useRef(0)
  const lastPush = useRef(0)
  const lastChunkKey = useRef('')
  const cameraTarget = useRef(new THREE.Vector3(0, 0.6, 0))

  const predatorRefA = useRef<BeeHandle>(null)
  const predatorRefB = useRef<BeeHandle>(null)
  const preyRef = useRef<BeeHandle>(null)
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => chunksAround(seed, 0, 0).flatMap((c) => c.obstacles))

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

    const chunks = chunksAround(seed, center.x, center.z)
    const chunkKey = chunks
      .map((c) => c.id)
      .sort()
      .join('|')
    if (chunkKey !== lastChunkKey.current) {
      lastChunkKey.current = chunkKey
      setObstacles(chunks.flatMap((c) => c.obstacles))
    }

    const applyTransform = (handle: BeeHandle | null, pos: { x: number; z: number }, vel: { x: number; z: number }) => {
      if (!handle?.group) return
      handle.group.position.set(pos.x, 0.6, pos.z)
      if (vel.x * vel.x + vel.z * vel.z > 0.01) handle.group.rotation.y = Math.atan2(vel.x, vel.z)
    }
    applyTransform(predatorRefA.current, sim.predators[0].pos, sim.predators[0].vel)
    applyTransform(predatorRefB.current, sim.predators[1].pos, sim.predators[1].vel)
    applyTransform(preyRef.current, sim.prey.pos, sim.prey.vel)

    const d0 = Math.hypot(sim.prey.pos.x - sim.predators[0].pos.x, sim.prey.pos.z - sim.predators[0].pos.z)
    const d1 = Math.hypot(sim.prey.pos.x - sim.predators[1].pos.x, sim.prey.pos.z - sim.predators[1].pos.z)
    preyRef.current?.setDanger(Math.max(0, 1 - Math.min(d0, d1) / 8))

    // Chase camera: settle in behind the prey's heading, looking at the pack.
    // Distance and height scale with how spread out the three agents are, so
    // a fresh respawn (everyone far apart) pulls back to keep the whole chase
    // in frame instead of cropping a hunter out, and a tight chase pushes in
    // for a more intense close-up.
    const spread = Math.max(
      Math.hypot(sim.predators[0].pos.x - center.x, sim.predators[0].pos.z - center.z),
      Math.hypot(sim.predators[1].pos.x - center.x, sim.predators[1].pos.z - center.z),
      Math.hypot(sim.prey.pos.x - center.x, sim.prey.pos.z - center.z),
    )
    const camDistance = THREE.MathUtils.clamp(13 + spread * 0.9, 13, 34)
    const camHeight = THREE.MathUtils.clamp(7 + spread * 0.45, 7, 20)

    cameraTarget.current.lerp(new THREE.Vector3(center.x, 0.6, center.z), 1 - Math.exp(-delta * 2.5))
    const heading = Math.atan2(sim.prey.vel.x, sim.prey.vel.z)
    const behind = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading)).multiplyScalar(camDistance)
    const desiredCamPos = new THREE.Vector3(sim.prey.pos.x, camHeight, sim.prey.pos.z).add(behind)
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
        chunkCount: chunks.length,
        bufferedFrames: harvesterRef.current.size,
      })
    }
  })

  return (
    <>
      <fog attach="fog" args={['#0c1512', 20, 85]} />
      <ambientLight intensity={0.6} color="#cfe8c0" />
      <directionalLight position={[20, 30, 10]} intensity={1.1} color="#fff2cf" />
      <Grid
        args={[400, 400]}
        cellSize={2}
        cellColor="#2f4a34"
        sectionSize={CHUNK_SIZE}
        sectionColor="#4c7a52"
        fadeDistance={90}
        infiniteGrid
      />
      <ObstacleField obstacles={obstacles} />
      <Bee ref={predatorRefA} role="predator" />
      <Bee ref={predatorRefB} role="predator" />
      <Bee ref={preyRef} role="prey" />
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
