
import { EntityAttributes, Gender, Vector2, EntityType, GameEntity, LandAttributes, EventType, EventCategory, EventSeverity } from '../types';
import { WORLD_SIZE } from '../constants';
import { GAME_CONFIG } from '../gameConfig';
import { Logger } from './LoggerService';

// --- DATA CONSTANTS ---
const NAMES_MALE = ["X-1", "Kryon", "Zet", "Aron-9", "Vector", "Helix", "Cobalt", "Neon", "Flux", "Titan"];
const NAMES_FEMALE = ["Aura", "Nova", "Sila", "Vea-7", "Luma", "Iris", "Echo", "Mirage", "Prisma", "Solaris"];
const PERSONALITIES = ["Lógico", "Protector", "Curioso", "Eficiente", "Místico", "Líder", "Creativo", "Guardián"];

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

export const generateRandomPosition = (center: Vector2, radius: number = 200): Vector2 => {
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * radius;
  return {
    x: Math.max(0, Math.min(WORLD_SIZE, center.x + r * Math.cos(angle))),
    y: Math.max(0, Math.min(WORLD_SIZE, center.y + r * Math.sin(angle))),
  };
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
    individualScore: 0
  };
};

export const createPersonEntity = (attributes: EntityAttributes, position: Vector2): GameEntity => {
  // Palette for Males: Darker Golds, Ochres, Industrial Yellows
  const MALE_YELLOWS = ["eab308", "ca8a04", "a16207", "facc15", "fbbf24"]; 
  // Palette for Females: Light Pastels, Lemons, Creams
  const FEMALE_YELLOWS = ["fef08a", "fde047", "facc15", "fffbeb", "fef9c3"];

  const colorPalette = attributes.sexo === Gender.MALE ? MALE_YELLOWS.join(',') : FEMALE_YELLOWS.join(',');
  const seedPrefix = attributes.sexo === Gender.MALE ? "mech-" : "bio-";
  
  // Using 'bottts' for Bio-bots style
  // We pass 'colors' to force the yellow theme
  const avatarSeed = `${seedPrefix}${attributes.nombre}-${Math.random()}`;
  
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}&colors=${colorPalette}&backgroundColor=transparent`;

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
      { id: entity.id, name: attributes.nombre, gender: attributes.sexo }
  );

  return entity;
};

export const createLandEntity = (position: Vector2): GameEntity => {
  const entity = {
    id: generateUUID(),
    type: EntityType.LAND,
    position,
    landAttributes: {
        resourceLevel: GAME_CONFIG.LAND.INITIAL_RESOURCE,
        emptySince: Date.now() 
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

    let newState = attr.estado;
    let newPos = { ...entity.position };
    const prevEnergia = attr.energia;

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
    if (newState === 'trabajando') {
        if (nearestLand && nearestLand.landAttributes && nearestLand.landAttributes.resourceLevel === 0) {
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
             attr.individualScore = (attr.individualScore || 0) + pointsToAdd;
        }
    }
    else if (newState === 'alimentandose' && (!isHungry || !landHasResources)) {
        newState = 'ocioso';
        attr.estado = 'ocioso';
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
    overrideNow?: number
): GameEntity[] => {
    
    const now = overrideNow || Date.now();
    
    const nextEntities = entities.map(e => ({
        ...e,
        position: {...e.position},
        attributes: e.attributes ? {...e.attributes} : undefined,
        landAttributes: e.landAttributes ? {...e.landAttributes} : undefined
    }));

    const lands = nextEntities.filter(e => e.type === EntityType.LAND);
    const finalEntities: GameEntity[] = [];

    nextEntities.forEach(entity => {
        if (entity.type === EntityType.LAND) {
            const shouldRemove = processLandDecay(entity, now);
            if (!shouldRemove) {
                finalEntities.push(entity);
            }
            return;
        }

        if (entity.type === EntityType.PERSON && entity.attributes) {
            const shouldRemove = processDeathLifecycle(entity, entity.attributes, now);
            
            if (!shouldRemove) {
                const updatedBot = processBioBot(entity, lands, now, speed, interactionRadius);
                finalEntities.push(updatedBot);
            }
            return;
        }

        finalEntities.push(entity);
    });

    return finalEntities;
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
