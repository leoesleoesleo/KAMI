

import { EntityAttributes, Gender, Vector2, EntityType, GameEntity, LandAttributes, EventType, EventCategory, EventSeverity, BlockType } from '../types';
import { WORLD_SIZE } from '../constants';
import { GAME_CONFIG } from '../gameConfig';
import { Logger } from './LoggerService';

// --- DATA CONSTANTS ---
const NAMES_MALE = ["X-1", "Kryon", "Zet", "Aron-9", "Vector", "Helix", "Cobalt", "Neon", "Flux", "Titan"];
const NAMES_FEMALE = ["Aura", "Nova", "Sila", "Vea-7", "Luma", "Iris", "Echo", "Mirage", "Prisma", "Solaris"];
const PERSONALITIES = ["Lógico", "Protector", "Curioso", "Eficiente", "Místico", "Líder", "Creativo", "Guardián"];

export const WALLET_CENTER = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
// Radius = Wallet Visual Radius (~40px) + Object Radius (~25px) + Padding (~25px)
export const WALLET_SAFE_RADIUS = 90; 

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

    Logger.log(
        EventType.BLOCK_PLACED,
        EventCategory.CONSTRUCTION,
        EventSeverity.INFO,
        { type, position: snappedPos }
    );

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
    holdingCryptos: 0 // New attribute for carry capacity
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

  Logger.log(
      EventType.BIOBOT_CREATED, 
      EventCategory.LIFECYCLE, 
      EventSeverity.INFO, 
      { id: entity.id, name: attributes.nombre, type: attributes.sexo }
  );

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
  
  Logger.log(
      EventType.LAND_CREATED, 
      EventCategory.ECONOMY, 
      EventSeverity.INFO, 
      { id: entity.id, position }
  );

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

    Logger.log(
        EventType.SYSTEM_ALERT,
        EventCategory.SYSTEM,
        EventSeverity.INFO,
        { action: 'GHOST_SPAWN', resources: resourceLevel }
    );

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

    Logger.log(
        EventType.INTRUDER_SPAWN,
        EventCategory.THREAT,
        EventSeverity.WARNING,
        { action: 'SENTINEL_DETECTED', origin: position }
    );

    return entity;
};

// --- CORE LOGIC MODULES (PURE FUNCTIONS) ---

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
    
    if (isDecayed) {
         Logger.log(
            EventType.LAND_DECAYED,
            EventCategory.ECONOMY,
            EventSeverity.WARNING,
            { id: entity.id, reason: 'TIMEOUT' }
        );
    }
    
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
                
                Logger.log(
                    EventType.BIOBOT_DEATH,
                    EventCategory.LIFECYCLE,
                    EventSeverity.CRITICAL,
                    { id: entity.id, name: attr.nombre, cause: 'ENERGY_DEPLETION' }
                );
                
                return false; 
            }
        }
    } else {
        attr.zeroEnergySince = undefined;
    }

    return false; 
};

export const processIntruder = (
    entity: GameEntity,
    now: number
): GameEntity => {
    if (!entity.intruderAttributes) return entity;
    const attr = entity.intruderAttributes;
    
    // --- COMBAT FREEZE LOGIC ---
    // If engaged in combat or dying, stop movement
    if (attr.isEngaged || attr.isDying) {
        // Just update visual phase if needed, but don't move position
        attr.tentaclePhase = (attr.tentaclePhase + 0.2) % (Math.PI * 2); // Faster vibration
        return {
            ...entity,
            intruderAttributes: attr
        };
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
            Logger.log(
                EventType.SECURITY_BREACH, 
                EventCategory.THREAT, 
                EventSeverity.CRITICAL, 
                { id: entity.id, status: 'ATTACHED_TO_CORE' }
            );
        }
        // Attacking behavior: Stay stuck to the edge of the wallet
        // Optional: slight jitter effect
        const jitter = Math.sin(now * 0.02) * 2;
        // Keep position on the perimeter
        // We don't change pos much, just ensure it stays stuck
    } else {
        attr.state = 'seeking';
        // Move towards wallet
        const speed = GAME_CONFIG.INTRUDER.SPEED;
        pos.x += (dx / dist) * speed;
        pos.y += (dy / dist) * speed;
    }

    return {
        ...entity,
        position: pos,
        intruderAttributes: attr
    };
};

export const processBioBot = (
    entity: GameEntity, 
    lands: GameEntity[], 
    now: number, 
    speed: number, 
    interactionRadius: number
): GameEntity => {
    if (!entity.attributes) return entity;
    const attr = entity.attributes;

    if (attr.estado === 'muerto') return entity;

    // --- FIGHTING LOGIC (New) ---
    if (attr.estado === 'peleando') {
        // Just consume energy slowly while fighting
        attr.energia = Math.max(0, attr.energia - GAME_CONFIG.BIOBOT.ENERGY_DECAY_WORK);
        
        // No movement updates here, handled in updateWorldState for removal logic
        // But we want to ensure the position stays static or maybe jitters slightly
        return {
             ...entity,
             attributes: attr
        };
    }

    let newState = attr.estado;
    let newPos = { ...entity.position };
    
    // --- NEW: OVERLOAD MECHANIC (CRITICAL MASS) ---
    // If the bot holds more than 2000 crypto while away from node, it burns out and dies
    if ((attr.holdingCryptos || 0) > 2000) {
        attr.estado = 'muerto';
        attr.energia = 0;
        attr.holdingCryptos = 0; // All data lost
        attr.deathTimestamp = now;

        Logger.log(
            EventType.BIOBOT_DEATH,
            EventCategory.LIFECYCLE,
            EventSeverity.CRITICAL,
            { id: entity.id, name: attr.nombre, cause: 'SYSTEM_OVERLOAD_2000' }
        );
        return { ...entity, attributes: attr };
    }

    // --- ENERGY DECAY ---
    let decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_IDLE;
    if (newState === 'trabajando') decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_WORK;
    else if (newState === 'caminando') decay = GAME_CONFIG.BIOBOT.ENERGY_DECAY_MOVE;
    
    attr.energia = Math.max(0, attr.energia - decay);

    // --- WORK TIMER ---
    if (newState === 'trabajando' && attr.workEndTime) {
        if (now > attr.workEndTime) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
            attr.workEndTime = undefined;
        }
    }

    // --- SPATIAL AWARENESS ---
    let nearestLand: GameEntity | null = null;
    let minDist = Infinity;

    lands.forEach(land => {
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
    // If working, ensure the land still exists and has resources
    if (newState === 'trabajando') {
        if (!nearestLand) {
            // FIX: Prevent ghost working if land decayed/disappeared
            newState = 'ocioso';
            attr.estado = 'ocioso';
        } else if (nearestLand.landAttributes && nearestLand.landAttributes.resourceLevel === 0) {
            // Stop working if resources depleted
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
             // NEW: Accumulate in holdingCryptos instead of global score immediately
             attr.holdingCryptos = (attr.holdingCryptos || 0) + pointsToAdd;
        }
    }
    else if (newState === 'alimentandose' && (!isHungry || !landHasResources)) {
        newState = 'ocioso';
        attr.estado = 'ocioso';
    }

    // --- DEPOSIT LOGIC (SEPARATED FROM WORKING STATE) ---
    // Anytime the bot touches a node, it offloads its crypto cargo
    // This ensures that even if it stopped working (timer ended) right before arrival, it deposits.
    if (nearestLand && minDist < interactionRadius + 20) {
        if ((attr.holdingCryptos || 0) > 0) {
            attr.individualScore = (attr.individualScore || 0) + attr.holdingCryptos;
            attr.holdingCryptos = 0; // Empty buffer
            // Optional: Visual effect or log could trigger here
        }
    }

    // Only log state changes to avoid spam
    if (newState !== entity.attributes.estado) {
        Logger.log(
            EventType.BIOBOT_STATE_CHANGE,
            EventCategory.LIFECYCLE,
            EventSeverity.INFO,
            { id: entity.id, from: entity.attributes.estado, to: newState }
        );
    }
    attr.estado = newState;

    // --- MOVEMENT PHYSICS ---
    let target: Vector2 | null = null;

    if (newState === 'trabajando' && nearestLand && landHasResources) {
        const seed = getEntitySeed(entity.id);
        if (minDist < interactionRadius + 50) {
            target = {
                x: nearestLand.position.x + Math.cos(now / 1000 + seed) * 40,
                y: nearestLand.position.y + Math.sin(now / 1000 + seed) * 40
            };
        } else {
            target = nearestLand.position;
        }
    } else if (isHungry && landHasResources && nearestLand) {
        target = {
            x: nearestLand.position.x + (Math.random() - 0.5) * 20,
            y: nearestLand.position.y + (Math.random() - 0.5) * 20
        };
    } else {
        const time = now * 0.0005;
        const seed = getEntitySeed(entity.id);
        const noiseX = Math.cos(time + seed) * 100;
        const noiseY = Math.sin(time + seed * 2) * 100;
        target = { x: newPos.x + noiseX, y: newPos.y + noiseY };
    }
    
    target.x = Math.max(100, Math.min(WORLD_SIZE - 100, target.x));
    target.y = Math.max(100, Math.min(WORLD_SIZE - 100, target.y));

    const dx = target.x - newPos.x;
    const dy = target.y - newPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
        const moveSpeed = newState === 'alimentandose' ? speed * 0.2 : speed;
        newPos.x += (dx / dist) * moveSpeed;
        newPos.y += (dy / dist) * moveSpeed;
    }

    // --- CORE WALLET PHYSICAL COLLISION LOGIC ---
    // Ensure the new calculated position is not inside the wallet
    const adjustedPos = ensureOutsideWallet(newPos);
    newPos.x = adjustedPos.x;
    newPos.y = adjustedPos.y;

    return {
        ...entity,
        position: newPos,
        attributes: attr
    };
};

export interface WorldUpdateResult {
    entities: GameEntity[];
    playerEnergyConsumed: number;
}

export const updateWorldState = (
    entities: GameEntity[], 
    speed: number, 
    interactionRadius: number,
    overrideNow?: number
): WorldUpdateResult => {
    
    const now = overrideNow || Date.now();
    let playerEnergyConsumed = 0;
    
    // First, identify combat resolution needs
    // We need to know which intruders are being targeted and if they die
    const botsToReset = new Set<string>();
    const dyingIntruderIds = new Set<string>();
    const engagedIntruderIds = new Set<string>();

    entities.forEach(e => {
        if (e.type === EntityType.PERSON && e.attributes?.estado === 'peleando') {
             const targetId = e.attributes.combatTargetId;
             if (targetId) engagedIntruderIds.add(targetId);

             if (e.attributes.combatEndTime && now > e.attributes.combatEndTime) {
                 // Combat finished successfully for this bot
                 if (targetId) {
                     dyingIntruderIds.add(targetId);
                 }
                 botsToReset.add(e.id);
             }
        }
    });

    // Notify logs if intruders start dying
    if (dyingIntruderIds.size > 0) {
         // Optimization: Don't log if they were already dying, but simple check is okay
    }
    
    const nextEntities = entities.map(e => ({
        ...e,
        position: {...e.position},
        attributes: e.attributes ? {...e.attributes} : undefined,
        landAttributes: e.landAttributes ? {...e.landAttributes} : undefined,
        intruderAttributes: e.intruderAttributes ? {...e.intruderAttributes} : undefined
    }));

    const lands = nextEntities.filter(e => e.type === EntityType.LAND);
    const finalEntities: GameEntity[] = [];

    nextEntities.forEach(entity => {
        // --- IMMUTABLE OBJECTS ---
        if (entity.type === EntityType.WALLET || entity.type === EntityType.BLOCK) {
            finalEntities.push(entity);
            return;
        }
        
        // --- INTRUDER LOGIC UPDATE ---
        if (entity.type === EntityType.INTRUDER && entity.intruderAttributes) {
            // Check if this intruder is fully dead (explosion finished)
            if (entity.intruderAttributes.isDying) {
                const deathTime = entity.intruderAttributes.deathTimestamp || 0;
                if (now - deathTime > GAME_CONFIG.INTRUDER.EXPLOSION_DURATION_MS) {
                     // Explosion finished, remove entity
                     Logger.log(
                        EventType.INTRUDER_ELIMINATED,
                        EventCategory.THREAT,
                        EventSeverity.INFO,
                        { id: entity.id, status: 'DESTROYED' }
                     );
                     return; // Skip adding to finalEntities
                }
            }
            
            // Check if this intruder just got killed by a bot finish
            if (dyingIntruderIds.has(entity.id) && !entity.intruderAttributes.isDying) {
                entity.intruderAttributes.isDying = true;
                entity.intruderAttributes.deathTimestamp = now;
                entity.intruderAttributes.state = 'seeking'; // Reset state logic
            }
            
            // Update engagement status
            entity.intruderAttributes.isEngaged = engagedIntruderIds.has(entity.id);

            const updatedIntruder = processIntruder(entity, now);
            finalEntities.push(updatedIntruder);
            return;
        }

        if (entity.type === EntityType.LAND) {
            const shouldRemove = processLandDecay(entity, now);
            if (!shouldRemove) {
                finalEntities.push(entity);
            }
            return;
        }

        if (entity.type === EntityType.PERSON && entity.attributes) {
            
            // Check if this bot just finished fighting
            if (botsToReset.has(entity.id)) {
                entity.attributes.estado = 'ocioso';
                entity.attributes.combatEndTime = undefined;
                entity.attributes.combatTargetId = undefined;
                entity.attributes.combatTargetPosition = undefined;
                
                // Deduct energy from BOT (Battery) on kill (combat success)
                entity.attributes.energia = Math.max(0, entity.attributes.energia - 1);
                
                // Deduct energy from PLAYER (Mana/Points) on kill success
                // FIXED: Use Config Constant
                playerEnergyConsumed += GAME_CONFIG.COMBAT.KILL_COST;
            }

            const shouldRemove = processDeathLifecycle(entity, entity.attributes, now);
            
            if (!shouldRemove) {
                const updatedBot = processBioBot(entity, lands, now, speed, interactionRadius);
                finalEntities.push(updatedBot);
            }
            return;
        }

        finalEntities.push(entity);
    });

    return {
        entities: finalEntities,
        playerEnergyConsumed
    };
};

export const updateEntityPosition = (entity: GameEntity, allEntities: GameEntity[], speed: number, radius: number): GameEntity => {
    return processBioBot(entity, allEntities, Date.now(), speed, radius);
};

export const getBotResponse = (userText: string, personality: string, status: string): string => {
    if (status === 'muerto') return "... (Sin respuesta)";

    if (userText.toLowerCase().includes('hola')) {
        return `Saludos. Mi estado actual es ${status}.`;
    } else if (userText.toLowerCase().includes('trabaja')) {
        return "Entendido. Buscaré una tarea productiva de inmediato.";
    } else {
        if (personality === 'Lógico') return "Análisis completado. Los parámetros son aceptables.";
        else if (personality === 'Curioso') return "¿Es esa la voluntad del cosmos? Interesante...";
        else if (personality === 'Protector') return "Mantendré la seguridad del perímetro.";
        else return "Recibido. Transmisión guardada en mi memoria central.";
    }
};