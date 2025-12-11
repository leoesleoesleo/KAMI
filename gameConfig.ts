

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
      EXPLOSION_DURATION_MS: 1000 // Time for explosion animation
  },
  COMBAT: {
      MIN_DISTANCE: 150, // Range at 0% energy
      MAX_DISTANCE: 450, // Range at 100% energy
      MIN_DURATION_MS: 5000, // Duration at 100% energy (Efficient/Fast kill)
      MAX_DURATION_MS: 20000, // Duration at 0% energy (Inefficient/Slow kill)
      KILL_COST: 1 // Cost deducted from Player Points when an intruder is destroyed
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
          FIREWALL: 8,
          ENCRYPTION: 5
      },
      DURABILITY: {
          FIREWALL: 30000, // 30 seconds (Madera)
          ENCRYPTION: 60000 // 60 seconds (Metal/Gris)
      }
  },
  LEVELS: {
      LVL2: {
          MIN_CRYPTO: 8000,
          MIN_ENERGY: 400
      },
      LVL3: {
          MIN_CRYPTO: 16000,
          MIN_ENERGY: 800
      }
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
  }
};