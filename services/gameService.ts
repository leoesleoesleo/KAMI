

import { EntityAttributes, Gender, Vector2, EntityType, GameEntity, LandAttributes, BlockType } from '../types';
import { WORLD_SIZE } from '../constants';
import { GAME_CONFIG } from '../gameConfig';

// --- DATA CONSTANTS ---
const NAMES_MALE = ["X-1", "Kryon", "Zet", "Aron-9", "Vector", "Helix", "Cobalt", "Neon", "Flux", "Titan"];
const NAMES_FEMALE = ["Aura", "Nova", "Sila", "Vea-7", "Luma", "Iris", "Echo", "Mirage", "Prisma", "Solaris"];
const PERSONALITIES = ["Lógico", "Protector", "Curioso", "Eficiente", "Místico", "Líder", "Creativo", "Guardián"];

export const WALLET_CENTER = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
// Radius = Wallet Visual Radius (~40px) + Object Radius (~25px) + Padding (~25px)
export const WALLET_SAFE_RADIUS = 90; 
// Collision Radius for Physics
const BIOBOT_COLLISION_RADIUS = 15;
const INTRUDER_COLLISION_RADIUS = 15;
const BLOCK_COLLISION_RADIUS = 25; // Effectively covers the 40px grid size loosely

// --- UTILITY FUNCTIONS ---

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getEntitySeed = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    return Math.abs(hash);
};

export const snapToGrid = (position: Vector2): Vector2 => {
    const size = GAME_CONFIG.STRUCTURES.GRID_SIZE;
    return {
        x: Math.round(position.x / size) * size,
        y: Math.round(position.y / size) * size
    };
};

export const generateRandomPosition = (center: Vector2, radius: number = 200): Vector2 => {
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * radius;
  return {
    x: Math.max(0, Math.min(WORLD_SIZE, center.x + r * Math.cos(angle))),
    y: Math.max(0, Math.min(WORLD_SIZE, center.y + r * Math.sin(angle))),
  };
};

/**
 * Ensures a position is outside the central Core Wallet radius.
 * If inside, pushes it to the edge.
 */
export const ensureOutsideWallet = (position: Vector2): Vector2 => {
    const dx = position.x - WALLET_CENTER.x;
    const dy = position.y - WALLET_CENTER.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < WALLET_SAFE_RADIUS) {
        const angle = Math.atan2(dy, dx);
        return {
            x: WALLET_CENTER.x + Math.cos(angle) * WALLET_SAFE_RADIUS,
            y: WALLET_CENTER.y + Math.sin(angle) * WALLET_SAFE_RADIUS
        };
    }
    return position;
};

// Generates a random position on the edge of the map
export const generateRandomEdgePosition = (): Vector2 => {
    const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    const padding = 20;
    
    switch (side) {
        case 0: // Top
            return { x: Math.random() * WORLD_SIZE, y: padding };
        case 1: // Right
            return { x: WORLD_SIZE - padding, y: Math.random() * WORLD_SIZE };
        case 2: // Bottom
            return { x: Math.random() * WORLD_SIZE, y: WORLD_SIZE - padding };
        case 3: // Left
            return { x: padding, y: Math.random() * WORLD_SIZE };
        default:
            return { x: padding, y: padding };
    }
};

export const createWalletEntity = (): GameEntity => {
    return {
        id: 'CORE-WALLET-001', // Singleton ID
        type: EntityType.WALLET,
        position: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
        createdAt: Date.now()
    };
};

export const createBlockEntity = (type: BlockType, position: Vector2): GameEntity => {
    // Snap position to grid immediately upon creation
    const snappedPos = snapToGrid(position);
    
    const entity = {
        id: generateUUID(),
        type: EntityType.BLOCK,
        position: snappedPos,
        blockAttributes: {
            type,
            durability: type === BlockType.FIREWALL ? GAME_CONFIG.STRUCTURES.DURABILITY.FIREWALL : GAME_CONFIG.STRUCTURES.DURABILITY.ENCRYPTION,
            variant: Math.floor(Math.random() * 3) // 0-2 for visual variations
        },
        createdAt: Date.now()
    };

    return entity;
};

// New Helper for Weighted Gender Probability (70% ALFA, 30% BETA)
export const getRandomGender = (): Gender => {
    return Math.random() < 0.7 ? Gender.MALE : Gender.FEMALE;
};

export const createPersonJSON = (gender: Gender, customName?: string): EntityAttributes => {
  const nameList = gender === Gender.MALE ? NAMES_MALE : NAMES_FEMALE;
  const name = customName || nameList[Math.floor(Math.random() * nameList.length)];

  return {
    nombre: name,
    sexo: gender,
    edad: 1 + Math.floor(Math.random() * 10),
    energia: 100,
    estado: 'ocioso',
    personalidad: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
    fuerza: Math.floor(Math.random() * 10) + 1,
    inteligencia: Math.floor(Math.random() * 10) + 1,
    individualScore: 0,
    holdingCryptos: 0, // New attribute for carry capacity
    // Evolution Stats
    evolutionLevel: 1,
    jobsCompleted: 0,
    kills: 0,
    combatMode: 'hunter', // Default mode for Alfas
    workMode: 'miner' // Default mode for Betas
  };
};

export const createPersonEntity = (attributes: EntityAttributes, position: Vector2): GameEntity => {
  // Palette for ALFA (Males): Darker Golds, Ochres, Industrial Yellows
  const MALE_YELLOWS = ["eab308", "ca8a04", "a16207", "facc15", "fbbf24"]; 
  // Palette for BETA (Females): Light Pastels, Lemons, Creams
  const FEMALE_YELLOWS = ["fef08a", "fde047", "facc15", "fffbeb", "fef9c3"];

  const colorPalette = attributes.sexo === Gender.MALE ? MALE_YELLOWS.join(',') : FEMALE_YELLOWS.join(',');
  const seedPrefix = attributes.sexo === Gender.MALE ? "mech-" : "bio-";
  
  const avatarSeed = `${seedPrefix}${attributes.nombre}-${Math.random()}`;
  
  // Note: 'baseColor' is supported by bottts v9 to set the main color
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}&baseColor=${colorPalette}&backgroundColor=transparent`;

  const entity = {
    id: generateUUID(),
    type: EntityType.PERSON,
    position,
    attributes,
    avatarUrl,
    createdAt: Date.now(),
  };

  return entity;
};

export const createLandEntity = (position: Vector2): GameEntity => {
  const entity = {
    id: generateUUID(),
    type: EntityType.LAND,
    position,
    landAttributes: {
        // FIX: Start with 30 resources to allow immediate mining (Cold Start Fix)
        resourceLevel: 30, 
        emptySince: undefined // Not empty initially
    },
    createdAt: Date.now(),
  };
  
  return entity;
};

export const createGhostNode = (): GameEntity => {
    // Generate completely random position in the world
    const x = Math.random() * (WORLD_SIZE - 200) + 100;
    const y = Math.random() * (WORLD_SIZE - 200) + 100;
    
    // Ensure it doesn't spawn inside the wallet
    const safePos = ensureOutsideWallet({ x, y });
    
    // Create base entity
    const entity = createLandEntity(safePos);
    
    // Assign random initial resources: Yellow (0), Pink (50), Green (100)
    const possibleLevels = [0, GAME_CONFIG.LAND.STAGE_1_THRESHOLD, GAME_CONFIG.LAND.STAGE_2_THRESHOLD];
    const resourceLevel = possibleLevels[Math.floor(Math.random() * possibleLevels.length)];
    
    if (entity.landAttributes) {
        entity.landAttributes.resourceLevel = resourceLevel;
        entity.landAttributes.isGhost = true;
        // If it has resources, clear the empty timer so it doesn't decay immediately if 0
        if (resourceLevel > 0) {
            entity.landAttributes.emptySince = undefined;
        }
    }

    return entity;
};

export const createIntruderEntity = (): GameEntity => {
    // UPDATED LOGIC: Spawn on the absolute edge of the map
    const position = generateRandomEdgePosition();
    
    const entity: GameEntity = {
        id: generateUUID(),
        type: EntityType.INTRUDER,
        position,
        intruderAttributes: {
            state: 'seeking',
            targetId: 'CORE-WALLET-001',
            tentaclePhase: Math.random() * 10
        },
        createdAt: Date.now()
    };

    return entity;
};

export const createTornadoEntity = (): GameEntity => {
    const position = generateRandomPosition(WALLET_CENTER, WORLD_SIZE / 2 - 50); // Anywhere on map
    const minDur = GAME_CONFIG.TORNADO.MIN_DURATION_MS;
    const maxDur = GAME_CONFIG.TORNADO.MAX_DURATION_MS;
    const duration = Math.floor(Math.random() * (maxDur - minDur + 1)) + minDur;

    return {
        id: generateUUID(),
        type: EntityType.TORNADO,
        position,
        tornadoAttributes: {
            creationTime: Date.now(),
            duration: duration,
            wanderAngle: Math.random() * Math.PI * 2
        },
        createdAt: Date.now()
    };
};

export const createBlackHoleEntity = (): GameEntity => {
    // Generate a random position reasonably far from the wallet to start
    const position = generateRandomPosition(WALLET_CENTER, WORLD_SIZE / 3); 
    
    const minDur = GAME_CONFIG.BLACK_HOLE.MIN_DURATION_MS;
    const maxDur = GAME_CONFIG.BLACK_HOLE.MAX_DURATION_MS;
    const duration = Math.floor(Math.random() * (maxDur - minDur + 1)) + minDur;

    return {
        id: generateUUID(),
        type: EntityType.BLACK_HOLE,
        position,
        blackHoleAttributes: {
            creationTime: Date.now(),
            duration: duration,
            moveAngle: Math.random() * Math.PI * 2 // Direction of travel
        },
        createdAt: Date.now()
    };
};

export const createExplosionEntity = (): GameEntity => {
    // Spawn near Wallet (random location in radius)
    const position = generateRandomPosition(WALLET_CENTER, GAME_CONFIG.EXPLOSION.SPAWN_RANGE);
    
    return {
        id: generateUUID(),
        type: EntityType.EXPLOSION,
        position,
        explosionAttributes: {
            creationTime: Date.now(),
            duration: GAME_CONFIG.EXPLOSION.DURATION_MS,
            radius: GAME_CONFIG.EXPLOSION.RADIUS
        },
        createdAt: Date.now()
    };
};

// --- INITIAL LEVEL 1 LAYOUT GENERATOR ---
export const generateLevel1Layout = (): GameEntity[] => {
    const center = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    const entities: GameEntity[] = [];

    // 1. Always add Core Wallet
    entities.push(createWalletEntity());

    // 2. Select Random Aesthetic Layout (0 to 9 = 10 Designs)
    const layoutType = Math.floor(Math.random() * 10);
    const GRID = GAME_CONFIG.STRUCTURES.GRID_SIZE; // 40

    // Helper to add fully charged land
    const addLand = (x: number, y: number) => {
        const land = createLandEntity({ x, y });
        if (land.landAttributes) {
            land.landAttributes.resourceLevel = 100; // Fully charged
        }
        entities.push(land);
    };

    // Helper to add Encryption Block (Yellow/Wood/Gold style)
    const addBlock = (x: number, y: number) => {
        entities.push(createBlockEntity(BlockType.ENCRYPTION, { x, y }));
    };

    if (layoutType === 0) {
        // --- LAYOUT 0: "THE IRON SQUARE" (La Fortaleza) ---
        const radius = 3;
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (Math.abs(x) === radius || Math.abs(y) === radius) {
                    addBlock(center.x + x * GRID, center.y + y * GRID);
                }
            }
        }
        const landDist = 200;
        addLand(center.x - landDist, center.y - landDist);
        addLand(center.x + landDist, center.y - landDist);
        addLand(center.x - landDist, center.y + landDist);
        addLand(center.x + landDist, center.y + landDist);

    } else if (layoutType === 1) {
        // --- LAYOUT 1: "THE DATA RING" (El Anillo de Datos) ---
        const numBlocks = 12;
        const blockRadius = 140;
        for (let i = 0; i < numBlocks; i++) {
            const angle = (i / numBlocks) * Math.PI * 2;
            addBlock(
                center.x + Math.cos(angle) * blockRadius,
                center.y + Math.sin(angle) * blockRadius
            );
        }
        const landDist = 220;
        addLand(center.x, center.y - landDist); // N
        addLand(center.x, center.y + landDist); // S
        addLand(center.x + landDist, center.y); // E
        addLand(center.x - landDist, center.y); // W

    } else if (layoutType === 2) {
        // --- LAYOUT 2: "THE X-PROTOCOL" (El Protocolo X) ---
        for (let i = 2; i <= 4; i++) {
            const d = i * GRID;
            addBlock(center.x + d, center.y + d);
            addBlock(center.x - d, center.y - d);
            addBlock(center.x + d, center.y - d);
            addBlock(center.x - d, center.y + d);
        }
        addBlock(center.x + 120, center.y);
        addBlock(center.x - 120, center.y);
        addBlock(center.x, center.y + 120);
        addBlock(center.x, center.y - 120);
        const landDist = 180;
        addLand(center.x, center.y - landDist);
        addLand(center.x, center.y + landDist);
        addLand(center.x + landDist, center.y);
        addLand(center.x - landDist, center.y);

    } else if (layoutType === 3) {
        // --- LAYOUT 3: "THE CROSS" (La Cruz) ---
        // Defensive lines on cardinal axes, lands in corners
        for (let i = 3; i <= 6; i++) {
            const dist = i * GRID;
            addBlock(center.x + dist, center.y);
            addBlock(center.x - dist, center.y);
            addBlock(center.x, center.y + dist);
            addBlock(center.x, center.y - dist);
        }
        const landDist = 160;
        addLand(center.x + landDist, center.y + landDist);
        addLand(center.x - landDist, center.y - landDist);
        addLand(center.x + landDist, center.y - landDist);
        addLand(center.x - landDist, center.y + landDist);

    } else if (layoutType === 4) {
        // --- LAYOUT 4: "THE BRACKETS" (Los Corchetes) ---
        // [ ] shape around core
        const h = 3 * GRID;
        const w = 4 * GRID;
        // Vertical lines
        for (let y = -h; y <= h; y += GRID) {
            addBlock(center.x - w, center.y + y);
            addBlock(center.x + w, center.y + y);
        }
        // Horizontal caps
        addBlock(center.x - w + GRID, center.y - h);
        addBlock(center.x - w + GRID, center.y + h);
        addBlock(center.x + w - GRID, center.y - h);
        addBlock(center.x + w - GRID, center.y + h);

        // Lands protected inside top/bottom
        addLand(center.x, center.y - 100);
        addLand(center.x, center.y + 100);
        // Lands outside sides
        addLand(center.x - 220, center.y);
        addLand(center.x + 220, center.y);

    } else if (layoutType === 5) {
        // --- LAYOUT 5: "THE DIAMOND" (El Diamante) ---
        // Rotated square
        const size = 4; // steps
        for (let i = 0; i <= size; i++) {
            const offset = i * GRID;
            const invOffset = (size - i) * GRID;
            // First quadrant
            addBlock(center.x + offset, center.y - invOffset - 40); // Shifted slightly out
            addBlock(center.x + offset, center.y + invOffset + 40);
            addBlock(center.x - offset, center.y - invOffset - 40);
            addBlock(center.x - offset, center.y + invOffset + 40);
        }
        // Lands at NSEW tips
        const tipDist = 240;
        addLand(center.x, center.y - tipDist);
        addLand(center.x, center.y + tipDist);
        addLand(center.x + tipDist, center.y);
        addLand(center.x - tipDist, center.y);

    } else if (layoutType === 6) {
        // --- LAYOUT 6: "THE CORRIDOR" (El Corredor) ---
        // Two long horizontal walls
        for (let x = -5; x <= 5; x++) {
            addBlock(center.x + x * GRID, center.y - 100);
            addBlock(center.x + x * GRID, center.y + 100);
        }
        // Lands at ends of corridor
        addLand(center.x - 240, center.y);
        addLand(center.x + 240, center.y);
        // Lands inside safe zone
        addLand(center.x - 80, center.y);
        addLand(center.x + 80, center.y);

    } else if (layoutType === 7) {
        // --- LAYOUT 7: "THE OCTAGON" (El Octágono) ---
        const r = 160;
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            addBlock(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r);
            // Add filler blocks between points for solidity
            const nextAngle = ((i + 1) / segments) * Math.PI * 2;
            const midX = (Math.cos(angle) + Math.cos(nextAngle)) / 2 * r;
            const midY = (Math.sin(angle) + Math.sin(nextAngle)) / 2 * r;
            addBlock(center.x + midX, center.y + midY);
        }
        // Lands outside
        addLand(center.x - 220, center.y - 220);
        addLand(center.x + 220, center.y + 220);
        addLand(center.x + 220, center.y - 220);
        addLand(center.x - 220, center.y + 220);

    } else if (layoutType === 8) {
        // --- LAYOUT 8: "THE SATELLITES" (Los Satélites) ---
        // 4 clusters of blocks at corners, core exposed
        const offset = 140;
        // Cluster 1
        addBlock(center.x - offset, center.y - offset);
        addBlock(center.x - offset + GRID, center.y - offset);
        addBlock(center.x - offset, center.y - offset + GRID);
        addLand(center.x - offset + 20, center.y - offset + 20); // Land near cluster

        // Cluster 2
        addBlock(center.x + offset, center.y - offset);
        addBlock(center.x + offset - GRID, center.y - offset);
        addBlock(center.x + offset, center.y - offset + GRID);
        addLand(center.x + offset - 20, center.y - offset + 20);

        // Cluster 3
        addBlock(center.x - offset, center.y + offset);
        addBlock(center.x - offset + GRID, center.y + offset);
        addBlock(center.x - offset, center.y + offset - GRID);
        addLand(center.x - offset + 20, center.y + offset - 20);

        // Cluster 4
        addBlock(center.x + offset, center.y + offset);
        addBlock(center.x + offset - GRID, center.y + offset);
        addBlock(center.x + offset, center.y + offset - GRID);
        addLand(center.x + offset - 20, center.y + offset - 20);

    } else {
        // --- LAYOUT 9: "THE STAR" (La Estrella) ---
        // 5-point star blocks
        const points = 5;
        const outerR = 180;
        const innerR = 80;
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            addBlock(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r);
            
            // Add connecting block
            const prevR = (i - 1) % 2 === 0 ? outerR : innerR;
            const prevAngle = ((i - 1) / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const midX = (Math.cos(angle) * r + Math.cos(prevAngle) * prevR) / 2;
            const midY = (Math.sin(angle) * r + Math.sin(prevAngle) * prevR) / 2;
            addBlock(center.x + midX, center.y + midY);
        }
        
        // Lands in the gaps of the star
        addLand(center.x, center.y - 120);
        addLand(center.x - 110, center.y - 40);
        addLand(center.x + 110, center.y - 40);
        addLand(center.x - 70, center.y + 100);
        // Removed 5th land to keep it to 4 balanced
    }

    return entities;
};

// --- CORE LOGIC MODULES (PURE FUNCTIONS) ---

const checkCollision = (
    pos1: Vector2, 
    radius1: number, 
    pos2: Vector2, 
    radius2: number
): boolean => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distSq = dx * dx + dy * dy;
    const radSum = radius1 + radius2;
    return distSq < radSum * radSum;
};

export const calculateWorkPoints = (resourceLevel: number): number => {
    if (resourceLevel >= GAME_CONFIG.LAND.STAGE_2_THRESHOLD) return GAME_CONFIG.SCORING.GREEN_TICK;
    if (resourceLevel >= GAME_CONFIG.LAND.STAGE_1_THRESHOLD) return GAME_CONFIG.SCORING.PINK_TICK;
    return GAME_CONFIG.SCORING.YELLOW_TICK;
};

export const processLandDecay = (entity: GameEntity, now: number): boolean => {
    if (!entity.landAttributes) return false;
    const attr = entity.landAttributes;

    if (attr.resourceLevel > 0) {
        attr.emptySince = undefined;
        return false; 
    }

    if (attr.emptySince === undefined) {
        attr.emptySince = now;
    }

    const isDecayed = (now - attr.emptySince) > GAME_CONFIG.LAND.DECAY_TIMEOUT_MS;
    
    return isDecayed;
};

export const processDeathLifecycle = (entity: GameEntity, attr: EntityAttributes, now: number): boolean => {
    if (attr.estado === 'muerto') {
        if (!attr.deathTimestamp) attr.deathTimestamp = now;
        const timeDead = now - attr.deathTimestamp;
        const totalDeathSequence = GAME_CONFIG.DEATH.TIME_FROZEN_MS + GAME_CONFIG.DEATH.FADE_DURATION_MS;
        return timeDead > totalDeathSequence; 
    }

    if (attr.energia <= 0) {
        if (!attr.zeroEnergySince) attr.zeroEnergySince = now;

        if (GAME_CONFIG.DEATH.ENABLE_AUTO_DEATH) {
            const timeAtZero = now - attr.zeroEnergySince;
            if (timeAtZero >= GAME_CONFIG.DEATH.TIME_TO_DIE_MS) {
                attr.estado = 'muerto';
                attr.deathTimestamp = now;
                attr.holdingCryptos = 0; // Lost carried crypto on death
                
                return false; 
            }
        }
    } else {
        attr.zeroEnergySince = undefined;
    }

    return false; 
};

// --- EVOLUTION MECHANIC ---
const checkEvolution = (attr: EntityAttributes): void => {
    if (attr.evolutionLevel >= 2) return; // Cap at level 2

    let evolved = false;

    // ALFA Trigger
    if (attr.sexo === Gender.MALE && attr.kills >= GAME_CONFIG.EVOLUTION.COMBAT_THRESHOLD) {
        evolved = true;
    }
    // BETA Trigger
    else if (attr.sexo === Gender.FEMALE && attr.jobsCompleted >= GAME_CONFIG.EVOLUTION.MINING_THRESHOLD) {
        evolved = true;
    }
    // AGE Trigger (Fallback)
    else if (attr.edad >= GAME_CONFIG.EVOLUTION.AGE_THRESHOLD) {
        evolved = true;
    }

    if (evolved) {
        attr.evolutionLevel = 2;
        // Optionally refill energy or boost max stats here
        attr.energia = GAME_CONFIG.BIOBOT.MAX_ENERGY;
    }
};

export const processTornado = (entity: GameEntity, now: number): GameEntity => {
    if (!entity.tornadoAttributes) return entity;
    const attr = entity.tornadoAttributes;

    // Move randomly (Wander behavior)
    // Small chance to change direction
    if (Math.random() < 0.05) {
        attr.wanderAngle += (Math.random() - 0.5) * 2; // +/- 1 radian turn
    }

    const speed = GAME_CONFIG.TORNADO.SPEED;
    let nextX = entity.position.x + Math.cos(attr.wanderAngle) * speed;
    let nextY = entity.position.y + Math.sin(attr.wanderAngle) * speed;

    // Bounce off walls
    if (nextX < 0 || nextX > WORLD_SIZE) {
        attr.wanderAngle = Math.PI - attr.wanderAngle;
        nextX = Math.max(0, Math.min(WORLD_SIZE, nextX));
    }
    if (nextY < 0 || nextY > WORLD_SIZE) {
        attr.wanderAngle = -attr.wanderAngle;
        nextY = Math.max(0, Math.min(WORLD_SIZE, nextY));
    }
    
    // Core Wallet Avoidance (Bounce off Core)
    const dx = nextX - WALLET_CENTER.x;
    const dy = nextY - WALLET_CENTER.y;
    const distToCore = Math.sqrt(dx * dx + dy * dy);
    
    // 50 is approx core radius + tornado radius
    if (distToCore < 60) {
        // Reverse direction
        attr.wanderAngle += Math.PI;
        const pushAngle = Math.atan2(dy, dx);
        nextX = WALLET_CENTER.x + Math.cos(pushAngle) * 65;
        nextY = WALLET_CENTER.y + Math.sin(pushAngle) * 65;
    }

    return {
        ...entity,
        position: { x: nextX, y: nextY },
        tornadoAttributes: attr
    };
};

export const processBlackHole = (entity: GameEntity, now: number): GameEntity => {
    if (!entity.blackHoleAttributes) return entity;
    const attr = entity.blackHoleAttributes;

    // Movement: Slow and steady in one direction (unlike erratic tornado)
    const speed = GAME_CONFIG.BLACK_HOLE.SPEED;
    let nextX = entity.position.x + Math.cos(attr.moveAngle) * speed;
    let nextY = entity.position.y + Math.sin(attr.moveAngle) * speed;

    // Bounce off walls
    if (nextX < 0 || nextX > WORLD_SIZE) {
        attr.moveAngle = Math.PI - attr.moveAngle;
        nextX = Math.max(0, Math.min(WORLD_SIZE, nextX));
    }
    if (nextY < 0 || nextY > WORLD_SIZE) {
        attr.moveAngle = -attr.moveAngle;
        nextY = Math.max(0, Math.min(WORLD_SIZE, nextY));
    }

    // Bounce off Core Wallet (Wallet is immune)
    const dx = nextX - WALLET_CENTER.x;
    const dy = nextY - WALLET_CENTER.y;
    const distToCore = Math.sqrt(dx * dx + dy * dy);
    
    if (distToCore < 80) { // Keep reasonable distance
        attr.moveAngle += Math.PI; // Turn around
        const pushAngle = Math.atan2(dy, dx);
        nextX = WALLET_CENTER.x + Math.cos(pushAngle) * 85;
        nextY = WALLET_CENTER.y + Math.sin(pushAngle) * 85;
    }

    return {
        ...entity,
        position: { x: nextX, y: nextY },
        blackHoleAttributes: attr
    };
};

export const processIntruder = (
    entity: GameEntity,
    blocks: GameEntity[],
    now: number
): GameEntity => {
    if (!entity.intruderAttributes) return entity;
    const attr = entity.intruderAttributes;
    
    // --- COMBAT FREEZE LOGIC ---
    // If Engaged (being attacked) or Dying, FREEZE MOVEMENT but continue animation
    if (attr.isEngaged || attr.isDying) {
        // Just vibrate/animate, do not calculate new position
        attr.tentaclePhase = (attr.tentaclePhase + 0.5) % (Math.PI * 2); // Faster vibration when engaged
        return {
            ...entity,
            intruderAttributes: attr
        };
    }

    // --- STRUCTURE ATTACK LOGIC ---
    if (attr.state === 'attacking_structure') {
        // Find if target block still exists
        const targetBlock = blocks.find(b => b.id === attr.targetId);
        
        // If block destroyed or gone, resume seeking
        if (!targetBlock) {
             attr.state = 'seeking';
             attr.targetId = 'CORE-WALLET-001';
             attr.attackStartTime = undefined;
        } else {
             // Stay here attacking
             attr.tentaclePhase = (attr.tentaclePhase + 0.3) % (Math.PI * 2); // Fast vibration
             // No movement
             return { ...entity, intruderAttributes: attr };
        }
    }

    const pos = { ...entity.position };
    
    // Update animation phase
    attr.tentaclePhase = (attr.tentaclePhase + 0.1) % (Math.PI * 2);

    // AI Logic: Move towards Wallet
    const walletPos = WALLET_CENTER;
    const dx = walletPos.x - pos.x;
    const dy = walletPos.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check collision with Wallet Radius (Theft Range)
    const attackRange = GAME_CONFIG.INTRUDER.ATTACK_RADIUS;

    if (dist <= attackRange) {
        if (attr.state !== 'attacking') {
            attr.state = 'attacking';
        }
        // Attacking behavior: Stay stuck to the edge of the wallet
        const jitter = Math.sin(now * 0.02) * 2;
        // Keep position on the perimeter
    } else {
        attr.state = 'seeking';
        // Move towards wallet
        const speed = GAME_CONFIG.INTRUDER.SPEED;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        const nextX = pos.x + vx;
        const nextY = pos.y + vy;

        // --- BLOCK COLLISION CHECK ---
        let collidedBlock: GameEntity | null = null;
        for (const block of blocks) {
            if (checkCollision({ x: nextX, y: nextY }, INTRUDER_COLLISION_RADIUS, block.position, BLOCK_COLLISION_RADIUS)) {
                collidedBlock = block;
                break;
            }
        }

        if (collidedBlock) {
            // Initiate attack on structure
            attr.state = 'attacking_structure';
            attr.targetId = collidedBlock.id;
            attr.attackStartTime = now;
            
        } else {
            // No collision, apply movement
            pos.x = nextX;
            pos.y = nextY;
        }
    }

    return {
        ...entity,
        position: pos,
        intruderAttributes: attr
    };
};

export const processBioBot = (
    entity: GameEntity, 
    entities: GameEntity[], 
    now: number, 
    baseSpeed: number, 
    interactionRadius: number
): GameEntity => {
    if (!entity.attributes) return entity;
    const attr = entity.attributes;

    // --- FIX: TITAN MODE IMMOBILITY ---
    // If performing special attack, freeze logic and movement to prevent 
    // visual/collision glitches while the unit is giant.
    if (attr.isPerformingSpecial) {
        return entity;
    }

    const lands = entities.filter(e => e.type === EntityType.LAND);
    const blocks = entities.filter(e => e.type === EntityType.BLOCK);
    // Needed for hunting logic
    const intruders = entities.filter(e => e.type === EntityType.INTRUDER);

    if (attr.estado === 'muerto') return entity;

    // --- OVERLOAD MECHANIC ---
    if ((attr.holdingCryptos || 0) > 2000) {
        attr.estado = 'muerto';
        attr.energia = 0;
        attr.holdingCryptos = 0;
        attr.deathTimestamp = now;

        return { ...entity, attributes: attr };
    }

    let newState: EntityAttributes['estado'] = attr.estado;
    let newPos = { ...entity.position };
    
    // --- ENERGY DECAY ---
    let decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_IDLE;
    if (newState === 'trabajando' || newState === 'peleando') decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_WORK;
    else if (newState === 'caminando') decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_MOVE;
    else if (newState === 'cazando' || newState === 'recolectando') decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_MOVE; // Hunting/Collecting costs movement energy
    
    attr.energia = Math.max(0, attr.energia - decay);

    // --- WORK TIMER ---
    if (newState === 'trabajando' && attr.workEndTime) {
        if (now > attr.workEndTime) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
            attr.workEndTime = undefined;
            // Clear target after work
            attr.workTargetId = undefined;
            attr.workTargetPosition = undefined;
            // Removed increment here to favor deposit-based progression
        }
    }

    // --- SPATIAL AWARENESS ---
    let nearestLand: GameEntity | null = null;
    let minDist = Infinity;

    // Determine if this bot is in STRICT COLLECTOR MODE
    const isStrictCollector = attr.evolutionLevel > 1 && attr.sexo === Gender.FEMALE && attr.workMode === 'collector';

    lands.forEach(land => {
        // STRICT FILTER: If Collector, ignore any land that is NOT a Ghost Node (System Created)
        // This effectively hides player lands from the bot for Eating AND Working.
        if (isStrictCollector && !land.landAttributes?.isGhost) {
            return;
        }

        const dx = land.position.x - newPos.x;
        const dy = land.position.y - newPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            nearestLand = land;
        }
    });

    const isHungry = attr.energia < 90;
    const landHasResources = nearestLand && nearestLand.landAttributes && nearestLand.landAttributes.resourceLevel > 0;
    const inInteractionRange = nearestLand && minDist < GAME_CONFIG.BIOBOT.FEEDING_RADIUS;

    // --- STATE LOGIC ---
    if (newState === 'trabajando') {
        if (!nearestLand) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
        } else if (nearestLand.landAttributes && nearestLand.landAttributes.resourceLevel === 0) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
        }
    }

    if (isHungry && landHasResources && inInteractionRange) {
        newState = 'alimentandose';
        attr.estado = 'alimentandose';
        attr.energia = Math.min(GAME_CONFIG.BIOBOT.MAX_ENERGY, attr.energia + GAME_CONFIG.BIOBOT.ENERGY_RECHARGE_RATE);

        if (nearestLand && nearestLand.landAttributes) {
            nearestLand.landAttributes.resourceLevel = Math.max(0, nearestLand.landAttributes.resourceLevel - GAME_CONFIG.CROP.CONSUMPTION_RATE);
        }
    } 
    else if (newState === 'trabajando' && nearestLand) {
        const resources = nearestLand.landAttributes?.resourceLevel || 0;
        if (resources > 0) {
             const pointsToAdd = calculateWorkPoints(resources);
             attr.holdingCryptos = (attr.holdingCryptos || 0) + pointsToAdd;
        }
    }
    else if (newState === 'alimentandose' && (!isHungry || !landHasResources)) {
        newState = 'ocioso';
        attr.estado = 'ocioso';
    }

    // --- DEPOSIT & EVOLUTION CHECK LOGIC ---
    if (nearestLand && minDist < interactionRadius + 20) {
        if ((attr.holdingCryptos || 0) > 0) {
            attr.individualScore = (attr.individualScore || 0) + attr.holdingCryptos;
            attr.holdingCryptos = 0; 
            
            // FIX: Increment Job Count gradually during mining (cooldown 15s)
            // This prevents "15000/5" spam but ensures progress is made before shift ends
            const JOB_COOLDOWN = 15000; // 15 seconds
            const lastJob = attr.lastJobIncrement || 0;
            if (now - lastJob > JOB_COOLDOWN) {
                 attr.jobsCompleted = (attr.jobsCompleted || 0) + 1;
                 attr.lastJobIncrement = now;
                 checkEvolution(attr);
            }
        }
    }
    
    // --- AUTO-BEHAVIOR FOR EVOLVED UNITS ---
    if (attr.evolutionLevel > 1 && (newState === 'ocioso' || newState === 'recolectando')) {
        
        // EVOLVED BETA: AUTO-MINE LOOP
        if (attr.sexo === Gender.FEMALE) {
            const workMode = attr.workMode || 'miner';
            
            // Search Logic
            let targetLand: GameEntity | null = null;
            let closestResDist = Infinity;
            
            // Define search radius based on mode
            // 'miner' = Local (Player/System nodes)
            // 'collector' = Global (Ghost nodes ONLY)
            const searchRadius = workMode === 'collector' ? Infinity : 350;

            lands.forEach(land => {
                const props = land.landAttributes;
                if (!props || props.resourceLevel <= 0) return;

                // SPECIAL RULE FOR COLLECTOR: ONLY TARGET GHOST NODES
                // If in collector mode and the node is NOT a ghost (created by player), ignore it.
                if (workMode === 'collector' && !props.isGhost) return;

                const dx = land.position.x - newPos.x;
                const dy = land.position.y - newPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < searchRadius && dist < closestResDist) {
                    closestResDist = dist;
                    targetLand = land;
                }
            });

            if (targetLand) {
                // Determine behavior
                if (closestResDist < interactionRadius + 20) {
                    // Close enough to start working immediately
                    newState = 'trabajando';
                    attr.estado = 'trabajando';
                    attr.workEndTime = now + GAME_CONFIG.BIOBOT.WORK_DURATION_MS;
                    attr.workTargetId = undefined; // Cleared
                    attr.workTargetPosition = undefined;
                } else {
                    // Need to travel
                    if (workMode === 'collector') {
                        // Explicitly set state to 'recolectando' to show intention/animation
                        newState = 'recolectando';
                        attr.estado = 'recolectando';
                        attr.workTargetId = (targetLand as GameEntity).id;
                        attr.workTargetPosition = (targetLand as GameEntity).position;
                    } 
                    // Implicit 'miner' idle wandering towards target is handled in movement physics below
                }
            } else {
                // If in collector mode and no lands found (no ghost nodes), revert to idle
                // It will keep searching every tick until the system spawns one.
                if (newState === 'recolectando') {
                    newState = 'ocioso';
                    attr.estado = 'ocioso';
                    attr.workTargetId = undefined;
                    attr.workTargetPosition = undefined;
                }
            }
        }

        // EVOLVED ALFA: AUTO-ATTACK LOOP (CONDITIONAL ON COMBAT MODE)
        if (attr.sexo === Gender.MALE) {
            const combatMode = attr.combatMode || 'hunter';
            
            let targetIntruder: GameEntity | null = null;
            let closestIntruderDist = Infinity;

            // Mode Logic: 
            // 'hunter': Finds closest intruder globally.
            // 'guardian': Finds closest intruder ONLY if within DEFENSE_RADIUS.
            
            intruders.forEach(intruder => {
                const dx = intruder.position.x - newPos.x;
                const dy = intruder.position.y - newPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // GUARDIAN FILTER
                if (combatMode === 'guardian' && dist > GAME_CONFIG.COMBAT.DEFENSE_RADIUS) {
                    return; // Ignore far intruders
                }

                if (dist < closestIntruderDist) {
                    closestIntruderDist = dist;
                    targetIntruder = intruder;
                }
            });

            if (targetIntruder) {
                newState = 'cazando';
                attr.estado = 'cazando';
                attr.combatTargetId = (targetIntruder as GameEntity).id;
                attr.combatTargetPosition = (targetIntruder as GameEntity).position;
            }
        }
    }

    // --- HUNTING LOGIC (State: CAZANDO) ---
    if (newState === 'cazando' && attr.combatTargetId) {
        const targetIntruder = intruders.find(i => i.id === attr.combatTargetId);
        
        // If target is gone/dead, go back to idle
        if (!targetIntruder || targetIntruder.intruderAttributes?.isDying) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
            attr.combatTargetId = undefined;
            attr.combatTargetPosition = undefined;
        } else {
            // Update known position
            attr.combatTargetPosition = targetIntruder.position;
            
            // Calculate distance
            const dx = targetIntruder.position.x - newPos.x;
            const dy = targetIntruder.position.y - newPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Check if Guardian should give up chase (if target moves too far)
            if (attr.combatMode === 'guardian' && dist > GAME_CONFIG.COMBAT.DEFENSE_RADIUS * 1.5) {
                 newState = 'ocioso';
                 attr.estado = 'ocioso';
                 attr.combatTargetId = undefined;
                 attr.combatTargetPosition = undefined;
            } else {

                // Determine Dynamic Attack Range based on current energy
                const energyPercent = Math.max(0, Math.min(1, attr.energia / 100));
                const dynamicRange = GAME_CONFIG.COMBAT.MIN_DISTANCE + 
                    (GAME_CONFIG.COMBAT.MAX_DISTANCE - GAME_CONFIG.COMBAT.MIN_DISTANCE) * energyPercent;

                // Attack Threshold: Use a tighter range for auto-engagement via hunting
                const engagementRange = dynamicRange * 0.8;

                if (dist <= engagementRange) {
                    // WITHIN RANGE: INITIATE COMBAT
                    newState = 'peleando';
                    attr.estado = 'peleando';
                    
                    // Calculate Combat Duration
                    const finalDuration = GAME_CONFIG.COMBAT.MIN_DURATION_MS + 
                        (GAME_CONFIG.COMBAT.MAX_DURATION_MS - GAME_CONFIG.COMBAT.MIN_DURATION_MS) * (1 - energyPercent);
                    
                    attr.combatEndTime = now + finalDuration;
                } 
                // Else: Movement logic below handles moving towards it
            }
        }
    }

    attr.estado = newState;

    // --- MOVEMENT PHYSICS ---
    let target: Vector2 | null = null;
    
    // FIGHTING MOVEMENT (Combat Dance)
    if (newState === 'peleando' && attr.combatTargetPosition) {
        // Dynamic movement during combat
        const seed = getEntitySeed(entity.id);
        const angle = (now / 400) + seed;
        target = {
            x: attr.combatTargetPosition.x + Math.cos(angle) * 30, // Orbit closer
            y: attr.combatTargetPosition.y + Math.sin(angle) * 30
        };
    }
    // HUNTING MOVEMENT
    else if (newState === 'cazando' && attr.combatTargetPosition) {
        target = attr.combatTargetPosition;
    }
    // COLLECTING MOVEMENT (Global Search)
    else if (newState === 'recolectando' && attr.workTargetPosition) {
        target = attr.workTargetPosition;
    }
    // WORKING MOVEMENT
    else if (newState === 'trabajando' && nearestLand && landHasResources) {
        const seed = getEntitySeed(entity.id);
        // Ensure orbit logic always applies for vitality
        target = {
            x: nearestLand.position.x + Math.cos(now / 800 + seed) * 45, // Slightly larger, faster orbit
            y: nearestLand.position.y + Math.sin(now / 800 + seed) * 45
        };
    } 
    // FEEDING MOVEMENT
    else if (isHungry && landHasResources && nearestLand) {
        target = {
            x: nearestLand.position.x + (Math.random() - 0.5) * 20,
            y: nearestLand.position.y + (Math.random() - 0.5) * 20
        };
    } 
    // EVOLVED BETA SEEKING RESOURCES (Implicit Idle/Miner)
    else if (attr.evolutionLevel > 1 && attr.sexo === Gender.FEMALE && newState === 'ocioso' && attr.workMode !== 'collector') {
         // Find nearest resource rich land to walk to (Local Only)
         let targetLand: GameEntity | null = null;
         let closestResDist = Infinity;
         lands.forEach(land => {
            if (land.landAttributes && land.landAttributes.resourceLevel > 0) {
                const dx = land.position.x - newPos.x;
                const dy = land.position.y - newPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestResDist) {
                    closestResDist = dist;
                    targetLand = land;
                }
            }
        });
        if (targetLand) {
            target = targetLand.position;
        } else {
            // Fallback to random wander if no resources
            const time = now * 0.0005;
            const seed = getEntitySeed(entity.id);
            const noiseX = Math.cos(time + seed) * 100;
            const noiseY = Math.sin(time + seed * 2) * 100;
            target = { x: newPos.x + noiseX, y: newPos.y + noiseY };
        }
    }
    // IDLE WANDER
    else {
        const time = now * 0.0005;
        const seed = getEntitySeed(entity.id);
        const noiseX = Math.cos(time + seed) * 100;
        const noiseY = Math.sin(time + seed * 2) * 100;
        target = { x: newPos.x + noiseX, y: newPos.y + noiseY };
    }
    
    // Ensure target is within bounds for all states except specific target tracking which might be on edge
    if (newState !== 'cazando' && newState !== 'recolectando' && newState !== 'peleando') {
        target.x = Math.max(100, Math.min(WORLD_SIZE - 100, target.x));
        target.y = Math.max(100, Math.min(WORLD_SIZE - 100, target.y));
    }

    const dx = target.x - newPos.x;
    const dy = target.y - newPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
        // Boost speed based on state
        let moveSpeed = baseSpeed;
        if (newState === 'alimentandose') moveSpeed = baseSpeed * 0.2;
        if (newState === 'cazando') moveSpeed = baseSpeed * 1.5; // Move faster when hunting
        if (newState === 'peleando') moveSpeed = baseSpeed * 0.5; // Slower during combat dance
        if (newState === 'recolectando') moveSpeed = baseSpeed * 1.3; // Move faster when actively collecting
        
        // EVOLUTION SPEED BOOST
        if (attr.evolutionLevel > 1) {
            moveSpeed *= GAME_CONFIG.EVOLUTION.SPEED_MULTIPLIER;
        }

        let nextX = newPos.x + (dx / dist) * moveSpeed;
        let nextY = newPos.y + (dy / dist) * moveSpeed;

        // --- BLOCK COLLISION & BOUNCE LOGIC ---
        // BioBots should bounce off blocks
        for (const block of blocks) {
            if (checkCollision({ x: nextX, y: nextY }, BIOBOT_COLLISION_RADIUS, block.position, BLOCK_COLLISION_RADIUS)) {
                // Collision detected: Bounce back
                // Calculate bounce vector (away from block center)
                const bx = nextX - block.position.x;
                const by = nextY - block.position.y;
                const bDist = Math.sqrt(bx * bx + by * by) || 1; // Avoid divide by zero
                
                // Push away with a bit more force than speed to clear collision
                const bounceForce = moveSpeed * 1.5;
                nextX = newPos.x + (bx / bDist) * bounceForce;
                nextY = newPos.y + (by / bDist) * bounceForce;
                
                // Add jitter to avoid getting stuck in perfect loops
                nextX += (Math.random() - 0.5) * 5;
                nextY += (Math.random() - 0.5) * 5;
            }
        }

        newPos.x = nextX;
        newPos.y = nextY;
    }

    // --- CORE WALLET PHYSICAL COLLISION LOGIC ---
    const adjustedPos = ensureOutsideWallet(newPos);
    newPos.x = adjustedPos.x;
    newPos.y = adjustedPos.y;

    return {
        ...entity,
        position: newPos,
        attributes: attr
    };
};

export const updateWorldState = (
    entities: GameEntity[], 
    speed: number, 
    interactionRadius: number,
    timestamp?: number
): { entities: GameEntity[], playerEnergyConsumed: number } => {
    const now = timestamp || Date.now();
    let playerEnergyConsumed = 0;
    
    // Track Intruders to be removed (killed by combat)
    const intrudersToKill = new Set<string>();

    // We process lists.
    const biobots = entities.filter(e => e.type === EntityType.PERSON);
    const intruders = entities.filter(e => e.type === EntityType.INTRUDER);
    const lands = entities.filter(e => e.type === EntityType.LAND);
    const blocks = entities.filter(e => e.type === EntityType.BLOCK);
    const tornadoes = entities.filter(e => e.type === EntityType.TORNADO);
    const blackHoles = entities.filter(e => e.type === EntityType.BLACK_HOLE);
    const explosions = entities.filter(e => e.type === EntityType.EXPLOSION);
    const wallet = entities.find(e => e.type === EntityType.WALLET);

    // Entities marked for destruction by hazards (Tornado/BlackHole/Explosion)
    const destructionSet = new Set<string>();

    const nextEntities: GameEntity[] = [];

    // --- HAZARD 1: TORNADOES ---
    for (const tornado of tornadoes) {
        if (!tornado.tornadoAttributes) continue;
        if (now - tornado.tornadoAttributes.creationTime > tornado.tornadoAttributes.duration) {
            continue; // Remove expired
        }
        const updatedTornado = processTornado(tornado, now);
        nextEntities.push(updatedTornado);

        const tPos = updatedTornado.position;
        const radius = GAME_CONFIG.TORNADO.DESTRUCTION_RADIUS;

        // Collision Checks
        biobots.forEach(bot => {
            if (checkCollision(bot.position, BIOBOT_COLLISION_RADIUS, tPos, radius)) destructionSet.add(bot.id);
        });
        intruders.forEach(intruder => {
            if (checkCollision(intruder.position, INTRUDER_COLLISION_RADIUS, tPos, radius)) destructionSet.add(intruder.id);
        });
        lands.forEach(land => {
            if (checkCollision(land.position, 20, tPos, radius)) destructionSet.add(land.id);
        });
        blocks.forEach(block => {
            if (checkCollision(block.position, BLOCK_COLLISION_RADIUS, tPos, radius)) destructionSet.add(block.id);
        });
    }

    // --- HAZARD 2: BLACK HOLES ---
    for (const bh of blackHoles) {
        if (!bh.blackHoleAttributes) continue;
        if (now - bh.blackHoleAttributes.creationTime > bh.blackHoleAttributes.duration) {
            continue; // Remove expired
        }
        const updatedBH = processBlackHole(bh, now);
        nextEntities.push(updatedBH);

        const bPos = updatedBH.position;
        const radius = GAME_CONFIG.BLACK_HOLE.EVENT_HORIZON_RADIUS;

        // Collision Checks (Swallow everything except Wallet)
        biobots.forEach(bot => {
            if (checkCollision(bot.position, BIOBOT_COLLISION_RADIUS, bPos, radius)) destructionSet.add(bot.id);
        });
        intruders.forEach(intruder => {
            if (checkCollision(intruder.position, INTRUDER_COLLISION_RADIUS, bPos, radius)) destructionSet.add(intruder.id);
        });
        lands.forEach(land => {
            if (checkCollision(land.position, 20, bPos, radius)) destructionSet.add(land.id);
        });
        blocks.forEach(block => {
            if (checkCollision(block.position, BLOCK_COLLISION_RADIUS, bPos, radius)) destructionSet.add(block.id);
        });
    }

    // --- HAZARD 3: EXPLOSIONS (LEVEL 5) ---
    for (const exp of explosions) {
        if (!exp.explosionAttributes) continue;
        if (now - exp.explosionAttributes.creationTime > exp.explosionAttributes.duration) {
            continue; // Remove expired explosion
        }
        
        nextEntities.push(exp);
        const ePos = exp.position;
        const radius = exp.explosionAttributes.radius;

        // Collision Checks (Destroy everything except Wallet)
        biobots.forEach(bot => {
            if (checkCollision(bot.position, BIOBOT_COLLISION_RADIUS, ePos, radius)) destructionSet.add(bot.id);
        });
        intruders.forEach(intruder => {
            if (checkCollision(intruder.position, INTRUDER_COLLISION_RADIUS, ePos, radius)) destructionSet.add(intruder.id);
        });
        lands.forEach(land => {
            if (checkCollision(land.position, 20, ePos, radius)) destructionSet.add(land.id);
        });
        blocks.forEach(block => {
            if (checkCollision(block.position, BLOCK_COLLISION_RADIUS, ePos, radius)) destructionSet.add(block.id);
        });
    }

    // --- IDENTIFY ENGAGED INTRUDERS ---
    const engagedIntruderIds = new Set<string>();
    biobots.forEach(bot => {
        if (bot.attributes?.estado === 'peleando' && bot.attributes.combatTargetId) {
             engagedIntruderIds.add(bot.attributes.combatTargetId);
        }
    });

    // 1. Process BioBots
    for (const bot of biobots) {
        if (!bot.attributes) {
            nextEntities.push(bot);
            continue;
        }

        // HAZARD DEATH CHECK
        if (destructionSet.has(bot.id)) {
             bot.attributes.estado = 'muerto';
             bot.attributes.deathTimestamp = now;
             bot.attributes.energia = 0;
             bot.attributes.holdingCryptos = 0;
        }

        // Death Lifecycle
        if (processDeathLifecycle(bot, bot.attributes, now)) {
            continue; // Entity removed (faded out)
        }

        // Combat Resolution
        if (bot.attributes.estado === 'peleando' && bot.attributes.combatEndTime && now >= bot.attributes.combatEndTime) {
            bot.attributes.estado = 'ocioso';
            bot.attributes.combatEndTime = undefined;
            if (bot.attributes.combatTargetId) {
                intrudersToKill.add(bot.attributes.combatTargetId);
                bot.attributes.kills = (bot.attributes.kills || 0) + 1;
                checkEvolution(bot.attributes);
            }
            bot.attributes.combatTargetId = undefined;
            bot.attributes.combatTargetPosition = undefined;
        }

        const updatedBot = processBioBot(bot, entities, now, speed, interactionRadius);
        nextEntities.push(updatedBot);
    }

    // 2. Process Intruders
    for (const intruder of intruders) {
        if (!intruder.intruderAttributes) {
            nextEntities.push(intruder);
            continue;
        }

        // HAZARD DESTRUCTION CHECK
        if (destructionSet.has(intruder.id) && !intruder.intruderAttributes.isDying) {
             intruder.intruderAttributes.isDying = true;
             intruder.intruderAttributes.deathTimestamp = now;
        }

        // Check if killed by combat
        if (intrudersToKill.has(intruder.id) && !intruder.intruderAttributes.isDying) {
            intruder.intruderAttributes.isDying = true;
            intruder.intruderAttributes.deathTimestamp = now;
            playerEnergyConsumed += GAME_CONFIG.COMBAT.KILL_COST;
        }

        // Remove if explosion finished
        if (intruder.intruderAttributes.isDying) {
            const deathTime = intruder.intruderAttributes.deathTimestamp || now;
            if (now - deathTime > GAME_CONFIG.INTRUDER.EXPLOSION_DURATION_MS) {
                continue; // Remove intruder
            }
        }

        if (engagedIntruderIds.has(intruder.id)) {
            intruder.intruderAttributes.isEngaged = true;
        } else {
            intruder.intruderAttributes.isEngaged = false;
        }

        const updatedIntruder = processIntruder(intruder, blocks, now);
        nextEntities.push(updatedIntruder);
    }

    // 3. Process Lands
    for (const land of lands) {
        if (destructionSet.has(land.id)) continue; // Removed by hazard
        if (!processLandDecay(land, now)) {
            nextEntities.push(land);
        }
    }

    // 4. Process Blocks
    for (const block of blocks) {
        if (destructionSet.has(block.id)) continue; // Removed by hazard

        // Durability Logic
        if (block.blockAttributes) {
            const beingAttacked = nextEntities.some(e => 
                e.type === EntityType.INTRUDER && 
                e.intruderAttributes?.state === 'attacking_structure' && 
                e.intruderAttributes.targetId === block.id &&
                !e.intruderAttributes.isDying
            );

            if (beingAttacked) {
                const DAMAGE_PER_TICK = 5; 
                block.blockAttributes.durability -= DAMAGE_PER_TICK;
                if (block.blockAttributes.durability <= 0) {
                    continue; // Block destroyed
                }
            }
        }
        nextEntities.push(block);
    }

    // 5. Wallet
    if (wallet) nextEntities.push(wallet);

    return { entities: nextEntities, playerEnergyConsumed };
};