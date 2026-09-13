'use client'

import type { Obstacle } from '@/lib/games/apiary-apex/terrain'

interface ObstacleFieldProps {
  obstacles: Obstacle[]
}

/** Honeycomb-hex pillars standing in for the endless field's terrain hazards. */
export function ObstacleField({ obstacles }: ObstacleFieldProps) {
  return (
    <group>
      {obstacles.map((o) => (
        <mesh key={`${o.x.toFixed(2)}-${o.z.toFixed(2)}`} position={[o.x, o.height / 2, o.z]}>
          <cylinderGeometry args={[o.radius, o.radius * 1.15, o.height, 6]} />
          <meshStandardMaterial color={(o.x + o.z) % 4 < 2 ? '#b8873a' : '#9c6b2e'} />
        </mesh>
      ))}
    </group>
  )
}
