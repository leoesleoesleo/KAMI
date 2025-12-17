import { GameEntity, EntityType, Vector2, Gender, EntityAttributes, BlockType } from '../types';
import { GAME_CONFIG } from '../gameConfig';
import { WORLD_SIZE } from '../constants';

export const WALLET_CENTER: Vector2 = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };

// --- HELPERS ---

export const getRandomGender = (): Gender => {
    return Math.random() > 0.3 ? Gender.MALE : Gender.FEMALE;
};

export const snapToGrid = (position: Vector2): Vector2 => {
    const gridSize = GAME_CONFIG.STRUCTURES.GRID_SIZE;
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
    };
};

export const ensureOutsideWallet = (position: Vector2): Vector2 => {
    const walletRadius = 100; // Safe zone
    const dx = position.x - WALLET_CENTER.x;
    const dy = position.y - WALLET_CENTER.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < walletRadius) {
        const angle = Math.atan2(dy, dx);
        return {
            x: WALLET_CENTER.x + Math.cos(angle) * walletRadius,
            y: WALLET_CENTER.y + Math.sin(angle) * walletRadius
        };
    }
    return position;
};

// --- CREATORS ---

export const createPersonJSON = (gender: Gender, name?: string): EntityAttributes => {
    const personalities = ['Lógico', 'Curioso', 'Protector', 'Eficiente', 'Agresivo', 'Analítico'];
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    
    return {
        nombre: name || `Unit-${Math.floor(Math.random() * 1000)}`,
        sexo: gender,
        edad: 1,
        energia: 100,
        estado: 'ocioso',
        personalidad: randomPersonality,
        fuerza: Math.floor(Math.random() * 10) + 1,
        inteligencia: Math.floor(Math.random() * 10) + 1,
        individualScore: 0,
        holdingCryptos: 0,
        evolutionLevel: 1,
        jobsCompleted: 0,
        kills: 0
    };
};

export const createPersonEntity = (attributes: EntityAttributes, position: Vector2): GameEntity => {
    const seed = attributes.nombre;
    const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}&backgroundColor=${attributes.sexo === Gender.MALE ? 'c0aede' : 'ffd5dc'}`;
    
    return {
        id: crypto.randomUUID(),
        type: EntityType.PERSON,
        position,
        attributes,
        avatarUrl,
        createdAt: Date.now()
    };
};

export const createLandEntity = (position: Vector2): GameEntity => {
    return {
        id: crypto.randomUUID(),
        type: EntityType.LAND,
        position,
        landAttributes: {
            resourceLevel: 0,
            isGhost: false
        },
        createdAt: Date.now()
    };
};

export const createGhostNode = (): GameEntity => {
    const x = Math.random() * (WORLD_SIZE - 200) + 100;
    const y = Math.random() * (WORLD_SIZE - 200) + 100;
    
    return {
        id: crypto.randomUUID(),
        type: EntityType.LAND,
        position: { x, y },
        landAttributes: {
            resourceLevel: Math.floor(Math.random() * 50) + 50,
            isGhost: true
        },
        createdAt: Date.now()
    };
};

export const createWalletEntity = (position: Vector2): GameEntity => {
    return {
        id: 'WALLET_CORE',
        type: EntityType.WALLET,
        position,
        createdAt: Date.now()
    };
};

export const createBlockEntity = (type: BlockType, position: Vector2): GameEntity => {
    return {
        id: crypto.randomUUID(),
        type: EntityType.BLOCK,
        position: snapToGrid(position),
        blockAttributes: {
            type,
            durability: type === BlockType.FIREWALL ? GAME_CONFIG.STRUCTURES.DURABILITY.FIREWALL : GAME_CONFIG.STRUCTURES.DURABILITY.ENCRYPTION
        },
        createdAt: Date.now()
    };
};

export const createIntruderEntity = (): GameEntity => {
    const angle = Math.random() * Math.PI * 2;
    const radius = WORLD_SIZE / 2;
    const x = WALLET_CENTER.x + Math.cos(angle) * radius;
    const y = WALLET_CENTER.y + Math.sin(angle) * radius;

    return {
        id: crypto.randomUUID(),
        type: EntityType.INTRUDER,
        position: { x, y },
        intruderAttributes: {
            state: 'seeking',
            targetId: 'WALLET_CORE',
            tentaclePhase: 0
        },
        createdAt: Date.now()
    };
};

export const createTornadoEntity = (): GameEntity => {
    const x = Math.random() * WORLD_SIZE;
    const y = Math.random() * WORLD_SIZE;
    return {
        id: crypto.randomUUID(),
        type: EntityType.TORNADO,
        position: { x, y },
        tornadoAttributes: {
            creationTime: Date.now(),
            duration: Math.random() * (GAME_CONFIG.TORNADO.MAX_DURATION_MS - GAME_CONFIG.TORNADO.MIN_DURATION_MS) + GAME_CONFIG.TORNADO.MIN_DURATION_MS,
            wanderAngle: Math.random() * Math.PI * 2
        },
        createdAt: Date.now()
    };
};

export const createBlackHoleEntity = (): GameEntity => {
    const x = Math.random() * WORLD_SIZE;
    const y = Math.random() * WORLD_SIZE;
    return {
        id: crypto.randomUUID(),
        type: EntityType.BLACK_HOLE,
        position: { x, y },
        blackHoleAttributes: {
            creationTime: Date.now(),
            duration: Math.random() * (GAME_CONFIG.BLACK_HOLE.MAX_DURATION_MS - GAME_CONFIG.BLACK_HOLE.MIN_DURATION_MS) + GAME_CONFIG.BLACK_HOLE.MIN_DURATION_MS,
            moveAngle: Math.random() * Math.PI * 2
        },
        createdAt: Date.now()
    };
};

export const createExplosionEntity = (): GameEntity => {
    const x = Math.random() * WORLD_SIZE;
    const y = Math.random() * WORLD_SIZE;
    return {
        id: crypto.randomUUID(),
        type: EntityType.EXPLOSION,
        position: { x, y },
        explosionAttributes: {
            creationTime: Date.now(),
            duration: GAME_CONFIG.EXPLOSION.DURATION_MS,
            radius: GAME_CONFIG.EXPLOSION.RADIUS
        },
        createdAt: Date.now()
    };
};

export const createAgentEntity = (): GameEntity => {
    const angle = Math.random() * Math.PI * 2;
    const radius = WORLD_SIZE / 2;
    const x = WALLET_CENTER.x + Math.cos(angle) * radius;
    const y = WALLET_CENTER.y + Math.sin(angle) * radius;

    return {
        id: crypto.randomUUID(),
        type: EntityType.AGENT,
        position: { x, y },
        agentAttributes: {
            state: 'seeking',
            targetId: undefined
        },
        createdAt: Date.now()
    };
};

// --- LOGIC FUNCTIONS ---

export const calculateWorkPoints = (resourceLevel: number): number => {
    if (resourceLevel >= 100) return GAME_CONFIG.SCORING.GREEN_TICK;
    if (resourceLevel >= 50) return GAME_CONFIG.SCORING.PINK_TICK;
    return GAME_CONFIG.SCORING.YELLOW_TICK;
};

export const processLandDecay = (entity: GameEntity, now: number): boolean => {
    if (entity.type !== EntityType.LAND || !entity.landAttributes) return false;
    
    if (entity.landAttributes.resourceLevel <= 0) {
        if (!entity.landAttributes.emptySince) {
            entity.landAttributes.emptySince = now;
        } else if (now - entity.landAttributes.emptySince > GAME_CONFIG.LAND.DECAY_TIMEOUT_MS) {
            return true;
        }
    } else {
        entity.landAttributes.emptySince = undefined;
    }
    return false;
};

export const processDeathLifecycle = (entity: GameEntity, attr: EntityAttributes, now: number): boolean => {
    if (attr.estado === 'muerto') {
        const timeSinceDeath = now - (attr.deathTimestamp || 0);
        const totalFadeTime = GAME_CONFIG.DEATH.TIME_FROZEN_MS + GAME_CONFIG.DEATH.FADE_DURATION_MS;
        return timeSinceDeath > totalFadeTime;
    }

    if (attr.energia <= 0) {
        if (!attr.zeroEnergySince) {
            attr.zeroEnergySince = now;
        } else if (now - attr.zeroEnergySince > GAME_CONFIG.DEATH.TIME_TO_DIE_MS) {
            attr.estado = 'muerto';
            attr.deathTimestamp = now;
            attr.zeroEnergySince = undefined;
        }
    } else {
        attr.zeroEnergySince = undefined;
    }
    
    return false;
};

export const processBioBot = (entity: GameEntity, entities: GameEntity[], now: number, speedMultiplier: number, interactionRadius: number) => {
    if (!entity.attributes || entity.attributes.estado === 'muerto') return;

    const attr = entity.attributes;
    
    let newState = attr.estado;
    let target = entity.targetPosition;
    let velocity = { x: 0, y: 0 };

    const isHungry = attr.energia < 90;
    
    let nearestLand: GameEntity | null = null;
    let minDist = Infinity;
    
    entities.forEach(e => {
        if (e.type === EntityType.LAND && e.landAttributes && e.landAttributes.resourceLevel > 0) {
            const dx = e.position.x - entity.position.x;
            const dy = e.position.y - entity.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearestLand = e;
            }
        }
    });

    const landHasResources = nearestLand && (nearestLand as GameEntity).landAttributes!.resourceLevel > 0;
    const inInteractionRange = nearestLand && minDist < GAME_CONFIG.BIOBOT.FEEDING_RADIUS;
    const isInCombat = newState === 'peleando' || newState === 'cazando' || newState === 'recolectando';

    if (newState === 'trabajando') {
        if (!nearestLand) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
        } else if ((nearestLand as GameEntity).landAttributes && (nearestLand as GameEntity).landAttributes!.resourceLevel === 0) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
        }
    }

    if (isHungry && landHasResources && inInteractionRange && !isInCombat) {
        newState = 'alimentandose';
        attr.estado = 'alimentandose';
        attr.energia = Math.min(GAME_CONFIG.BIOBOT.MAX_ENERGY, attr.energia + GAME_CONFIG.BIOBOT.ENERGY_RECHARGE_RATE);

        if (nearestLand && (nearestLand as GameEntity).landAttributes) {
            (nearestLand as GameEntity).landAttributes!.resourceLevel = Math.max(0, (nearestLand as GameEntity).landAttributes!.resourceLevel - GAME_CONFIG.CROP.CONSUMPTION_RATE);
        }
    } 
    else if (newState === 'trabajando' && nearestLand) {
        const resources = (nearestLand as GameEntity).landAttributes?.resourceLevel || 0;
        if (resources > 0) {
             const pointsToAdd = calculateWorkPoints(resources);
             attr.holdingCryptos = (attr.holdingCryptos || 0) + pointsToAdd;
             attr.individualScore = (attr.individualScore || 0) + pointsToAdd;
             
             if (attr.sexo === Gender.FEMALE && attr.evolutionLevel === 1) {
                 if (Math.random() < 0.001) {
                     attr.jobsCompleted = (attr.jobsCompleted || 0) + 1;
                     if (attr.jobsCompleted >= GAME_CONFIG.EVOLUTION.MINING_THRESHOLD) {
                         attr.evolutionLevel = 2;
                         attr.workMode = 'miner';
                     }
                 }
             }
        }
    }
    else if (newState === 'alimentandose' && (!isHungry || !landHasResources)) {
        newState = 'ocioso';
        attr.estado = 'ocioso';
    }

    if (newState === 'cazando' && attr.combatTargetId) {
        const targetEntity = entities.find(e => e.id === attr.combatTargetId);
        if (targetEntity) {
             const dx = targetEntity.position.x - entity.position.x;
             const dy = targetEntity.position.y - entity.position.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             
             if (dist <= GAME_CONFIG.COMBAT.MAX_DISTANCE) {
                 newState = 'peleando';
                 attr.estado = 'peleando';
             } else {
                 const angle = Math.atan2(dy, dx);
                 velocity.x = Math.cos(angle) * GAME_CONFIG.WORLD.SPEED * speedMultiplier;
                 velocity.y = Math.sin(angle) * GAME_CONFIG.WORLD.SPEED * speedMultiplier;
             }
             attr.combatTargetPosition = targetEntity.position;
        } else {
            newState = 'ocioso';
            attr.estado = 'ocioso';
            attr.combatTargetId = undefined;
            attr.combatTargetPosition = undefined;
        }
    }
    else if (newState === 'peleando') {
         const targetEntity = entities.find(e => e.id === attr.combatTargetId);
         if (!targetEntity) {
            newState = 'ocioso';
            attr.estado = 'ocioso';
            attr.combatTargetId = undefined;
            attr.combatTargetPosition = undefined;
         } else {
            attr.combatTargetPosition = targetEntity.position;
         }
    }
    else if (newState === 'ocioso' || newState === 'socializando') {
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            target = {
                x: entity.position.x + Math.cos(angle) * 50,
                y: entity.position.y + Math.sin(angle) * 50
            };
        }
        
        if (target) {
            const dx = target.x - entity.position.x;
            const dy = target.y - entity.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                const angle = Math.atan2(dy, dx);
                velocity.x = Math.cos(angle) * GAME_CONFIG.WORLD.SPEED * 0.5 * speedMultiplier;
                velocity.y = Math.sin(angle) * GAME_CONFIG.WORLD.SPEED * 0.5 * speedMultiplier;
            } else {
                target = undefined;
            }
        }
    }
    else if (newState === 'trabajando' && nearestLand) {
        const dx = nearestLand.position.x - entity.position.x;
        const dy = nearestLand.position.y - entity.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 20) {
             const angle = Math.atan2(dy, dx);
             velocity.x = Math.cos(angle) * GAME_CONFIG.WORLD.SPEED * speedMultiplier;
             velocity.y = Math.sin(angle) * GAME_CONFIG.WORLD.SPEED * speedMultiplier;
        }
    }

    entity.position.x += velocity.x;
    entity.position.y += velocity.y;
    
    entity.position.x = Math.max(0, Math.min(WORLD_SIZE, entity.position.x));
    entity.position.y = Math.max(0, Math.min(WORLD_SIZE, entity.position.y));
    
    if (newState === 'trabajando') attr.energia -= GAME_CONFIG.BIOBOT.ENERGY_DECAY_WORK;
    else if (Math.abs(velocity.x) > 0 || Math.abs(velocity.y) > 0) attr.energia -= GAME_CONFIG.BIOBOT.ENERGY_DECAY_MOVE;
    else attr.energia -= GAME_CONFIG.BIOBOT.ENERGY_DECAY_IDLE;

    entity.targetPosition = target;
};

export const updateWorldState = (entities: GameEntity[], speed: number, interactionRadius: number, nowOverride?: number) => {
    const now = nowOverride || Date.now();
    let playerEnergyConsumed = 0;
    
    let activeEntities = entities.filter(e => {
        if (e.type === EntityType.LAND) {
            return !processLandDecay(e, now);
        }
        if (e.type === EntityType.PERSON && e.attributes) {
            return !processDeathLifecycle(e, e.attributes, now);
        }
        if (e.type === EntityType.INTRUDER && e.intruderAttributes?.isDying) {
            if (now - (e.intruderAttributes.deathTimestamp || 0) > GAME_CONFIG.INTRUDER.EXPLOSION_DURATION_MS) {
                return false;
            }
        }
        if (e.type === EntityType.TORNADO && e.tornadoAttributes) {
            if (now - e.tornadoAttributes.creationTime > e.tornadoAttributes.duration) return false;
        }
        if (e.type === EntityType.BLACK_HOLE && e.blackHoleAttributes) {
            if (now - e.blackHoleAttributes.creationTime > e.blackHoleAttributes.duration) return false;
        }
        if (e.type === EntityType.EXPLOSION && e.explosionAttributes) {
            if (now - e.explosionAttributes.creationTime > e.explosionAttributes.duration) return false;
        }

        return true;
    });

    activeEntities.forEach(entity => {
        if (entity.type === EntityType.PERSON) {
            processBioBot(entity, activeEntities, now, 1, interactionRadius);
        }

        if (entity.type === EntityType.INTRUDER && entity.intruderAttributes && !entity.intruderAttributes.isDying) {
            const wallet = activeEntities.find(e => e.type === EntityType.WALLET);
            const structures = activeEntities.filter(e => e.type === EntityType.BLOCK);
            
            let target = wallet;
            let minDist = Infinity;
            
            structures.forEach(s => {
                const dx = s.position.x - entity.position.x;
                const dy = s.position.y - entity.position.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDist && d < 200) {
                    minDist = d;
                    target = s;
                }
            });

            if (target) {
                const dx = target.position.x - entity.position.x;
                const dy = target.position.y - entity.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < GAME_CONFIG.INTRUDER.ATTACK_RADIUS) {
                    entity.intruderAttributes.state = target.type === EntityType.BLOCK ? 'attacking_structure' : 'attacking';
                    
                    if (target.type === EntityType.BLOCK && target.blockAttributes) {
                        target.blockAttributes.durability -= 10;
                    }
                } else {
                    entity.intruderAttributes.state = 'seeking';
                    const angle = Math.atan2(dy, dx);
                    entity.position.x += Math.cos(angle) * GAME_CONFIG.INTRUDER.SPEED;
                    entity.position.y += Math.sin(angle) * GAME_CONFIG.INTRUDER.SPEED;
                }
            }
            
            entity.intruderAttributes.tentaclePhase = (now / 200) % (Math.PI * 2);
        }

        if (entity.type === EntityType.TORNADO && entity.tornadoAttributes) {
            const angle = entity.tornadoAttributes.wanderAngle;
            entity.position.x += Math.cos(angle) * GAME_CONFIG.TORNADO.SPEED;
            entity.position.y += Math.sin(angle) * GAME_CONFIG.TORNADO.SPEED;
            
            if (Math.random() < 0.05) {
                entity.tornadoAttributes.wanderAngle += (Math.random() - 0.5);
            }

            activeEntities.forEach(other => {
                if (other.type === EntityType.PERSON && other.attributes) {
                     const dx = other.position.x - entity.position.x;
                     const dy = other.position.y - entity.position.y;
                     const d = Math.sqrt(dx * dx + dy * dy);
                     if (d < GAME_CONFIG.TORNADO.DESTRUCTION_RADIUS) {
                         other.attributes.energia -= 0.5;
                         const pushAngle = Math.atan2(dy, dx);
                         other.position.x += Math.cos(pushAngle) * 5;
                         other.position.y += Math.sin(pushAngle) * 5;
                     }
                }
            });
        }
        
        if (entity.type === EntityType.AGENT && entity.agentAttributes) {
            const bots = activeEntities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto');
            if (bots.length > 0) {
                 const target = bots[0];
                 const dx = target.position.x - entity.position.x;
                 const dy = target.position.y - entity.position.y;
                 const dist = Math.sqrt(dx * dx + dy * dy);
                 
                 if (dist < GAME_CONFIG.AGENT.ATTACK_RANGE) {
                     entity.agentAttributes.state = 'attacking';
                     entity.agentAttributes.targetId = target.id;
                     entity.agentAttributes.combatTargetPosition = target.position;
                     target.attributes!.energia -= GAME_CONFIG.AGENT.DAMAGE_PER_FRAME;
                 } else {
                     entity.agentAttributes.state = 'seeking';
                     const angle = Math.atan2(dy, dx);
                     entity.position.x += Math.cos(angle) * GAME_CONFIG.AGENT.SPEED;
                     entity.position.y += Math.sin(angle) * GAME_CONFIG.AGENT.SPEED;
                 }
            } else {
                entity.agentAttributes.state = 'seeking';
            }
        }
    });

    activeEntities = activeEntities.filter(e => {
        if (e.type === EntityType.BLOCK && e.blockAttributes && e.blockAttributes.durability <= 0) return false;
        return true;
    });

    activeEntities.forEach(attacker => {
        if (attacker.type === EntityType.PERSON && attacker.attributes?.estado === 'peleando' && attacker.attributes.combatTargetId) {
            const target = activeEntities.find(e => e.id === attacker.attributes!.combatTargetId);
            if (target && target.type === EntityType.INTRUDER) {
                if (target.intruderAttributes) {
                    target.intruderAttributes.isDying = true;
                    target.intruderAttributes.deathTimestamp = now;
                    attacker.attributes.estado = 'ocioso';
                    attacker.attributes.combatTargetId = undefined;
                    attacker.attributes.combatTargetPosition