

export enum EntityType {
  PERSON = 'PERSON',
  LAND = 'LAND',
  WALLET = 'WALLET',
  BLOCK = 'BLOCK',
  INTRUDER = 'INTRUDER', // New Entity Type: Matrix Sentinel
}

export enum BlockType {
  FIREWALL = 'FIREWALL',
  ENCRYPTION = 'ENCRYPTION'
}

export enum Gender {
  MALE = 'ALFA', // Replaced Masculino
  FEMALE = 'BETA', // Replaced Femenino
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface LandAttributes {
  resourceLevel: number; // 0 - 100
  emptySince?: number; // Timestamp when resource became 0
  isGhost?: boolean; // Flag for auto-generated ghost servers
}

export interface BlockAttributes {
    type: BlockType;
    durability: number;
    variant?: number; // For visual variety
}

export interface IntruderAttributes {
    state: 'seeking' | 'attacking' | 'attacking_structure'; // Added attacking_structure state
    targetId: string; // Usually the Core Wallet ID or Block ID
    attackStartTime?: number; // Timestamp when attack on structure started
    tentaclePhase: number; // For animation
    isEngaged?: boolean; // Stopped by combat
    isDying?: boolean; // Exploding sequence
    deathTimestamp?: number; // When death started
}

export interface EntityAttributes {
  nombre: string;
  sexo: Gender;
  edad: number;
  energia: number; // 0-100
  estado: 'ocioso' | 'trabajando' | 'caminando' | 'socializando' | 'alimentandose' | 'muerto' | 'peleando';
  workEndTime?: number; // Timestamp when work finishes
  personalidad: string;
  fuerza: number;
  inteligencia: number;
  individualScore: number;
  holdingCryptos: number; // New: Crypto currently carried by the bot, not yet deposited
  // Death Mechanics
  zeroEnergySince?: number; // Timestamp when energy hit 0
  deathTimestamp?: number; // Timestamp when death occurred
  // Combat Mechanics
  combatTargetId?: string;
  combatTargetPosition?: Vector2;
  combatEndTime?: number;
}

export interface GameEntity {
  id: string;
  type: EntityType;
  position: Vector2;
  targetPosition?: Vector2;
  velocity?: Vector2;
  attributes?: EntityAttributes; // Only for people
  landAttributes?: LandAttributes; // Only for land
  blockAttributes?: BlockAttributes; // Only for blocks
  intruderAttributes?: IntruderAttributes; // Only for intruders
  avatarUrl?: string;
  createdAt: number;
}

export interface PlayerStats {
  entitiesCreated: number;
  manaSpent: number;
  landsCreated: number;
  cryptoSpent: number; // New field for exchange history
}

export interface PlayerState {
  name: string;
  avatarUrl: string;
  points: number;
  stats: PlayerStats;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean; // New Pause State
  isWatering: boolean; 
  entities: GameEntity[];
  player: PlayerState;
  level: number; // New Level Tracking
  isLogViewerOpen?: boolean; // New state for Log Viewer
  hasSpawnedIntruders?: boolean; // Flag to prevent multiple waves at level 3
}

export const INITIAL_POINTS = 50;
export const ACTION_COST = 10;
