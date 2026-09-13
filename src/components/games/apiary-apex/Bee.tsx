'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type BeeRole = 'predator' | 'prey'

export interface BeeHandle {
  group: THREE.Group
  /** 0 (calm) to 1 (a hunter is right on top of it) — only meaningful for the prey. */
  setDanger: (v: number) => void
  /** A brief scale bounce — fired on the hunter that just made a catch. */
  pulse: () => void
}

interface BeeProps {
  role: BeeRole
}

const PALETTE: Record<BeeRole, { body: string; head: string; emissive: string }> = {
  predator: { body: '#3a2410', head: '#d98a1f', emissive: '#c0392b' },
  prey: { body: '#f4c542', head: '#2c1b05', emissive: '#8fe38f' },
}

export const Bee = forwardRef<BeeHandle, BeeProps>(function Bee({ role }, ref) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const wingL = useRef<THREE.Mesh>(null)
  const wingR = useRef<THREE.Mesh>(null)
  const bodyMeshRef = useRef<THREE.Mesh>(null)
  const pulseStart = useRef<number | null>(null)
  const palette = PALETTE[role]
  const isPredator = role === 'predator'

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return groupRef.current as THREE.Group
      },
      setDanger(v: number) {
        if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = 0.12 + Math.max(0, Math.min(1, v)) * 1.1
      },
      pulse() {
        pulseStart.current = performance.now() / 1000
      },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const flap = Math.sin(clock.elapsedTime * 40) * 0.5 + 0.5
    if (wingL.current) wingL.current.rotation.z = 0.3 + flap * 0.5
    if (wingR.current) wingR.current.rotation.z = -0.3 - flap * 0.5

    if (pulseStart.current !== null && bodyMeshRef.current) {
      const elapsed = performance.now() / 1000 - pulseStart.current
      const duration = 0.4
      if (elapsed >= duration) {
        bodyMeshRef.current.scale.setScalar(1)
        pulseStart.current = null
      } else {
        // Bounce up to 1.4x and back via a half sine, so it reads as a
        // single "gulp" rather than a jarring snap.
        const s = 1 + Math.sin((elapsed / duration) * Math.PI) * 0.4
        bodyMeshRef.current.scale.setScalar(s)
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Abdomen — stretched along the forward (+Z) axis so heading reads at a glance. */}
      <mesh ref={bodyMeshRef} scale={[0.85, 0.8, 1.4]}>
        <sphereGeometry args={[0.5, 14, 12]} />
        <meshStandardMaterial ref={bodyMatRef} color={palette.body} emissive={palette.emissive} emissiveIntensity={0.12} />
      </mesh>
      {/* One dark banding stripe — every bee gets this regardless of role color.
          Torus defaults to lying flat in XY, wrapping around Z — exactly the
          body's long axis, so no rotation needed here. */}
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[0.42, 0.09, 8, 16]} />
        <meshStandardMaterial color="#1c1108" />
      </mesh>
      <mesh position={[0, 0.05, 0.55]}>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color={palette.head} />
      </mesh>
      {/* Antennae */}
      <mesh position={[0.12, 0.28, 0.78]} rotation={[0.5, 0, 0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
        <meshStandardMaterial color="#1c1108" />
      </mesh>
      <mesh position={[-0.12, 0.28, 0.78]} rotation={[0.5, 0, -0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
        <meshStandardMaterial color="#1c1108" />
      </mesh>
      {isPredator && (
        // A stinger read: two hunters, one clear silhouette cue for "this one
        // bites." Cone default-points +Y; rotate -90° about X so it points
        // -Z (rearward, away from the body) instead of back into it.
        <mesh position={[0, 0, -0.85]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.35, 6]} />
          <meshStandardMaterial color="#1c1108" />
        </mesh>
      )}
      <mesh ref={wingL} position={[0.35, 0.35, 0]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial color="#eaf6ff" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wingR} position={[-0.35, 0.35, 0]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial color="#eaf6ff" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
})
