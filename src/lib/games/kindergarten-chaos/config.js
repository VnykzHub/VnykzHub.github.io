// Game configuration constants

export const GAME_CONFIG = {
  // Canvas dimensions
  width: 800,
  height: 600,
  
  // Gameplay settings
  fps: 60,
  waveDuration: 30, // seconds between waves
  startingPatience: 100,
  patienceDrainRate: 0.2, // per frame when touched by kindergartner
  startingStamina: 100,
  staminaDrainRate: 0.5, // per frame when running
  staminaRegenRate: 0.2, // per frame when not using stamina
  dogpileThreshold: 3, // number of kids that constitute a dogpile
  dogpileTime: 15, // seconds of dogpile before game over
  
  // Player settings
  player: {
    size: 32,
    walkSpeed: 3,
    runSpeed: 5,
    pushRange: 40,
    pushCooldown: 45, // frames
    pushDuration: 15, // frames
    dodgeSpeed: 8,
    dodgeDuration: 20, // frames
    dodgeCooldown: 60, // frames
    dodgeStaminaCost: 30,
  },
  
  // Kindergartner settings
  kindergartners: {
    standard: {
      size: 24,
      speed: 1.2,
      health: 1,
      damage: 0.2,
      spawnRate: 1.0, // relative to base rate
    },
    painter: {
      size: 24,
      speed: 1.0,
      health: 1,
      damage: 0.2,
      spawnRate: 0.7,
      puddleFrequency: 120, // frames between puddles
      puddleDuration: 300, // frames puddle lasts
    },
    napDodger: {
      size: 24,
      speed: 1.8,
      health: 1,
      damage: 0.2,
      spawnRate: 0.5,
    },
    snackStealer: {
      size: 24,
      speed: 1.3,
      health: 1,
      damage: 0.2,
      spawnRate: 0.6,
      projectileFrequency: 180, // frames between throws
      projectileSpeed: 3,
      projectileDuration: 60, // frames
    },
    classPet: {
      size: 32,
      speed: 0.9,
      health: 3,
      damage: 0.3,
      spawnRate: 0.2,
      commandFrequency: 240, // frames between commands
      commandBoost: 1.2, // speed multiplier for other kids
      commandDuration: 120, // frames boost lasts
    }
  },
  
  // Wave settings
  waveDifficulty: {
    baseCount: 5, // base number of kindergartners per wave
    countIncreasePerWave: 1, // additional kindergartners per wave
    maxCount: 25, // maximum number of kindergartners in a wave
    typesUnlockSchedule: {
      1: ['standard'],
      3: ['standard', 'painter'],
      5: ['standard', 'painter', 'napDodger'],
      7: ['standard', 'painter', 'napDodger', 'snackStealer'],
    },
    classPetWaves: [5, 10, 15, 20], // waves that include a class pet
    scoreMultiplier: 100, // points per kindergartner
    waveCompletionBonus: 500, // base points for completing a wave
  },
  
  // Environment settings
  environment: {
    tileSize: 16,
    deskSize: 30,
    puddleSlowFactor: 0.5, // player speed multiplier in puddles
    projectileSlowDuration: 120, // frames player is slowed after hit by projectile
  },
  
  // UI settings
  ui: {
    healthBarColors: {
      good: '#3c3',
      medium: '#fc3',
      low: '#f33',
    },
    staminaBarColor: '#38f',
  },
  
  // Debug settings
  debug: {
    showHitboxes: false,
    invincible: false,
    unlimitedStamina: false,
  }
};

export default GAME_CONFIG;