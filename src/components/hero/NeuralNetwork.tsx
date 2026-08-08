'use client'

// src/components/hero/NeuralNetwork.tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface NeuralNetworkProps {
  count?: number
  mousePosition: { x: number; y: number }
}

export function NeuralNetwork({ count = 300, mousePosition }: NeuralNetworkProps) {
  const points = useRef<THREE.Points>(null!)
  
  // Generate positions with a hole in the middle for text visibility
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Create a torus/donut shape to avoid the center
      const theta = THREE.MathUtils.randFloatSpread(360)
      const phi = Math.random() * Math.PI * 2
      
      // Minimum distance from center to avoid text area
      const minRadius = 8
      const maxRadius = 25
      const distance = minRadius + Math.random() * (maxRadius - minRadius)
      
      const x = distance * Math.sin(theta) * Math.cos(phi)
      const y = distance * Math.sin(theta) * Math.sin(phi)
      const z = distance * Math.cos(theta)
      
      positions.set([x, y, z], i * 3)
    }
    
    return positions
  }, [count])
  
  // Create connections between nearby particles
  const connections = useMemo(() => {
    const lines: THREE.Vector3[] = []
    const posArray = Array.from({ length: count }, (_, i) => 
      new THREE.Vector3(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      )
    )
    
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const distance = posArray[i].distanceTo(posArray[j])
        if (distance < 5 && Math.random() > 0.95) {
          lines.push(posArray[i], posArray[j])
        }
      }
    }
    
    return lines
  }, [positions, count])
  
  // Animate particles
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (points.current) {
      // Gentle rotation
      points.current.rotation.x = Math.sin(time / 6) * 0.05
      points.current.rotation.y = Math.sin(time / 4) * 0.05
      
      // Mouse interaction (more subtle)
      const mouseX = (mousePosition.x / window.innerWidth - 0.5) * 2
      const mouseY = -(mousePosition.y / window.innerHeight - 0.5) * 2
      
      points.current.rotation.x += mouseY * 0.05
      points.current.rotation.y += mouseX * 0.05
      
      // Gentle floating animation
      const positionsAttr = points.current.geometry.attributes.position
      const originalPositions = positions.slice()
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        positionsAttr.array[i3 + 1] = originalPositions[i3 + 1] + Math.sin(time + i * 0.1) * 0.05
      }
      
      positionsAttr.needsUpdate = true
    }
  })
  
  return (
    <group>
      {/* Particles */}
      <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#F0B84C"
          size={0.2}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
      
      {/* Connections */}
      {connections.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(connections.flatMap(v => [v.x, v.y, v.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#F0B84C"
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
      
      {/* Additional outer ring particles for depth */}
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#4A9E93"
          size={0.1}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.3}
        />
      </Points>
    </group>
  )
}
