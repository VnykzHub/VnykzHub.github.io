'use client'

import type { Obstacle } from '@/lib/games/apiary-apex/terrain'

interface ObstacleFieldProps {
  obstacles: Obstacle[]
}

/**
 * Ten distinct silhouettes (see terrain.ts's OBSTACLE_TYPES) so the field
 * reads as a real place instead of a repeated hex pillar. Each is plain
 * geometry + a natural-palette color for now — a texture/material pass is
 * a drop-in swap later since the shape and the "slot" it sits in are
 * already separated per type.
 */
function ObstacleMesh({ o }: { o: Obstacle }) {
  const { x, z, radius, height, groundY, type } = o

  switch (type) {
    case 'honeycomb':
      return (
        <mesh position={[x, groundY + height / 2, z]}>
          <cylinderGeometry args={[radius, radius * 1.15, height, 6]} />
          <meshStandardMaterial color={(x + z) % 4 < 2 ? '#b8873a' : '#9c6b2e'} />
        </mesh>
      )

    case 'boulder':
      return (
        <mesh position={[x, groundY + radius * 0.7, z]} rotation={[0.3, 0.4, 0.1]}>
          <icosahedronGeometry args={[radius * 0.9, 0]} />
          <meshStandardMaterial color="#6b6a63" flatShading />
        </mesh>
      )

    case 'pine':
      return (
        <group position={[x, groundY, z]}>
          <mesh position={[0, height * 0.15, 0]}>
            <cylinderGeometry args={[radius * 0.12, radius * 0.15, height * 0.3, 6]} />
            <meshStandardMaterial color="#5a3d22" />
          </mesh>
          <mesh position={[0, height * 0.55, 0]}>
            <coneGeometry args={[radius * 0.7, height * 0.6, 8]} />
            <meshStandardMaterial color="#2f5233" />
          </mesh>
          <mesh position={[0, height * 0.85, 0]}>
            <coneGeometry args={[radius * 0.5, height * 0.45, 8]} />
            <meshStandardMaterial color="#356b3a" />
          </mesh>
        </group>
      )

    case 'flowerCluster':
      return (
        <group position={[x, groundY, z]}>
          {(
            [
              [-0.3, 0, '#e88fb0'],
              [0.3, 0.1, '#f0c14b'],
              [0, -0.3, '#e6e6e6'],
            ] as const
          ).map(([dx, dz, color], i) => (
            <group key={i} position={[dx * radius, 0, dz * radius]}>
              <mesh position={[0, height * 0.35, 0]}>
                <cylinderGeometry args={[0.03, 0.03, height * 0.7, 4]} />
                <meshStandardMaterial color="#3d6b3f" />
              </mesh>
              <mesh position={[0, height * 0.75, 0]}>
                <sphereGeometry args={[radius * 0.28, 8, 6]} />
                <meshStandardMaterial color={color} />
              </mesh>
            </group>
          ))}
        </group>
      )

    case 'mushroom':
      return (
        <group position={[x, groundY, z]}>
          <mesh position={[0, height * 0.3, 0]}>
            <cylinderGeometry args={[radius * 0.18, radius * 0.22, height * 0.6, 8]} />
            <meshStandardMaterial color="#e8dcc0" />
          </mesh>
          <mesh position={[0, height * 0.65, 0]} scale={[1, 0.55, 1]}>
            <sphereGeometry args={[radius * 0.75, 10, 8]} />
            <meshStandardMaterial color="#a83232" />
          </mesh>
        </group>
      )

    case 'log':
      return (
        <mesh position={[x, groundY + radius * 0.55, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.55, radius * 0.55, height * 1.4, 8]} />
          <meshStandardMaterial color="#5a4128" />
        </mesh>
      )

    case 'reedCluster':
      return (
        <group position={[x, groundY, z]}>
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i / 5) * Math.PI * 2
            const dx = Math.cos(angle) * radius * 0.4
            const dz = Math.sin(angle) * radius * 0.4
            return (
              <mesh key={i} position={[dx, height * 0.5, dz]} rotation={[0.05 * i, 0, 0.03 * i]}>
                <cylinderGeometry args={[0.04, 0.06, height, 5]} />
                <meshStandardMaterial color={i % 2 ? '#6b8f3e' : '#587a34'} />
              </mesh>
            )
          })}
        </group>
      )

    case 'crystal':
      return (
        <group position={[x, groundY, z]}>
          <mesh position={[0, height * 0.5, 0]} rotation={[0.2, 0.4, 0]}>
            <octahedronGeometry args={[radius * 0.6, 0]} />
            <meshStandardMaterial color="#8fd8e0" emissive="#3fa8b8" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[radius * 0.3, height * 0.3, radius * 0.1]} rotation={[0.5, 0.1, 0.3]}>
            <octahedronGeometry args={[radius * 0.35, 0]} />
            <meshStandardMaterial color="#a8e8f0" emissive="#5fc0d0" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )

    case 'stump':
      return (
        <group position={[x, groundY, z]}>
          <mesh position={[0, height * 0.25, 0]}>
            <cylinderGeometry args={[radius * 0.6, radius * 0.65, height * 0.5, 10]} />
            <meshStandardMaterial color="#6b4a2e" />
          </mesh>
          <mesh position={[0, height * 0.5 + 0.01, 0]}>
            <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.05, 10]} />
            <meshStandardMaterial color="#8a6438" />
          </mesh>
        </group>
      )

    case 'bush':
      return (
        <group position={[x, groundY, z]}>
          {(
            [
              [0, 0, 0, 1],
              [0.35, -0.1, 0.1, 0.7],
              [-0.3, 0.05, -0.15, 0.65],
            ] as const
          ).map(([dx, dy, dz, s], i) => (
            <mesh key={i} position={[dx * radius, height * 0.4 + dy * radius, dz * radius]}>
              <sphereGeometry args={[radius * 0.55 * s, 10, 8]} />
              <meshStandardMaterial color={i === 0 ? '#3f6b34' : '#4d7a3e'} />
            </mesh>
          ))}
        </group>
      )
  }
}

export function ObstacleField({ obstacles }: ObstacleFieldProps) {
  return (
    <group>
      {obstacles.map((o) => (
        <ObstacleMesh key={`${o.x.toFixed(2)}-${o.z.toFixed(2)}`} o={o} />
      ))}
    </group>
  )
}
