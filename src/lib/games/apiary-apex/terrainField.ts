import type { Vec2 } from './vec2'
import * as C from './config'

/** Deterministic hash of a lattice point to [0,1) — the noise's random seed corners. */
function hashLattice(key: string, ix: number, iz: number): number {
  let h = 2166136261 >>> 0
  const str = `${key}|${ix},${iz}`
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h >>>= 0
  return h / 4294967295
}

const smoothstep = (t: number): number => t * t * (3 - 2 * t)

/** Smooth, continuous value noise (bilinear-interpolated lattice) — no library, fully deterministic. */
function valueNoise2D(key: string, x: number, z: number, cellSize: number): number {
  const gx = x / cellSize
  const gz = z / cellSize
  const ix = Math.floor(gx)
  const iz = Math.floor(gz)
  const fx = smoothstep(gx - ix)
  const fz = smoothstep(gz - iz)
  const h00 = hashLattice(key, ix, iz)
  const h10 = hashLattice(key, ix + 1, iz)
  const h01 = hashLattice(key, ix, iz + 1)
  const h11 = hashLattice(key, ix + 1, iz + 1)
  const top = h00 + (h10 - h00) * fx
  const bottom = h01 + (h11 - h01) * fx
  return top + (bottom - top) * fz
}

/** Elevation in world units — two octaves (rolling hills + smaller bumps), centered on 0. */
export function elevationAt(seed: string, x: number, z: number): number {
  const large = valueNoise2D(`${seed}|elevation`, x, z, C.ELEVATION_CELL_LARGE)
  const small = valueNoise2D(`${seed}|elevation-detail`, x, z, C.ELEVATION_CELL_SMALL)
  const n = large * 0.7 + small * 0.3
  return (n - 0.5) * 2 * C.ELEVATION_AMPLITUDE
}

/** Temperature in [0,1] — 0 is coldest, 1 is hottest. Slow-varying, biome-sized zones. */
export function temperatureAt(seed: string, x: number, z: number): number {
  return valueNoise2D(`${seed}|temperature`, x, z, C.TEMPERATURE_CELL)
}

/** Central-difference elevation gradient at a point — which way is "uphill." */
export function elevationGradient(seed: string, x: number, z: number): Vec2 {
  const eps = 0.75
  return {
    x: (elevationAt(seed, x + eps, z) - elevationAt(seed, x - eps, z)) / (2 * eps),
    z: (elevationAt(seed, x, z + eps) - elevationAt(seed, x, z - eps)) / (2 * eps),
  }
}

/** Outside the comfort band, extreme heat or cold saps speed — symmetrically, so it never favors a side. */
export function temperatureSpeedMultiplier(temperature: number): number {
  const { TEMPERATURE_COMFORT_LOW: lo, TEMPERATURE_COMFORT_HIGH: hi, TEMPERATURE_MIN_SPEED_MULT: minMult } = C
  if (temperature >= lo && temperature <= hi) return 1
  const dist = temperature < lo ? lo - temperature : temperature - hi
  const maxDist = Math.min(lo, 1 - hi)
  const t = maxDist > 0 ? Math.min(dist / maxDist, 1) : 1
  return 1 - t * (1 - minMult)
}

/** Uphill (moving toward higher elevation) slows an agent; downhill speeds it up — both capped. */
export function slopeSpeedMultiplier(seed: string, pos: Vec2, vel: Vec2): number {
  const speed = Math.hypot(vel.x, vel.z)
  if (speed < 0.05) return 1
  const grad = elevationGradient(seed, pos.x, pos.z)
  const uphill = (grad.x * vel.x + grad.z * vel.z) / speed
  const factor = Math.max(-C.SLOPE_MAX_EFFECT, Math.min(C.SLOPE_MAX_EFFECT, uphill * C.SLOPE_SENSITIVITY))
  return 1 - factor
}

/** Combined terrain speed multiplier — the one thing steering/integration actually needs to call. */
export function terrainSpeedMultiplier(seed: string, pos: Vec2, vel: Vec2): number {
  return temperatureSpeedMultiplier(temperatureAt(seed, pos.x, pos.z)) * slopeSpeedMultiplier(seed, pos, vel)
}

const COLD: [number, number, number] = [0.16, 0.32, 0.34]
const MID: [number, number, number] = [0.1, 0.22, 0.15]
const HOT: [number, number, number] = [0.34, 0.21, 0.11]

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** Cold -> mid -> hot color ramp for visualizing the temperature field on terrain. RGB in [0,1]. */
export function temperatureColor(temperature: number): [number, number, number] {
  if (temperature < 0.5) return lerp3(COLD, MID, temperature / 0.5)
  return lerp3(MID, HOT, (temperature - 0.5) / 0.5)
}
