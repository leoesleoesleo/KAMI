
export enum EntityType {
  PERSON = 'PERSON',
  LAND = 'LAND',
  WALLET = 'WALLET',
  BLOCK = 'BLOCK', // New Entity Type
}

export enum BlockType {
  FIREWALL = 'FIREWALL',
  ENCRYPTION = 'ENCRYPTION'
}

export enum Gender {
  MALE = 'Masculino',
  FEMALE = 'Femenino',
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

export interface EntityAttributes {
  nombre: string;
  sexo: Gender;
  edad: number;
  energia: number; // 0-100
  estado: 'ocioso' | 'trabajando' | 'caminando' | 'socializando' | 'alimentandose' | 'muerto';
  workEndTime?: number; // Timestamp when work finishes
  personalidad: string;
  fuerza: number;
  inteligencia: number;
  individualScore: number;
  // Death Mechanics
  zeroEnergySince?: number; // Timestamp when energy hit 0
  deathTimestamp?: number; // Timestamp when death occurred
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
  isWatering: boolean; 
  entities: GameEntity[];
  player: PlayerState;
  level: number; // New Level Tracking
  isLogViewerOpen?: boolean; // New state for Log Viewer
}

export const INITIAL_POINTS = 50;
export const ACTION_COST = 10;

// --- KAMI-LOG SYSTEM TYPES ---

export enum EventType {
  BIOBOT_CREATED = 'BIOBOT_CREATED',
  BIOBOT_DEATH = 'BIOBOT_DEATH',
  BIOBOT_STATE_CHANGE = 'BIOBOT_STATE_CHANGE',
  LAND_CREATED = 'LAND_CREATED',
  LAND_DECAYED = 'LAND_DECAYED',
  LAND_WATERED = 'LAND_WATERED',
  BLOCK_PLACED = 'BLOCK_PLACED', // New Event
  USER_ACTION = 'USER_ACTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum EventCategory {
  LIFECYCLE = 'LIFECYCLE',
  ECONOMY = 'ECONOMY',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  CONSTRUCTION = 'CONSTRUCTION' // New Category
}

export enum EventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface LogEvent {
  id: string;
  timestamp: number;
  type: EventType;
  category: EventCategory;
  severity: EventSeverity;
  payload: any;
}

export interface LogSummary {
  batchId: string;
  timeRange: { start: number; end: number };
  metrics: {
    eventsProcessed: number;
    criticalEvents: number;
    typesCount: Record<string, number>;
  };
}

export interface KamiLogDatabase {
  metadata: {
    version: string;
    sessionId: string;
    createdAt: number;
    exportTime?: number;
  };
  shortTermMemory: LogEvent[];
  longTermMemory: LogSummary[];
}