
export enum EntityType {
  PERSON = 'PERSON',
  LAND = 'LAND',
  WALLET = 'WALLET',
  BLOCK = 'BLOCK',
  INTRUDER = 'INTRUDER', 
  AGENT = 'AGENT', 
  TORNADO = 'TORNADO', 
  BLACK_HOLE = 'BLACK_HOLE', 
  EXPLOSION = 'EXPLOSION', 
}

export enum BlockType {
  FIREWALL = 'FIREWALL',
  ENCRYPTION = 'ENCRYPTION'
}

export enum Gender {
  MALE = 'ALFA', 
  FEMALE = 'BETA', 
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface LandAttributes {
  resourceLevel: number; 
  emptySince?: number; 
  isGhost?: boolean; 
}

export interface BlockAttributes {
    type: BlockType;
    durability: number;
    variant?: number; 
}

export interface IntruderAttributes {
    state: 'seeking' | 'attacking' | 'attacking_structure'; 
    targetId: string; 
    attackStartTime?: number; 
    tentaclePhase: number; 
    isEngaged?: boolean; 
    isDying?: boolean; 
    deathTimestamp?: number; 
}

export interface AgentAttributes {
    state: 'seeking' | 'attacking';
    targetId?: string; 
    combatTargetPosition?: Vector2; 
    lastShotTime?: number; 
    currentAttackStart?: number; 
    isDying?: boolean; 
    deathTimestamp?: number; // Añadido para secuencia de destrucción
}

export interface TornadoAttributes {
    creationTime: number;
    duration: number; 
    wanderAngle: number; 
}

export interface BlackHoleAttributes {
    creationTime: number;
    duration: number;
    moveAngle: number;
}

export interface ExplosionAttributes {
    creationTime: number;
    duration: number;
    radius: number;
}

export interface EntityAttributes {
  nombre: string;
  sexo: Gender;
  edad: number;
  energia: number; 
  estado: 'ocioso' | 'trabajando' | 'caminando' | 'socializando' | 'alimentandose' | 'muerto' | 'peleando' | 'cazando' | 'recolectando'; 
  workEndTime?: number; 
  personalidad: string;
  fuerza: number;
  inteligencia: number;
  individualScore: number;
  holdingCryptos: number; 
  evolutionLevel: number; 
  jobsCompleted: number; 
  kills: number; 
  combatMode?: 'hunter' | 'guardian'; 
  workMode?: 'miner' | 'collector'; 
  zeroEnergySince?: number; 
  deathTimestamp?: number; 
  combatTargetId?: string;
  combatTargetPosition?: Vector2;
  combatEndTime?: number;
  isPerformingSpecial?: boolean; 
  workTargetId?: string; 
  workTargetPosition?: Vector2; 
  lastJobIncrement?: number; 
}

export interface GameEntity {
  id: string;
  type: EntityType;
  position: Vector2;
  targetPosition?: Vector2;
  velocity?: Vector2;
  attributes?: EntityAttributes; 
  landAttributes?: LandAttributes; 
  blockAttributes?: BlockAttributes; 
  intruderAttributes?: IntruderAttributes; 
  agentAttributes?: AgentAttributes; 
  tornadoAttributes?: TornadoAttributes; 
  blackHoleAttributes?: BlackHoleAttributes; 
  explosionAttributes?: ExplosionAttributes; 
  avatarUrl?: string;
  createdAt: number;
}

export interface PlayerStats {
  entitiesCreated: number;
  manaSpent: number;
  landsCreated: number;
  cryptoSpent: number; 
}

export interface PlayerState {
  name: string;
  avatarUrl: string;
  points: number;
  stats: PlayerStats;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean; 
  isWatering: boolean; 
  entities: GameEntity[];
  player: PlayerState;
  level: number; 
  isLogViewerOpen?: boolean; 
  hasSpawnedIntruders?: boolean; 
}

export const INITIAL_POINTS = 50;
export const ACTION_COST = 10;
