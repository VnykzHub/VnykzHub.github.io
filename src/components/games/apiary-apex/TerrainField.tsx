'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { elevationAt, temperatureAt, temperatureColor } from '@/lib/games/apiary-apex/terrainField'
import { CHUNK_SIZE } from '@/lib/games/apiary-apex/config'
import type { Chunk } from '@/lib/games/apiary-apex/terrain'

const SEGMENTS = 10
const VERTS_PER_SIDE = SEGMENTS + 1

// Ground mesh geometry is a pure function of (seed, chunk) — cache it like
// terrain.ts caches obstacle scatter, so streaming doesn't rebuild vertex
// data every time a chunk re-enters the visibility window. GPU geometry
// needs an explicit dispose on eviction (plain data doesn't).
const geometryCache = new Map<string, THREE.BufferGeometry>()
const MAX_CACHE_ENTRIES = 60

function buildChunkGeometry(seed: string, chunk: Chunk): THREE.BufferGeometry {
  const cacheKey = `${seed}:${chunk.id}`
  const cached = geometryCache.get(cacheKey)
  if (cached) return cached

  const originX = chunk.cx * CHUNK_SIZE
  const originZ = chunk.cz * CHUNK_SIZE
  const positions = new Float32Array(VERTS_PER_SIDE * VERTS_PER_SIDE * 3)
  const colors = new Float32Array(VERTS_PER_SIDE * VERTS_PER_SIDE * 3)

  for (let iz = 0; iz < VERTS_PER_SIDE; iz++) {
    for (let ix = 0; ix < VERTS_PER_SIDE; ix++) {
      const localX = (ix / SEGMENTS) * CHUNK_SIZE
      const localZ = (iz / SEGMENTS) * CHUNK_SIZE
      const worldX = originX + localX
      const worldZ = originZ + localZ
      const y = elevationAt(seed, worldX, worldZ)
      const [r, g, b] = temperatureColor(temperatureAt(seed, worldX, worldZ))
      const vi = (iz * VERTS_PER_SIDE + ix) * 3
      positions[vi] = localX
      positions[vi + 1] = y
      positions[vi + 2] = localZ
      colors[vi] = r
      colors[vi + 1] = g
      colors[vi + 2] = b
    }
  }

  const indices: number[] = []
  for (let iz = 0; iz < SEGMENTS; iz++) {
    for (let ix = 0; ix < SEGMENTS; ix++) {
      const a = ix + VERTS_PER_SIDE * iz
      const b = ix + VERTS_PER_SIDE * (iz + 1)
      const c = ix + 1 + VERTS_PER_SIDE * (iz + 1)
      const d = ix + 1 + VERTS_PER_SIDE * iz
      indices.push(a, b, d, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  if (geometryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = geometryCache.keys().next().value
    if (oldestKey !== undefined) {
      geometryCache.get(oldestKey)?.dispose()
      geometryCache.delete(oldestKey)
    }
  }
  geometryCache.set(cacheKey, geometry)
  return geometry
}

function TerrainChunkMesh({ seed, chunk }: { seed: string; chunk: Chunk }) {
  const geometry = useMemo(() => buildChunkGeometry(seed, chunk), [seed, chunk])
  return (
    <mesh geometry={geometry} position={[chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  )
}

interface TerrainFieldProps {
  seed: string
  chunks: Chunk[]
}

/** The streamed, elevation-displaced, temperature-colored ground — one mesh per visible chunk. */
export function TerrainField({ seed, chunks }: TerrainFieldProps) {
  return (
    <group>
      {chunks.map((c) => (
        <TerrainChunkMesh key={c.id} seed={seed} chunk={c} />
      ))}
    </group>
  )
}
