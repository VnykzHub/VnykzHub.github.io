import { rngFrom } from '@/lib/games/shared/rng'
import { elevationAt } from './terrainField'
import {
  CHUNK_SIZE,
  VISIBILITY_RADIUS,
  SAFE_ZONE_RADIUS,
  OBSTACLE_MIN_PER_CHUNK,
  OBSTACLE_MAX_PER_CHUNK,
  OBSTACLE_MIN_RADIUS,
  OBSTACLE_MAX_RADIUS,
} from './config'

/**
 * Ten distinct silhouettes so the field reads as a real place rather than a
 * field of identical hex pillars — each type gets its own geometry in
 * ObstacleField.tsx. Deliberately just shape + a natural-palette color for
 * now; a later aesthetic pass (real materials/textures per type) slots in
 * without touching this list.
 */
export const OBSTACLE_TYPES = [
  'honeycomb',
  'boulder',
  'pine',
  'flowerCluster',
  'mushroom',
  'log',
  'reedCluster',
  'crystal',
  'stump',
  'bush',
] as const

export type ObstacleType = (typeof OBSTACLE_TYPES)[number]

export interface Obstacle {
  x: number
  z: number
  radius: number
  height: number
  type: ObstacleType
  /** Terrain elevation at (x, z) — obstacles sit on the ground, not at world y=0. */
  groundY: number
}

export interface Chunk {
  id: string
  cx: number
  cz: number
  obstacles: Obstacle[]
}

export function chunkId(cx: number, cz: number): string {
  return `${cx},${cz}`
}

export function chunkAt(x: number, z: number): { cx: number; cz: number } {
  return { cx: Math.floor(x / CHUNK_SIZE), cz: Math.floor(z / CHUNK_SIZE) }
}

// Chunks are pure functions of (seed, cx, cz) — cache them so a 60Hz sim loop
// and the renderer aren't re-rolling the same obstacle scatter every frame.
// Capped so an endlessly-running tab doesn't grow this without bound.
const chunkCache = new Map<string, Chunk>()
const MAX_CACHE_ENTRIES = 2000

/** Deterministic obstacle scatter for one chunk — same (seed, cx, cz) always yields the same obstacles. */
export function buildChunk(seed: string, cx: number, cz: number): Chunk {
  const id = chunkId(cx, cz)
  const cacheKey = `${seed}:${id}`
  const cached = chunkCache.get(cacheKey)
  if (cached) return cached

  const r = rngFrom(seed, `chunk:${id}`)
  const count = OBSTACLE_MIN_PER_CHUNK + Math.floor(r() * (OBSTACLE_MAX_PER_CHUNK - OBSTACLE_MIN_PER_CHUNK + 1))
  const originX = cx * CHUNK_SIZE
  const originZ = cz * CHUNK_SIZE
  const obstacles: Obstacle[] = []
  for (let i = 0; i < count; i++) {
    const x = originX + r() * CHUNK_SIZE
    const z = originZ + r() * CHUNK_SIZE
    const radius = OBSTACLE_MIN_RADIUS + r() * (OBSTACLE_MAX_RADIUS - OBSTACLE_MIN_RADIUS)
    if (Math.hypot(x, z) < SAFE_ZONE_RADIUS + radius) continue // keep spawn clear
    const height = 2 + r() * 3
    const type = OBSTACLE_TYPES[Math.floor(r() * OBSTACLE_TYPES.length)]
    const groundY = elevationAt(seed, x, z)
    obstacles.push({ x, z, radius, height, type, groundY })
  }

  const chunk: Chunk = { id, cx, cz, obstacles }
  if (chunkCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = chunkCache.keys().next().value
    if (oldest !== undefined) chunkCache.delete(oldest)
  }
  chunkCache.set(cacheKey, chunk)
  return chunk
}

/** Chunks (and their obstacles) visible around a world point, per VISIBILITY_RADIUS. */
export function chunksAround(seed: string, centerX: number, centerZ: number): Chunk[] {
  const { cx: ccx, cz: ccz } = chunkAt(centerX, centerZ)
  const chunks: Chunk[] = []
  for (let dx = -VISIBILITY_RADIUS; dx <= VISIBILITY_RADIUS; dx++) {
    for (let dz = -VISIBILITY_RADIUS; dz <= VISIBILITY_RADIUS; dz++) {
      chunks.push(buildChunk(seed, ccx + dx, ccz + dz))
    }
  }
  return chunks
}
