

export const GAME_CONFIG = {
  WORLD: {
      SPEED: 0.5,
      INTERACTION_RADIUS: 60
  },
  LAND: {
    INITIAL_RESOURCE: 0,
    GROWTH_PER_WATER: 50,
    MAX_RESOURCE: 100,
    STAGE_1_THRESHOLD: 50,
    STAGE_2_THRESHOLD: 100,
    DECAY_TIMEOUT_MS: 120000, // 2 minutes in milliseconds
    COLORS: {
      EMPTY: 'bg-yellow-200',
      GROWING: 'bg-pink-300',
      READY: 'bg-green-400'
    }
  },
  BIOBOT: {
    // Energy Decay Rate (Calculated for ~60FPS)
    // 0.008 per tick * 120 ticks (2s) ~= 0.96 (approx 1% every 2s)
    ENERGY_DECAY_IDLE: 0.008, 
    ENERGY_DECAY_WORK: 0.02, 
    ENERGY_DECAY_MOVE: 0.012, 
    ENERGY_RECHARGE_RATE: 0.8, // Energy gained per tick
    FEEDING_RADIUS: 80,
    MAX_ENERGY: 100,
    WORK_DURATION_MS: 180000 // 3 minutes work duration
  },
  INTRUDER: {
      SPEED: 0.6, // Slow speed: They spawn at edge and take time to travel to center
      STEAL_RATE_PER_SEC: 5, // 5 Crypto per second
      ATTACK_RADIUS: 80, // Same as wallet radius basically
      SPAWN_RATIO: 2, // 2 Intruders per Biobot
      SIZE: 40,
      EXPLOSION_DURATION_MS: 1000, // Time for explosion animation
      MAX_CONCURRENT: 15 // Performance Cap: Max intruders allowed at once
  },
  TORNADO: {
      SPEED: 1.2, // Fast, erratic movement
      DESTRUCTION_RADIUS: 40, // Similar to crop size
      MIN_DURATION_MS: 10000,
      MAX_DURATION_MS: 90000,
      SPAWN_INTERVAL_MS: 45000, // Approx every 45s in Level 3
      MAX_CONCURRENT: 2
  },
  BLACK_HOLE: {
      SPEED: 0.6, // Slow, inevitable movement
      EVENT_HORIZON_RADIUS: 45, // Large kill radius
      MIN_DURATION_MS: 10000,
      MAX_DURATION_MS: 90000,
      // Spawning 5-10 times in a "level". Assuming level lasts ~5-10 mins.
      // Every ~60s implies ~10 spawns in 10 mins.
      SPAWN_INTERVAL_MS: 60000, 
      MAX_CONCURRENT: 1 // Only one at a time usually
  },
  COMBAT: {
      MIN_DISTANCE: 150, // Range at 0% energy
      MAX_DISTANCE: 450, // Range at 100% energy
      DEFENSE_RADIUS: 250, // Range for Guardian Mode detection
      MIN_DURATION_MS: 5000, // Duration at 100% energy (Efficient/Fast kill)
      MAX_DURATION_MS: 20000, // Duration at 0% energy (Inefficient/Slow kill)
      KILL_COST: 1, // Cost deducted from Player Points when an intruder is destroyed
      SPECIAL_ATTACK: {
          COST: 50,
          MIN_VITALITY: 90,
          DURATION_MS: 2000, // How long the giant animation lasts
          SCALE_FACTOR: 20
      }
  },
  CROP: {
    CONSUMPTION_RATE: 0.08, // Significantly reduced resource consumption per tick
  },
  SCORING: {
      // Points per frame (assuming ~60fps) to reach target per second approximation
      GREEN_TICK: 1.66, // ~100 points per second
      PINK_TICK: 0.83,  // ~50 points per second
      YELLOW_TICK: 0.16 // ~10 points per second
  },
  DEATH: {
      ENABLE_AUTO_DEATH: true,
      ENABLE_MANUAL_KILL: true,
      TIME_TO_DIE_MS: 600000, // 10 minutes at 0% energy before death
      TIME_FROZEN_MS: 300000, // 5 minutes frozen on canvas before fading
      FADE_DURATION_MS: 5000, // Duration of fade out effect
  },
  STRUCTURES: {
      GRID_SIZE: 40, // 40px blocks
      PRICES: {
          FIREWALL: 100, // Updated to 100
          ENCRYPTION: 30  // Updated to 30
      },
      DURABILITY: {
          FIREWALL: 30000, // 30 seconds (Madera)
          ENCRYPTION: 60000 // 60 seconds (Metal/Gris)
      }
  },
  COSTS: {
      NEW_LAND: 500,
      RECHARGE: 30,
      NEW_BIOBOT: 70
  },
  LEVELS: {
      LVL2: { MIN_CRYPTO: 8000, MIN_ENERGY: 400 },
      LVL3: { MIN_CRYPTO: 16000, MIN_ENERGY: 800 },
      LVL4: { MIN_CRYPTO: 30000, MIN_ENERGY: 1500 },
      LVL5: { MIN_CRYPTO: 50000, MIN_ENERGY: 3000 },
      LVL6: { MIN_CRYPTO: 80000, MIN_ENERGY: 5000 },
      LVL7: { MIN_CRYPTO: 120000, MIN_ENERGY: 8000 },
      LVL8: { MIN_CRYPTO: 180000, MIN_ENERGY: 12000 },
      LVL9: { MIN_CRYPTO: 250000, MIN_ENERGY: 18000 },
      LVL10: { MIN_CRYPTO: 350000, MIN_ENERGY: 25000 }
  },
  GHOST_SYSTEM: {
      START_LEVEL: 2,
      MAX_CONCURRENT: 2,
      MIN_INTERVAL_MS: 120000, // 2 minutes base min
      MAX_INTERVAL_MS: 300000, // 5 minutes base max
      DYNAMIC: {
          REDUCTION_MS_PER_BOT: 5000, // Reduce wait time by 5s per active bot
          MIN_HARD_CAP_MS: 30000      // Never spawn faster than every 30s
      }
  },
  EVOLUTION: {
      MINING_THRESHOLD: 5, // Betas evolve after mining 5 times
      COMBAT_THRESHOLD: 3, // Alfas evolve after killing 3 intruders
      AGE_THRESHOLD: 20,   // Age based evolution (fallback)
      SPEED_MULTIPLIER: 1.8, // Nearly double speed
      SIZE_MULTIPLIER: 2.0   // Double size
  }
};