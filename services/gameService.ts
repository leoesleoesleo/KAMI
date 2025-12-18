
import { EntityAttributes, Gender, Vector2, EntityType, GameEntity, LandAttributes, BlockType } from '../types';
import { WORLD_SIZE } from '../constants';
import { GAME_CONFIG } from '../gameConfig';

// --- DATA CONSTANTS ---
const NAMES_MALE = ["X-1", "Kryon", "Zet", "Aron-9", "Vector", "Helix", "Cobalt", "Neon", "Flux", "Titan"];
const NAMES_FEMALE = ["Aura", "Nova", "Sila", "Vea-7", "Luma", "Iris", "Echo", "Mirage", "Prisma", "Solaris"];
const PERSONALITIES = ["Lógico", "Protector", "Curioso", "Eficiente", "Místico", "Líder", "Creativo", "Guardián"];

export const WALLET_CENTER = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
export const WALLET_SAFE_RADIUS = 90; 
const BIOBOT_COLLISION_RADIUS = 15;
const INTRUDER_COLLISION_RADIUS = 15;
const AGENT_COLLISION_RADIUS = 15; 
const BLOCK_COLLISION_RADIUS = 25; 
const BLOCK_AVOIDANCE_RADIUS = 45; // Radio donde el bot empieza a "sentir" el bloque para rodearlo

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

export const generateRandomEdgePosition = (): Vector2 => {
    const side = Math.floor(Math.random() * 4); 
    const padding = 20;
    
    switch (side) {
        case 0: return { x: Math.random() * WORLD_SIZE, y: padding };
        case 1: return { x: WORLD_SIZE - padding, y: Math.random() * WORLD_SIZE };
        case 2: return { x: Math.random() * WORLD_SIZE, y: WORLD_SIZE - padding };
        case 3: return { x: padding, y: Math.random() * WORLD_SIZE };
        default: return { x: padding, y: padding };
    }
};

export const createWalletEntity = (): GameEntity => {
    return {
        id: 'CORE-WALLET-001',
        type: EntityType.WALLET,
        position: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
        createdAt: Date.now()
    };
};

export const createBlockEntity = (type: BlockType, position: Vector2): GameEntity => {
    const snappedPos = snapToGrid(position);
    return {
        id: generateUUID(),
        type: EntityType.BLOCK,
        position: snappedPos,
        blockAttributes: {
            type,
            durability: type === BlockType.FIREWALL ? GAME_CONFIG.STRUCTURES.DURABILITY.FIREWALL : GAME_CONFIG.STRUCTURES.DURABILITY.ENCRYPTION,
            variant: Math.floor(Math.random() * 3)
        },
        createdAt: Date.now()
    };
};

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
    holdingCryptos: 0,
    evolutionLevel: 1,
    jobsCompleted: 0,
    kills: 0,
    combatMode: 'hunter',
    workMode: 'miner'
  };
};

export const createPersonEntity = (attributes: EntityAttributes, position: Vector2): GameEntity => {
  const MALE_YELLOWS = ["eab308", "ca8a04", "a16207", "facc15", "fbbf24"]; 
  const FEMALE_YELLOWS = ["fef08a", "fde047", "facc15", "fffbeb", "fef9c3"];

  const colorPalette = attributes.sexo === Gender.MALE ? MALE_YELLOWS.join(',') : FEMALE_YELLOWS.join(',');
  const seedPrefix = attributes.sexo === Gender.MALE ? "mech-" : "bio-";
  const avatarSeed = `${seedPrefix}${attributes.nombre}-${Math.random()}`;
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}&baseColor=${colorPalette}&backgroundColor=transparent`;

  return {
    id: generateUUID(),
    type: EntityType.PERSON,
    position,
    attributes,
    avatarUrl,
    createdAt: Date.now(),
  };
};

export const createLandEntity = (position: Vector2): GameEntity => {
  return {
    id: generateUUID(),
    type: EntityType.LAND,
    position,
    landAttributes: {
        resourceLevel: 30, 
        emptySince: undefined
    },
    createdAt: Date.now(),
  };
};

export const createGhostNode = (): GameEntity => {
    const x = Math.random() * (WORLD_SIZE - 200) + 100;
    const y = Math.random() * (WORLD_SIZE - 200) + 100;
    const safePos = ensureOutsideWallet({ x, y });
    const entity = createLandEntity(safePos);
    const possibleLevels = [0, GAME_CONFIG.LAND.STAGE_1_THRESHOLD, GAME_CONFIG.LAND.STAGE_2_THRESHOLD];
    const resourceLevel = possibleLevels[Math.floor(Math.random() * possibleLevels.length)];
    
    if (entity.landAttributes) {
        entity.landAttributes.resourceLevel = resourceLevel;
        entity.landAttributes.isGhost = true;
    }
    return entity;
};

export const createIntruderEntity = (): GameEntity => {
    const position = generateRandomEdgePosition();
    return {
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
};

export const createAgentEntity = (): GameEntity => {
    const position = generateRandomEdgePosition();
    return {
        id: generateUUID(),
        type: EntityType.AGENT,
        position,
        agentAttributes: { state: 'seeking' },
        createdAt: Date.now()
    };
};

export const createTornadoEntity = (): GameEntity => {
    const position = generateRandomPosition(WALLET_CENTER, WORLD_SIZE / 2 - 50);
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
            moveAngle: Math.random() * Math.PI * 2
        },
        createdAt: Date.now()
    };
};

export const createExplosionEntity = (): GameEntity => {
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

export const generateLevel1Layout = (): GameEntity[] => {
    const center = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    const entities: GameEntity[] = [];
    entities.push(createWalletEntity());

    const GRID = GAME_CONFIG.STRUCTURES.GRID_SIZE;
    const layoutType = Math.floor(Math.random() * 20); // 20 Unique Designs

    const addLand = (x: number, y: number, resource: number = 100) => {
        const land = createLandEntity({ x, y });
        if (land.landAttributes) land.landAttributes.resourceLevel = resource;
        entities.push(land);
    };

    const addBlock = (x: number, y: number, isFirewall: boolean = false) => {
        const type = isFirewall ? BlockType.FIREWALL : BlockType.ENCRYPTION;
        entities.push(createBlockEntity(type, { x, y }));
    };

    // Helper for geometric patterns
    const placeCubicLayer = (radius: number, firewallRatio: number = 0.2) => {
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (Math.abs(x) === radius || Math.abs(y) === radius) {
                    addBlock(center.x + x * GRID, center.y + y * GRID, Math.random() < firewallRatio);
                }
            }
        }
    };

    switch (layoutType) {
        case 0: // EL LABERINTO CUÁNTICO
            for (let r = 2; r <= 6; r += 2) {
                placeCubicLayer(r, 0.1);
            }
            addLand(center.x - 4 * GRID, center.y - 4 * GRID);
            addLand(center.x + 4 * GRID, center.y + 4 * GRID);
            break;

        case 1: // LA CRUZ DE ENCRIPTACIÓN
            for (let i = 2; i < 8; i++) {
                addBlock(center.x + i * GRID, center.y, i % 4 === 0);
                addBlock(center.x - i * GRID, center.y, i % 4 === 0);
                addBlock(center.x, center.y + i * GRID, i % 4 === 0);
                addBlock(center.x, center.y - i * GRID, i % 4 === 0);
            }
            addLand(center.x + 8 * GRID, center.y);
            addLand(center.x - 8 * GRID, center.y);
            break;

        case 2: // EL DIAMANTE MODULAR
            for (let i = 1; i <= 5; i++) {
                addBlock(center.x + i * GRID, center.y + (5 - i) * GRID, i === 3);
                addBlock(center.x - i * GRID, center.y + (5 - i) * GRID, i === 3);
                addBlock(center.x + i * GRID, center.y - (5 - i) * GRID, i === 3);
                addBlock(center.x - i * GRID, center.y - (5 - i) * GRID, i === 3);
            }
            addLand(center.x, center.y + 6 * GRID);
            addLand(center.x, center.y - 6 * GRID);
            break;

        case 3: // LOS PILARES BINARIOS
            for (let x = -4; x <= 4; x += 8) {
                for (let y = -5; y <= 5; y++) {
                    addBlock(center.x + x * GRID, center.y + y * GRID, y === 0);
                }
            }
            addLand(center.x, center.y + 4 * GRID);
            addLand(center.x, center.y - 4 * GRID);
            break;

        case 4: // EL NÚCLEO PROTEGIDO (Capas densas de madera)
            placeCubicLayer(2, 0);
            placeCubicLayer(3, 0.3);
            addLand(center.x - 5 * GRID, center.y);
            addLand(center.x + 5 * GRID, center.y);
            break;

        case 5: // RAMIFICACIONES VECTORES
            for (let i = 2; i < 7; i++) {
                addBlock(center.x + i * GRID, center.y + i * GRID, i === 5);
                addBlock(center.x - i * GRID, center.y - i * GRID, i === 5);
                addBlock(center.x + i * GRID, center.y - i * GRID, i === 5);
                addBlock(center.x - i * GRID, center.y + i * GRID, i === 5);
            }
            addLand(center.x + 7 * GRID, center.y + 7 * GRID);
            addLand(center.x - 7 * GRID, center.y - 7 * GRID);
            break;

        case 6: // LA ESTRELLA DE CIFRADO
            for (let r = 3; r <= 6; r++) {
                addBlock(center.x + r * GRID, center.y, false);
                addBlock(center.x - r * GRID, center.y, false);
                addBlock(center.x, center.y + r * GRID, false);
                addBlock(center.x, center.y - r * GRID, false);
                addBlock(center.x + r * GRID, center.y + r * GRID, r === 6);
                addBlock(center.x - r * GRID, center.y - r * GRID, r === 6);
            }
            addLand(center.x, center.y + 8 * GRID);
            break;

        case 7: // DOBLE HEXÁGONO CÚBICO
            [4, 7].forEach(r => {
                for (let i = -r; i <= r; i++) {
                    addBlock(center.x + i * GRID, center.y + r * GRID, i === 0);
                    addBlock(center.x + i * GRID, center.y - r * GRID, i === 0);
                }
            });
            addLand(center.x - 9 * GRID, center.y);
            addLand(center.x + 9 * GRID, center.y);
            break;

        case 8: // PATRÓN DE AJEDREZ DIGITAL
            for (let x = -4; x <= 4; x++) {
                for (let y = -4; y <= 4; y++) {
                    if ((Math.abs(x) + Math.abs(y)) % 2 === 0 && Math.abs(x) + Math.abs(y) > 2) {
                        addBlock(center.x + x * GRID, center.y + y * GRID, x === 0 || y === 0);
                    }
                }
            }
            addLand(center.x + 6 * GRID, center.y + 6 * GRID);
            break;

        case 9: // EL TUNEL DE DATOS
            for (let y = -6; y <= 6; y++) {
                if (Math.abs(y) < 2) continue;
                addBlock(center.x - 2 * GRID, center.y + y * GRID, Math.abs(y) === 6);
                addBlock(center.x + 2 * GRID, center.y + y * GRID, Math.abs(y) === 6);
            }
            addLand(center.x, center.y + 8 * GRID);
            addLand(center.x, center.y - 8 * GRID);
            break;

        case 10: // LA MATRIZ DE SEGURIDAD
            for (let x = -5; x <= 5; x += 2) {
                for (let y = -5; y <= 5; y += 2) {
                    if (x === 0 && y === 0) continue;
                    addBlock(center.x + x * GRID, center.y + y * GRID, Math.random() < 0.15);
                }
            }
            addLand(center.x + 7 * GRID, center.y);
            break;

        case 11: // CASCADA DE BLOQUES
            for (let i = 1; i < 6; i++) {
                addBlock(center.x + i * GRID, center.y + i * GRID, false);
                addBlock(center.x + (i + 1) * GRID, center.y + i * GRID, true);
                addBlock(center.x - i * GRID, center.y - i * GRID, false);
                addBlock(center.x - (i + 1) * GRID, center.y - i * GRID, true);
            }
            addLand(center.x + 8 * GRID, center.y);
            break;

        case 12: // EL ESCUDO DE SANTIAGO
            placeCubicLayer(3, 0);
            for (let i = -1; i <= 1; i++) {
                addBlock(center.x + i * GRID, center.y + 4 * GRID, true);
                addBlock(center.x + i * GRID, center.y - 4 * GRID, true);
            }
            addLand(center.x, center.y + 6 * GRID);
            break;

        case 13: // RAMAS FRACTALES
            [3, 6].forEach(dist => {
                addBlock(center.x + dist * GRID, center.y, true);
                addBlock(center.x - dist * GRID, center.y, true);
                for (let j = -1; j <= 1; j++) {
                    if (j === 0) continue;
                    addBlock(center.x + dist * GRID, center.y + j * GRID, false);
                    addBlock(center.x - dist * GRID, center.y + j * GRID, false);
                }
            });
            addLand(center.x + 8 * GRID, center.y + 2 * GRID);
            break;

        case 14: // EL RELOJ DE ARENA
            for (let x = -4; x <= 4; x++) {
                addBlock(center.x + x * GRID, center.y + 4 * GRID, Math.abs(x) === 4);
                addBlock(center.x + x * GRID, center.y - 4 * GRID, Math.abs(x) === 4);
            }
            for (let y = -3; y <= 3; y++) {
                if (y === 0) continue;
                addBlock(center.x + Math.abs(y) * GRID, center.y + y * GRID, false);
                addBlock(center.x - Math.abs(y) * GRID, center.y + y * GRID, false);
            }
            addLand(center.x + 6 * GRID, center.y);
            break;

        case 15: // ORBITAS CUADRADAS
            [3, 5, 7].forEach(r => {
                addBlock(center.x + r * GRID, center.y + r * GRID, r === 7);
                addBlock(center.x - r * GRID, center.y - r * GRID, r === 7);
                addBlock(center.x + r * GRID, center.y - r * GRID, r === 7);
                addBlock(center.x - r * GRID, center.y + r * GRID, r === 7);
            });
            addLand(center.x + 9 * GRID, center.y + 9 * GRID);
            break;

        case 16: // LA CIUDADELA
            for (let x = -5; x <= 5; x++) {
                if (Math.abs(x) < 3) continue;
                addBlock(center.x + x * GRID, center.y + 3 * GRID, false);
                addBlock(center.x + x * GRID, center.y - 3 * GRID, false);
            }
            addBlock(center.x - 5 * GRID, center.y, true);
            addBlock(center.x + 5 * GRID, center.y, true);
            addLand(center.x, center.y - 6 * GRID);
            break;

        case 17: // EL TRIDENTE
            for (let x = -3; x <= 3; x += 3) {
                for (let y = 3; y <= 7; y++) {
                    addBlock(center.x + x * GRID, center.y + y * GRID, y === 7);
                }
            }
            addLand(center.x, center.y - 5 * GRID);
            break;

        case 18: // LA RED NEURONAL
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const r = 5 + Math.sin(i) * 2;
                addBlock(center.x + Math.cos(angle) * r * GRID, center.y + Math.sin(angle) * r * GRID, i % 3 === 0);
            }
            addLand(center.x + 10 * GRID, center.y);
            break;

        case 19: // EL PATRÓN OMEGA
            for (let angle = 0; angle < Math.PI * 1.5; angle += 0.3) {
                const r = 6;
                addBlock(center.x + Math.cos(angle) * r * GRID, center.y + Math.sin(angle) * r * GRID, false);
            }
            addBlock(center.x + 6 * GRID, center.y + 2 * GRID, true);
            addBlock(center.x - 6 * GRID, center.y + 2 * GRID, true);
            addLand(center.x, center.y - 8 * GRID);
            break;
    }

    return entities;
};

const checkCollision = (pos1: Vector2, radius1: number, pos2: Vector2, radius2: number): boolean => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return (dx * dx + dy * dy) < (radius1 + radius2) * (radius1 + radius2);
};

const hasLineOfSight = (start: Vector2, end: Vector2, blocks: GameEntity[]): boolean => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return true;

    for (const block of blocks) {
        const t = Math.max(0, Math.min(1, ((block.position.x - start.x) * dx + (block.position.y - start.y) * dy) / lenSq));
        const distSq = Math.pow(block.position.x - (start.x + t * dx), 2) + Math.pow(block.position.y - (start.y + t * dy), 2);
        if (distSq < BLOCK_COLLISION_RADIUS * BLOCK_COLLISION_RADIUS) return false;
    }
    return true;
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
    if (attr.emptySince === undefined) attr.emptySince = now;
    return (now - attr.emptySince) > GAME_CONFIG.LAND.DECAY_TIMEOUT_MS;
};

export const processDeathLifecycle = (entity: GameEntity, attr: EntityAttributes, now: number): boolean => {
    if (attr.estado === 'muerto') {
        if (!attr.deathTimestamp) attr.deathTimestamp = now;
        return (now - attr.deathTimestamp) > (GAME_CONFIG.DEATH.TIME_FROZEN_MS + GAME_CONFIG.DEATH.FADE_DURATION_MS); 
    }
    if (attr.energia <= 0) {
        if (!attr.zeroEnergySince) attr.zeroEnergySince = now;
        if (GAME_CONFIG.DEATH.ENABLE_AUTO_DEATH && (now - attr.zeroEnergySince) >= GAME_CONFIG.DEATH.TIME_TO_DIE_MS) {
            attr.estado = 'muerto';
            attr.deathTimestamp = now;
            attr.holdingCryptos = 0;
        }
    } else {
        attr.zeroEnergySince = undefined;
    }
    return false; 
};

const checkEvolution = (attr: EntityAttributes): void => {
    if (attr.evolutionLevel >= 2) return;
    let evolved = false;
    if (attr.sexo === Gender.MALE && attr.kills >= GAME_CONFIG.EVOLUTION.COMBAT_THRESHOLD) evolved = true;
    else if (attr.sexo === Gender.FEMALE && attr.jobsCompleted >= GAME_CONFIG.EVOLUTION.MINING_THRESHOLD) evolved = true;
    else if (attr.edad >= GAME_CONFIG.EVOLUTION.AGE_THRESHOLD) evolved = true;

    if (evolved) {
        attr.evolutionLevel = 2;
        attr.energia = GAME_CONFIG.BIOBOT.MAX_ENERGY;
    }
};

export const processTornado = (entity: GameEntity, now: number): GameEntity => {
    if (!entity.tornadoAttributes) return entity;
    const attr = entity.tornadoAttributes;
    if (Math.random() < 0.05) attr.wanderAngle += (Math.random() - 0.5) * 2;
    const speed = GAME_CONFIG.TORNADO.SPEED;
    let nextX = Math.max(0, Math.min(WORLD_SIZE, entity.position.x + Math.cos(attr.wanderAngle) * speed));
    let nextY = Math.max(0, Math.min(WORLD_SIZE, entity.position.y + Math.sin(attr.wanderAngle) * speed));
    const distToCore = Math.sqrt(Math.pow(nextX - WALLET_CENTER.x, 2) + Math.pow(nextY - WALLET_CENTER.y, 2));
    if (distToCore < 60) {
        attr.wanderAngle += Math.PI;
        nextX = WALLET_CENTER.x + Math.cos(Math.atan2(nextY - WALLET_CENTER.y, nextX - WALLET_CENTER.x)) * 65;
        nextY = WALLET_CENTER.y + Math.sin(Math.atan2(nextY - WALLET_CENTER.y, nextX - WALLET_CENTER.x)) * 65;
    }
    return { ...entity, position: { x: nextX, y: nextY }, tornadoAttributes: attr };
};

export const processBlackHole = (entity: GameEntity, now: number): GameEntity => {
    if (!entity.blackHoleAttributes) return entity;
    const attr = entity.blackHoleAttributes;
    const speed = GAME_CONFIG.BLACK_HOLE.SPEED;
    let nextX = Math.max(0, Math.min(WORLD_SIZE, entity.position.x + Math.cos(attr.moveAngle) * speed));
    let nextY = Math.max(0, Math.min(WORLD_SIZE, entity.position.y + Math.sin(attr.moveAngle) * speed));
    const distToCore = Math.sqrt(Math.pow(nextX - WALLET_CENTER.x, 2) + Math.pow(nextY - WALLET_CENTER.y, 2));
    if (distToCore < 80) {
        attr.moveAngle += Math.PI;
        nextX = WALLET_CENTER.x + Math.cos(Math.atan2(nextY - WALLET_CENTER.y, nextX - WALLET_CENTER.x)) * 85;
        nextY = WALLET_CENTER.y + Math.sin(Math.atan2(nextY - WALLET_CENTER.y, nextX - WALLET_CENTER.x)) * 85;
    }
    return { ...entity, position: { x: nextX, y: nextY }, blackHoleAttributes: attr };
};

export const processIntruder = (entity: GameEntity, blocks: GameEntity[], now: number): GameEntity => {
    if (!entity.intruderAttributes) return entity;
    const attr = entity.intruderAttributes;
    if (attr.isEngaged || attr.isDying) {
        attr.tentaclePhase = (attr.tentaclePhase + 0.5) % (Math.PI * 2);
        return { ...entity, intruderAttributes: attr };
    }
    if (attr.state === 'attacking_structure') {
        if (!blocks.find(b => b.id === attr.targetId)) {
             attr.state = 'seeking'; attr.targetId = 'CORE-WALLET-001';
        }
        attr.tentaclePhase = (attr.tentaclePhase + 0.3) % (Math.PI * 2);
        return { ...entity, intruderAttributes: attr };
    }
    const dist = Math.sqrt(Math.pow(WALLET_CENTER.x - entity.position.x, 2) + Math.pow(WALLET_CENTER.y - entity.position.y, 2));
    if (dist <= GAME_CONFIG.INTRUDER.ATTACK_RADIUS) {
        attr.state = 'attacking';
    } else {
        attr.state = 'seeking';
        const vx = ((WALLET_CENTER.x - entity.position.x) / dist) * GAME_CONFIG.INTRUDER.SPEED;
        const vy = ((WALLET_CENTER.y - entity.position.y) / dist) * GAME_CONFIG.INTRUDER.SPEED;
        const collidedBlock = blocks.find(b => checkCollision({ x: entity.position.x + vx, y: entity.position.y + vy }, INTRUDER_COLLISION_RADIUS, b.position, BLOCK_COLLISION_RADIUS));
        if (collidedBlock) {
            attr.state = 'attacking_structure'; attr.targetId = collidedBlock.id; attr.attackStartTime = now;
        } else {
            entity.position.x += vx; entity.position.y += vy;
        }
    }
    attr.tentaclePhase = (attr.tentaclePhase + 0.1) % (Math.PI * 2);
    return { ...entity, intruderAttributes: attr };
};

export const processAgent = (entity: GameEntity, biobots: GameEntity[], blocks: GameEntity[], now: number): GameEntity => {
    if (!entity.agentAttributes) return entity;
    const attr = entity.agentAttributes;
    
    if (attr.isDying) {
        attr.state = 'seeking'; 
        attr.targetId = undefined;
        attr.currentAttackStart = undefined;
        return { ...entity, agentAttributes: attr };
    }

    const VISUAL_COOLDOWN = 500;
    if (attr.lastShotTime && (now - attr.lastShotTime < VISUAL_COOLDOWN)) {
        attr.state = 'attacking';
        return { ...entity, agentAttributes: attr };
    }

    let targetBot = attr.targetId ? biobots.find(b => b.id === attr.targetId) : undefined;
    if (!targetBot || targetBot.attributes?.estado === 'muerto' || (targetBot.attributes?.energia || 0) <= 0) {
        attr.targetId = undefined; attr.state = 'seeking'; attr.combatTargetPosition = undefined; attr.currentAttackStart = undefined;
        targetBot = biobots.filter(b => b.attributes?.estado !== 'muerto' && (b.attributes?.energia || 0) > 0)
            .sort((a, b) => Math.sqrt(Math.pow(a.position.x - entity.position.x, 2) + Math.pow(a.position.y - entity.position.y, 2)) - Math.sqrt(Math.pow(b.position.x - entity.position.x, 2) + Math.pow(b.position.y - entity.position.y, 2)))[0];
        if (targetBot) attr.targetId = targetBot.id;
    }

    const baseSpeed = GAME_CONFIG.AGENT.SPEED;
    if (targetBot) {
        attr.combatTargetPosition = targetBot.position;
        const dx = targetBot.position.x - entity.position.x;
        const dy = targetBot.position.y - entity.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hasVision = hasLineOfSight(entity.position, targetBot.position, blocks);

        const isBotFightingMe = targetBot.attributes?.estado === 'peleando' && targetBot.attributes?.combatTargetId === entity.id;

        if (dist <= GAME_CONFIG.AGENT.ATTACK_RANGE && hasVision && !isBotFightingMe) {
            attr.state = 'attacking';
            if (!attr.currentAttackStart) attr.currentAttackStart = now;
            const orbitDir = Math.sin(now / 500) > 0 ? 1 : -1;
            entity.position.x += ((dx / dist) * 0.1 + (-dy / dist) * 0.9 * orbitDir) * baseSpeed;
            entity.position.y += ((dy / dist) * 0.1 + (dx / dist) * 0.9 * orbitDir) * baseSpeed;
        } else {
            attr.state = 'seeking';
            attr.currentAttackStart = undefined;
            if (!isBotFightingMe) {
                entity.position.x += (dx / dist) * baseSpeed;
                entity.position.y += (dy / dist) * baseSpeed;
            }
        }
    } else {
        const seed = getEntitySeed(entity.id);
        entity.position.x += Math.cos(now * 0.001 + seed) * baseSpeed;
        entity.position.y += Math.sin(now * 0.0013 + seed) * baseSpeed;
    }

    entity.position.x = Math.max(0, Math.min(WORLD_SIZE, entity.position.x));
    entity.position.y = Math.max(0, Math.min(WORLD_SIZE, entity.position.y));
    return { ...entity, agentAttributes: attr };
};

export const processBioBot = (entity: GameEntity, entities: GameEntity[], now: number, baseSpeed: number, interactionRadius: number): GameEntity => {
    if (!entity.attributes) return entity;
    const attr = entity.attributes;
    if (attr.isPerformingSpecial || attr.estado === 'muerto') return entity;

    const lands = entities.filter(e => e.type === EntityType.LAND);
    const blocks = entities.filter(e => e.type === EntityType.BLOCK);
    const intruders = entities.filter(e => e.type === EntityType.INTRUDER);
    const agents = entities.filter(e => e.type === EntityType.AGENT);

    attr.energia = Math.max(0, attr.energia - (attr.estado === 'trabajando' || attr.estado === 'peleando' ? GAME_CONFIG.BIOBOT.ENERGY_DECAY_WORK : GAME_CONFIG.BIOBOT.ENERGY_DECAY_IDLE));

    if (attr.estado === 'trabajando' && attr.workEndTime && now > attr.workEndTime) {
        attr.estado = 'ocioso'; attr.workEndTime = undefined; attr.workTargetId = undefined;
    }

    let nearestLand: GameEntity | null = null;
    let minDist = Infinity;
    lands.forEach(l => {
        const d = Math.sqrt(Math.pow(l.position.x - entity.position.x, 2) + Math.pow(l.position.y - entity.position.y, 2));
        if (d < minDist) { minDist = d; nearestLand = l; }
    });

    // PRIORIDAD Y SUPERVIVENCIA:
    // 1. Si está en combate real (peleando), prioriza el ataque hasta el final o energía crítica.
    // 2. Si está cazando (buscando al enemigo) pero tiene energía crítica (<15%), se detiene a cargar.
    const isEngagedInCombat = attr.estado === 'peleando' || attr.estado === 'cazando';
    const hasCriticalEnergy = attr.energia < 15;

    // Solo cargamos si NO estamos peleando cuerpo a cuerpo, a menos que la energía sea crítica.
    if ((!isEngagedInCombat || (attr.estado === 'cazando' && hasCriticalEnergy)) && attr.energia < 90 && nearestLand && nearestLand.landAttributes && nearestLand.landAttributes.resourceLevel > 0 && minDist < GAME_CONFIG.BIOBOT.FEEDING_RADIUS) {
        attr.estado = 'alimentandose';
        attr.energia = Math.min(100, attr.energia + GAME_CONFIG.BIOBOT.ENERGY_RECHARGE_RATE);
        nearestLand.landAttributes.resourceLevel = Math.max(0, nearestLand.landAttributes.resourceLevel - 0.08);
    } else if (attr.estado === 'trabajando' && nearestLand && (nearestLand.landAttributes?.resourceLevel || 0) > 0) {
        attr.holdingCryptos = (attr.holdingCryptos || 0) + calculateWorkPoints(nearestLand.landAttributes!.resourceLevel);
    }

    if (nearestLand && minDist < interactionRadius + 20 && (attr.holdingCryptos || 0) > 0) {
        attr.individualScore += attr.holdingCryptos; attr.holdingCryptos = 0;
        if (now - (attr.lastJobIncrement || 0) > 15000) {
            attr.jobsCompleted++; attr.lastJobIncrement = now; checkEvolution(attr);
        }
    }

    // LÓGICA DE AUTO-ASIGNACIÓN (Solo si no está en estado crítico)
    if (!hasCriticalEnergy && attr.evolutionLevel > 1 && (attr.estado === 'ocioso' || attr.estado === 'recolectando' || attr.estado === 'cazando')) {
        if (attr.sexo === Gender.FEMALE) {
            const target = lands.find(l => (l.landAttributes?.resourceLevel || 0) > 0 && (attr.workMode !== 'collector' || l.landAttributes?.isGhost));
            if (target) {
                if (Math.sqrt(Math.pow(target.position.x - entity.position.x, 2) + Math.pow(target.position.y - entity.position.y, 2)) < interactionRadius + 20) {
                    attr.estado = 'trabajando'; attr.workEndTime = now + 180000;
                } else {
                    attr.estado = 'recolectando'; attr.workTargetPosition = target.position;
                }
            }
        } else if (attr.sexo === Gender.MALE) {
            const potentialTargets = [...intruders, ...agents];
            const target = potentialTargets.filter(e => !(e.type === EntityType.INTRUDER && e.intruderAttributes?.isDying) && !(e.type === EntityType.AGENT && e.agentAttributes?.isDying))
                .sort((a, b) => {
                    if (attr.evolutionLevel > 1) {
                        if (a.type === EntityType.AGENT && b.type !== EntityType.AGENT) return -1;
                        if (b.type === EntityType.AGENT && a.type !== EntityType.AGENT) return 1;
                    }
                    const distA = Math.sqrt(Math.pow(a.position.x - entity.position.x, 2) + Math.pow(a.position.y - entity.position.y, 2));
                    const distB = Math.sqrt(Math.pow(b.position.x - entity.position.x, 2) + Math.pow(b.position.y - entity.position.y, 2));
                    return distA - distB;
                })[0];
            if (target) {
                attr.estado = 'cazando'; attr.combatTargetId = target.id; attr.combatTargetPosition = target.position;
            }
        }
    }

    if (attr.estado === 'cazando' && attr.combatTargetId) {
        const target = [...intruders, ...agents].find(e => e.id === attr.combatTargetId);
        if (!target || (target.type === EntityType.INTRUDER && target.intruderAttributes?.isDying) || (target.type === EntityType.AGENT && target.agentAttributes?.isDying)) {
            attr.estado = 'ocioso'; attr.combatTargetId = undefined;
        } else {
            attr.combatTargetPosition = target.position;
            const dist = Math.sqrt(Math.pow(target.position.x - entity.position.x, 2) + Math.pow(target.position.y - entity.position.y, 2));
            const isAgentAttackingMe = target.type === EntityType.AGENT && target.agentAttributes?.state === 'attacking' && target.agentAttributes?.targetId === entity.id;

            if (dist <= 120) {
                 if (attr.evolutionLevel > 1 || !isAgentAttackingMe) {
                    attr.estado = 'peleando'; 
                    attr.combatEndTime = now + (5000 + (15000 * (1 - attr.energia/100)));
                 }
            }
        }
    }

    // --- CÁLCULO DE POSICIÓN OBJETIVO ---
    let targetPos: Vector2 = { x: entity.position.x, y: entity.position.y };
    if (attr.estado === 'peleando' && attr.combatTargetPosition) targetPos = { x: attr.combatTargetPosition.x + Math.cos(now/400)*30, y: attr.combatTargetPosition.y + Math.sin(now/400)*30 };
    else if (attr.estado === 'cazando' && attr.combatTargetPosition) targetPos = attr.combatTargetPosition;
    else if (attr.estado === 'recolectando' && attr.workTargetPosition) targetPos = attr.workTargetPosition;
    else if (attr.estado === 'trabajando' && nearestLand) targetPos = { x: nearestLand.position.x + Math.cos(now/800)*45, y: nearestLand.position.y + Math.sin(now/800)*45 };
    else targetPos = { x: entity.position.x + Math.cos(now*0.0005 + getEntitySeed(entity.id))*100, y: entity.position.y + Math.sin(now*0.0005 + getEntitySeed(entity.id)*2)*100 };

    const d = Math.sqrt(Math.pow(targetPos.x - entity.position.x, 2) + Math.pow(targetPos.y - entity.position.y, 2));
    if (d > 1) {
        const speed = baseSpeed * (attr.estado === 'cazando' ? 1.5 : attr.estado === 'recolectando' ? 1.3 : 1) * (attr.evolutionLevel > 1 ? 1.8 : 1);
        
        // --- NAVEGACIÓN CON EVITACIÓN DE BLOQUES ---
        let moveX = ((targetPos.x - entity.position.x) / d);
        let moveY = ((targetPos.y - entity.position.y) / d);

        // Detectar bloques cercanos para rodearlos suavemente
        blocks.forEach(b => {
            const dx = entity.position.x - b.position.x;
            const dy = entity.position.y - b.position.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < BLOCK_AVOIDANCE_RADIUS * BLOCK_AVOIDANCE_RADIUS) {
                const dist = Math.sqrt(distSq);
                // Fuerza de repulsión que aumenta cuanto más cerca está
                const pushStrength = (BLOCK_AVOIDANCE_RADIUS - dist) / BLOCK_AVOIDANCE_RADIUS;
                
                // Calculamos un vector perpendicular a la dirección del bloque para "deslizarse"
                // Esto crea el efecto de rodear el objeto
                const normalX = dx / dist;
                const normalY = dy / dist;
                
                // Mezclamos la dirección deseada con la fuerza de evitación
                moveX += normalX * pushStrength * 2.0;
                moveY += normalY * pushStrength * 2.0;
            }
        });

        // Re-normalizar el vector de movimiento final tras la evitación
        const finalMag = Math.sqrt(moveX * moveX + moveY * moveY);
        const nx = entity.position.x + (moveX / finalMag) * speed;
        const ny = entity.position.y + (moveY / finalMag) * speed;

        // Colisión final rígida (Failsafe)
        if (blocks.some(b => checkCollision({ x: nx, y: ny }, 12, b.position, 22))) {
             // Si el sistema de evitación falla por un ángulo muerto, rebote ligero lateral
             const nearest = blocks.sort((a,b) => Math.sqrt(Math.pow(a.position.x-nx,2)+Math.pow(a.position.y-ny,2)) - Math.sqrt(Math.pow(b.position.x-nx,2)+Math.pow(b.position.y-ny,2)))[0];
             const angleToNearest = Math.atan2(entity.position.y - nearest.position.y, entity.position.x - nearest.position.x);
             entity.position.x += Math.cos(angleToNearest) * speed;
             entity.position.y += Math.sin(angleToNearest) * speed;
        } else {
            entity.position.x = nx;
            entity.position.y = ny;
        }
        
        entity.position = ensureOutsideWallet(entity.position);
    }
    return { ...entity, attributes: attr };
};

export const updateWorldState = (entities: GameEntity[], speed: number, interactionRadius: number, timestamp?: number): { entities: GameEntity[], playerEnergyConsumed: number } => {
    const now = timestamp || Date.now();
    let playerEnergyConsumed = 0;
    const nextEntities: GameEntity[] = [];
    const destructionSet = new Set<string>();

    const biobots = entities.filter(e => e.type === EntityType.PERSON);
    const intruders = entities.filter(e => e.type === EntityType.INTRUDER);
    const agents = entities.filter(e => e.type === EntityType.AGENT);
    const lands = entities.filter(e => e.type === EntityType.LAND);
    const blocks = entities.filter(e => e.type === EntityType.BLOCK);
    const hazards = entities.filter(e => [EntityType.TORNADO, EntityType.BLACK_HOLE, EntityType.EXPLOSION].includes(e.type));

    biobots.forEach(bot => {
        if (bot.attributes?.estado === 'peleando' && bot.attributes.combatTargetId) {
             const targetAgent = agents.find(a => a.id === bot.attributes!.combatTargetId);
             if (targetAgent && !targetAgent.agentAttributes?.isDying) {
                 destructionSet.add(targetAgent.id);
                 bot.attributes.kills++; 
                 checkEvolution(bot.attributes);
                 bot.attributes.estado = 'ocioso'; 
                 bot.attributes.combatTargetId = undefined;
             }
             
             const targetIntruder = intruders.find(i => i.id === bot.attributes!.combatTargetId);
             if (targetIntruder && now >= bot.attributes.combatEndTime!) {
                 destructionSet.add(targetIntruder.id);
                 bot.attributes.kills++; 
                 checkEvolution(bot.attributes);
                 bot.attributes.estado = 'ocioso'; 
                 bot.attributes.combatTargetId = undefined;
                 playerEnergyConsumed += 1;
             }
        }
    });

    hazards.forEach(h => {
        let updated = h;
        if (h.type === EntityType.TORNADO) updated = processTornado(h, now);
        else if (h.type === EntityType.BLACK_HOLE) updated = processBlackHole(h, now);
        
        const expired = (h.type === EntityType.EXPLOSION && (now - h.explosionAttributes!.creationTime > h.explosionAttributes!.duration)) ||
                        (h.type === EntityType.TORNADO && (now - h.tornadoAttributes!.creationTime > h.tornadoAttributes!.duration)) ||
                        (h.type === EntityType.BLACK_HOLE && (now - h.blackHoleAttributes!.creationTime > h.blackHoleAttributes!.duration));
        
        if (!expired) {
            nextEntities.push(updated);
            const radius = h.type === EntityType.EXPLOSION ? h.explosionAttributes!.radius : h.type === EntityType.TORNADO ? 40 : 45;
            
            [...intruders, ...agents].forEach(e => {
                if (checkCollision(e.position, 15, updated.position, radius)) destructionSet.add(e.id);
            });
            [...lands, ...blocks].forEach(e => {
                if (h.type === EntityType.EXPLOSION && checkCollision(e.position, 15, updated.position, radius)) destructionSet.add(e.id);
            });
        }
    });

    agents.forEach(agent => {
        if (destructionSet.has(agent.id) && !agent.agentAttributes?.isDying) {
             agent.agentAttributes!.isDying = true;
             agent.agentAttributes!.deathTimestamp = now;
             agent.agentAttributes!.state = 'seeking'; 
             agent.agentAttributes!.targetId = undefined;
        }
        
        if (agent.agentAttributes?.isDying) {
            if (now - (agent.agentAttributes.deathTimestamp || 0) < 2000) {
                nextEntities.push(agent);
            }
            return;
        }

        const updated = processAgent(agent, biobots, blocks, now);
        if (updated.agentAttributes?.state === 'attacking' && updated.agentAttributes.targetId) {
            const target = biobots.find(b => b.id === updated.agentAttributes!.targetId);
            if (target && target.attributes?.estado !== 'muerto') {
                const attr = updated.agentAttributes;
                if (!attr.currentAttackStart) attr.currentAttackStart = now;
                const timeToKill = (target.attributes.evolutionLevel >= 2 ? 6000 : 3000) * Math.max(0.1, target.attributes.energia / 100);
                if (now - attr.currentAttackStart >= timeToKill) {
                    destructionSet.add(target.id); attr.currentAttackStart = undefined; attr.lastShotTime = now;
                } else {
                    attr.lastShotTime = now;
                }
            }
        }
        nextEntities.push(updated);
    });

    intruders.forEach(i => {
        if (destructionSet.has(i.id) && !i.intruderAttributes?.isDying) { 
            i.intruderAttributes!.isDying = true; i.intruderAttributes!.deathTimestamp = now; 
        }
        if (i.intruderAttributes?.isDying) {
            if (now - (i.intruderAttributes.deathTimestamp || 0) < 2000) nextEntities.push(i);
            return;
        }
        nextEntities.push(processIntruder(i, blocks, now));
    });

    biobots.forEach(bot => {
        if (destructionSet.has(bot.id)) {
             bot.attributes!.estado = 'muerto'; bot.attributes!.deathTimestamp = now; bot.attributes!.energia = 0;
        }
        if (processDeathLifecycle(bot, bot.attributes!, now)) return;

        nextEntities.push(processBioBot(bot, entities, now, speed, interactionRadius));
    });

    lands.forEach(l => { if (!destructionSet.has(l.id) && !processLandDecay(l, now)) nextEntities.push(l); });
    blocks.forEach(b => {
        if (destructionSet.has(b.id)) return;
        const beingAttacked = intruders.some(i => i.intruderAttributes?.state === 'attacking_structure' && i.intruderAttributes.targetId === b.id);
        if (beingAttacked) {
            b.blockAttributes!.durability -= 5;
            if (b.blockAttributes!.durability <= 0) return;
        }
        nextEntities.push(b);
    });
    const wallet = entities.find(e => e.type === EntityType.WALLET);
    if (wallet) nextEntities.push(wallet);

    return { entities: nextEntities, playerEnergyConsumed };
};
