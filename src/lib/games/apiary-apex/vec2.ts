export interface Vec2 {
  x: number
  z: number
}

export const v2 = (x: number, z: number): Vec2 => ({ x, z })

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, z: a.z + b.z })
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, z: a.z - b.z })
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, z: a.z * s })
export const length = (a: Vec2): number => Math.hypot(a.x, a.z)
export const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z)

export const normalize = (a: Vec2): Vec2 => {
  const len = length(a)
  return len > 1e-6 ? scale(a, 1 / len) : v2(0, 0)
}

export const limit = (a: Vec2, max: number): Vec2 => {
  const len = length(a)
  return len > max ? scale(a, max / len) : a
}

export const rotate = (a: Vec2, angle: number): Vec2 => ({
  x: a.x * Math.cos(angle) - a.z * Math.sin(angle),
  z: a.x * Math.sin(angle) + a.z * Math.cos(angle),
})

export const fromAngle = (angle: number, len = 1): Vec2 => v2(Math.cos(angle) * len, Math.sin(angle) * len)
