
export const GAME_CONFIG = {
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
    // Energy Decay Rate (Lower value = Slower energy loss)
    ENERGY_DECAY_IDLE: 0.02, 
    ENERGY_DECAY_WORK: 0.08, 
    ENERGY_DECAY_MOVE: 0.04, 
    ENERGY_RECHARGE_RATE: 0.8, // Energy gained per tick
    FEEDING_RADIUS: 80,
    MAX_ENERGY: 100,
    WORK_DURATION_MS: 180000 // 3 minutes work duration
  },
  CROP: {
    CONSUMPTION_RATE: 0.3, // Resources lost per tick per bot feeding
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
          FIREWALL: 1000,
          ENCRYPTION: 500
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
  }
};
