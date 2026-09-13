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
export const AGENT_COLLISION_RADIUS = 0.55 // how much "body" an agent has against obstacle geometry

// Visual flight character (rendering only — doesn't feed back into physics):
// yaw is turn-rate-limited rather than snapped instantly, which in turn gives
// a well-defined turn rate to bank into; pitch follows the ground slope
// under the current heading. Both are smoothed a bit further on top.
export const FLIGHT_MAX_TURN_RATE = 9 // rad/s cap on visual yaw change
export const FLIGHT_BANK_GAIN = 0.16
export const FLIGHT_MAX_BANK = 0.55 // rad, ~31°
export const FLIGHT_PITCH_GAIN = 0.5
export const FLIGHT_MAX_PITCH = 0.35 // rad, ~20°
export const FLIGHT_SMOOTHING = 10 // higher = snappier bank/pitch response

// Terrain field — elevation and temperature, both deterministic smooth value
// noise (two octaves for elevation, one for temperature's slower-varying
// zones). Neither is cosmetic: elevation creates real uphill/downhill drag
// via its gradient, and temperature imposes a "comfort band" outside which
// everyone (hunters and prey alike, symmetrically — this isn't meant to
// favor a side) slows down. Ground meshes and obstacle placement both read
// elevationAt() so what you see lines up with what agents feel.
export const HOVER_HEIGHT = 0.6
export const ELEVATION_AMPLITUDE = 3.2
export const ELEVATION_CELL_LARGE = 34
export const ELEVATION_CELL_SMALL = 11
export const TEMPERATURE_CELL = 58
export const TEMPERATURE_COMFORT_LOW = 0.35
export const TEMPERATURE_COMFORT_HIGH = 0.65
export const TEMPERATURE_MIN_SPEED_MULT = 0.72
export const SLOPE_SENSITIVITY = 0.5
export const SLOPE_MAX_EFFECT = 0.28

/**
 * The two hunters race each other, not just the survivor: whichever is
 * currently farther from the prey gets a speed bonus proportional to how far
 * behind it is, capped at RIVALRY_MAX_BOOST once the gap reaches
 * RIVALRY_MAX_DIFF. This makes the lead swap back and forth visibly instead
 * of one hunter settling into a permanent front position.
 */
export const RIVALRY_MAX_BOOST = 0.22
export const RIVALRY_MAX_DIFF = 10

/**
 * A periodic reward tick layered on top of the continuous per-step reward:
 * every MILESTONE_INTERVAL seconds the prey survives, it banks a bonus and
 * both hunters take a penalty — reinforcing "don't let the chase drag on"
 * independent of the moment-to-moment distance reward.
 */
export const MILESTONE_INTERVAL = 60
export const MILESTONE_PREY_BONUS = 40
export const MILESTONE_PREDATOR_PENALTY = 40

/**
 * Pacing. Measured against the pre-tuning build: capture gaps ranged from
 * 2.8s (an instant re-catch right after respawn — feels cheap) to 162s (a
 * long dead stretch with nothing happening — feels broken). Two knobs fix
 * both tails without touching the steering itself:
 *  - a brief post-capture window where the hunters have "lost the trail"
 *    (reduced force), so a fresh respawn always gets a beat to react; and
 *  - a mild speed/force ramp-up the longer the current chase runs, so an
 *    unusually lucky escape streak can't go on forever.
 * Both ramp linearly and reset every capture, so nothing here is a hard cliff.
 */
export const POST_CAPTURE_CONFUSION_DURATION = 1.8
export const POST_CAPTURE_CONFUSION_FORCE_FACTOR = 0.35
// Retuned after adding terrain drag, obstacle collision, and hunter rivalry:
// those made evasion genuinely more effective (real cover, real slowdowns),
// which pushed capture gaps back up (avg ~41-50s, worst case ~134s,
// measured). Ramping faster and harder pulls the worst case back down
// without touching the mechanics that caused it.
export const TENSION_RAMP_TIME = 45
export const TENSION_RAMP_MAX_BONUS = 0.26
// A hard floor under the confusion window: even a hunter that's already
// close to the respawn point can't re-trigger a capture for this long.
// Softer confusion-only tuning still let an unlucky respawn get re-caught
// in ~3s during pacing analysis; this guarantees every chase gets a beat.
export const POST_RESPAWN_IMMUNITY = 1.2

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
