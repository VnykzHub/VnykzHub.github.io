// Endless terrain
export const CHUNK_SIZE = 40
export const VISIBILITY_RADIUS = 1 // 3x3 chunk window around the pack
export const SAFE_ZONE_RADIUS = 7 // keep the world origin clear so agents never spawn inside geometry
export const OBSTACLE_MIN_PER_CHUNK = 3
export const OBSTACLE_MAX_PER_CHUNK = 7
export const OBSTACLE_MIN_RADIUS = 1.1
export const OBSTACLE_MAX_RADIUS = 2.5

// Movement
export const PREY_MAX_SPEED = 8.6
export const PREDATOR_MAX_SPEED = 8.0
export const PREY_MAX_FORCE = 26
export const PREDATOR_MAX_FORCE = 24
export const FIXED_DT = 1 / 60

// Encounter thresholds
export const CAPTURE_RADIUS = 1.3
export const CLOSE_CALL_RADIUS = 3.5
export const RESPAWN_MIN_DIST = 18
export const RESPAWN_MAX_DIST = 30

// Sensing
export const WHISKER_LOOKAHEAD = 6.5
export const WHISKER_ANGLES = [0, 0.5, -0.5, 1.0, -1.0]
export const OBSTACLE_AVOID_WEIGHT = 46
export const TEAM_SEPARATION_WEIGHT = 14
export const TEAM_SEPARATION_RADIUS = 9
export const WANDER_WEIGHT = 3.2

/**
 * Reward-shaping weights, mirrored from the project spec's formulas
 * (Reward = w1*Δdistance - w2*time + captureBonus, etc). v1's agents are
 * scripted steering behaviors, not a trained policy, so these numbers
 * don't drive any behavior yet — they only shape the reward figure that
 * gets attached to each telemetry frame, so the schema a future learned
 * Brain would train against already exists and is exercised every frame.
 * See docs/superpowers/plans/2026-09-13-apiary-apex-simulation.md.
 */
export const REWARD_PREDATOR_DISTANCE_WEIGHT = 1
export const REWARD_PREDATOR_TIME_PENALTY = 0.01
export const REWARD_PREDATOR_CAPTURE_BONUS = 1000
export const REWARD_PREY_SURVIVAL_WEIGHT = 0.05
export const REWARD_PREY_DISTANCE_WEIGHT = 0.2
export const REWARD_PREY_CAUGHT_PENALTY = 1000
