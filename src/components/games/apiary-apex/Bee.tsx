'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type BeeRole = 'predator' | 'prey'

export interface BeeHandle {
  group: THREE.Group
  /** 0 (calm) to 1 (a hunter is right on top of it) — only meaningful for the prey. */
  setDanger: (v: number) => void
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
  const palette = PALETTE[role]

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return groupRef.current as THREE.Group
      },
      setDanger(v: number) {
        if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = 0.12 + Math.max(0, Math.min(1, v)) * 1.1
      },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const flap = Math.sin(clock.elapsedTime * 40) * 0.5 + 0.5
    if (wingL.current) wingL.current.rotation.z = 0.3 + flap * 0.5
    if (wingR.current) wingR.current.rotation.z = -0.3 - flap * 0.5
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshStandardMaterial ref={bodyMatRef} color={palette.body} emissive={palette.emissive} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.05, 0.55]}>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color={palette.head} />
      </mesh>
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
