import React, { useState, useEffect, useRef } from 'react';
import { StartScreen } from './components/StartScreen';
import { WorldCanvas } from './components/WorldCanvas';
import { GameInterface } from './components/GameInterface';
import { MusicPlayer } from './components/MusicPlayer';
import { InstallPWA } from './components/InstallPWA';
import { LoadingScreen } from './components/LoadingScreen';
import { useGameLoop } from './hooks/useGameLoop';
import { createPersonEntity, createLandEntity, createWalletEntity, createBlockEntity, createGhostNode, ensureOutsideWallet, createIntruderEntity, updateWorldState, generateLevel1Layout } from './services/gameService';
import { RuntimeTestRunner } from './services/RuntimeTestRunner';
import { StorageService } from './services/storageService';
import { AudioManager } from './services/AudioManager'; 
import { GameState, GameEntity, INITIAL_POINTS, EntityAttributes, EntityType, BlockType, ACTION_COST, Vector2 } from './types';
import { WATER_SOUND_URL, AUTOSAVE_INTERVAL_MS } from './constants';
import { GAME_CONFIG } from './gameConfig';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSaveGame, setHasSaveGame] = useState(false);

  const waterAudioRef = useRef<HTMLAudioElement | null>(null);

  const [wastedManaTrigger, setWastedManaTrigger] = useState(0); 
  const [targetLostTrigger, setTargetLostTrigger] = useState(0); 
  const [ghostDetectedTrigger, setGhostDetectedTrigger] = useState(0);
  const [isPlacingLand, setIsPlacingLand] = useState(false);
  
  const [pendingPersonAttributes, setPendingPersonAttributes] = useState<EntityAttributes | null>(null);
  
  const [isTargetingRecharge, setIsTargetingRecharge] = useState(false);
  const [rechargingNodeId, setRechargingNodeId] = useState<string | null>(null);

  const [blocksToPlace, setBlocksToPlace] = useState<number>(0);
  const [placingBlockType, setPlacingBlockType] = useState<BlockType | null>(null);

  const [globalStats, setGlobalStats] = useState({ globalScore: 0, averageEnergy: 0 });
  const [pendingTotalCrypto, setPendingTotalCrypto] = useState(0); // New State for floating pending crypto
  const [showLevelBanner, setShowLevelBanner] = useState<string | null>(null);
  
  // New state to signal interface to close all modals
  const [closeModalsTrigger, setCloseModalsTrigger] = useState(0);

  // --- MULTI-SELECTION STATE ---
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isWatering: false,
    entities: [],
    level: 1,
    player: {
      name: '',
      avatarUrl: '',
      points: INITIAL_POINTS,
      stats: {
        entitiesCreated: 0,
        manaSpent: 0,
        landsCreated: 0,
        cryptoSpent: 0
      }
    }
  });

  const gameStateRef = useRef(gameState);

  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
      waterAudioRef.current = new Audio(WATER_SOUND_URL);
      
      if (StorageService.hasSaveGame()) {
          setHasSaveGame(true);
      }
  }, []);

  useEffect(() => {
    try {
        RuntimeTestRunner.runStartupTests();
    } catch (e) {
        console.warn("Runtime tests failed to execute:", e);
    }
  }, []);

  useEffect(() => {
      if (!isPlaying) return;

      const interval = setInterval(() => {
          const success = StorageService.saveGame(gameStateRef.current);
      }, AUTOSAVE_INTERVAL_MS);

      return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
      if (isTargetingRecharge) {
          const hasLands = gameState.entities.some(e => e.type === EntityType.LAND);
          if (!hasLands) {
              setIsTargetingRecharge(false);
              setTargetLostTrigger(prev => prev + 1); 
          }
      }
  }, [gameState.entities, isTargetingRecharge]);

  // --- GHOST SERVER SPAWNER ---
  useEffect(() => {
      if (!isPlaying || gameState.isPaused) return; 
      if (gameState.level < GAME_CONFIG.GHOST_SYSTEM.START_LEVEL) return;

      const scheduleSpawn = () => {
          const currentEntities = gameStateRef.current.entities;
          const activeBotCount = currentEntities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto').length;
          
          const reduction = activeBotCount * GAME_CONFIG.GHOST_SYSTEM.DYNAMIC.REDUCTION_MS_PER_BOT;
          const minBase = GAME_CONFIG.GHOST_SYSTEM.MIN_INTERVAL_MS;
          const maxBase = GAME_CONFIG.GHOST_SYSTEM.MAX_INTERVAL_MS;
          const randomBase = Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
          
          const delay = Math.max(GAME_CONFIG.GHOST_SYSTEM.DYNAMIC.MIN_HARD_CAP_MS, randomBase - reduction);

          const timeoutId = setTimeout(() => {
              const latestEntities = gameStateRef.current.entities;
              const isStillPaused = gameStateRef.current.isPaused;
              
              if (isStillPaused) {
                  scheduleSpawn(); 
                  return;
              }

              const ghostCount = latestEntities.filter(e => e.type === EntityType.LAND && e.landAttributes?.isGhost).length;

              if (ghostCount < GAME_CONFIG.GHOST_SYSTEM.MAX_CONCURRENT) {
                  const ghostNode = createGhostNode();
                  setGameState(prev => ({
                      ...prev,
                      entities: [...prev.entities, ghostNode]
                  }));
                  setGhostDetectedTrigger(prev => prev + 1);
              }

              scheduleSpawn();
          }, delay);

          return timeoutId;
      };

      const timerId = scheduleSpawn();

      return () => clearTimeout(timerId);
  }, [isPlaying, gameState.level, gameState.isPaused]);

  // --- PERIODIC INTRUDER SPAWNER (WAVE LOGIC) ---
  useEffect(() => {
      if (!isPlaying) return;

      const waveInterval = setInterval(() => {
          if (gameStateRef.current.isPaused) return;

          // Performance Optimization: Check Max Concurrent Intruders
          const currentIntruders = gameStateRef.current.entities.filter(e => e.type === EntityType.INTRUDER).length;
          
          if (currentIntruders >= GAME_CONFIG.INTRUDER.MAX_CONCURRENT) {
              return; // Limit reached
          }

          const currentLevel = gameStateRef.current.level;
          // Count active bots (alive)
          const activeBots = gameStateRef.current.entities.filter(
              e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto'
          ).length;

          // Logic: Spawn Count = Level * Active Bots
          let spawnCount = currentLevel * activeBots;
          
          // Cap spawn count to available slots
          const slotsAvailable = GAME_CONFIG.INTRUDER.MAX_CONCURRENT - currentIntruders;
          spawnCount = Math.min(spawnCount, slotsAvailable);

          if (spawnCount > 0) {
              const newIntruders: GameEntity[] = [];
              for (let i = 0; i < spawnCount; i++) {
                  newIntruders.push(createIntruderEntity());
              }

              setGameState(prev => ({
                  ...prev,
                  entities: [...prev.entities, ...newIntruders]
              }));

          }

      }, 60000); // Runs every 60 seconds (1 minute)

      return () => clearInterval(waveInterval);
  }, [isPlaying]);

  // --- LEVEL UP LOGIC & INITIAL INTRUDER SPAWNING ---
  useEffect(() => {
      if (!isPlaying) return;
      
      const currentLevel = gameState.level;
      const crypto = Math.max(0, globalStats.globalScore - (gameState.player.stats.cryptoSpent || 0));
      const energy = gameState.player.points;
      
      let nextLevel = currentLevel;

      // Check against max level 10
      if (currentLevel < 10) {
          // Determine next level requirement
          let requiredCrypto = Infinity;
          let requiredEnergy = Infinity;

          // Helper to get requirements from config dynamically or use defaults
          const getReq = (lvl: number) => {
              // @ts-ignore - Accessing config by index logic
              const key = `LVL${lvl}`;
              // @ts-ignore
              if (GAME_CONFIG.LEVELS[key]) return GAME_CONFIG.LEVELS[key];
              return { MIN_CRYPTO: Infinity, MIN_ENERGY: Infinity };
          };

          const req = getReq(currentLevel + 1);
          requiredCrypto = req.MIN_CRYPTO;
          requiredEnergy = req.MIN_ENERGY;

          if (crypto >= requiredCrypto || energy >= requiredEnergy) {
              nextLevel = currentLevel + 1;
          }
      }

      // Check Level Up or Level 1 Initialization
      if (nextLevel > currentLevel) {
          setGameState(prev => ({ ...prev, level: nextLevel }));
          setShowLevelBanner(`NIVEL ${nextLevel} ALCANZADO`);
          
          setTimeout(() => {
              setShowLevelBanner(null);
          }, 3000); 
      }
      
      // Note: Initial spawn logic kept for game start flavor, but periodic logic handles the main difficulty curve now.
      if (nextLevel >= 1 && !gameState.hasSpawnedIntruders) {
          // Minimal initial spawn just to introduce the mechanic if no bots exist yet
          const activeBots = Math.max(1, gameState.entities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto').length);
          // Just a small starter pack, distinct from the periodic wave
          const intruderCount = Math.max(1, Math.floor(activeBots * 0.5)); 
          
          if (intruderCount > 0) {
            const newIntruders: GameEntity[] = [];
            for (let i = 0; i < intruderCount; i++) {
                newIntruders.push(createIntruderEntity());
            }

            setGameState(prev => ({
                ...prev,
                entities: [...prev.entities, ...newIntruders],
                hasSpawnedIntruders: true
            }));
          }
      }

  }, [globalStats.globalScore, gameState.player.points, isPlaying, gameState.level, gameState.player.stats.cryptoSpent, gameState.entities, gameState.hasSpawnedIntruders]);


  const [selectedEntity, setSelectedEntity] = useState<GameEntity | null>(null);

  // --- MAIN GAME LOOP HOOK ---
  useGameLoop(
      () => {
          setGameState(prev => {
              // Execute World Physics & Logic
              const { entities: updatedEntities, playerEnergyConsumed } = updateWorldState(
                  prev.entities, 
                  GAME_CONFIG.WORLD.SPEED, 
                  GAME_CONFIG.WORLD.INTERACTION_RADIUS
              );
              
              let totalScore = 0;
              let totalEnergy = 0;
              let botCount = 0;
              let currentPendingCrypto = 0;
              let activeIntrudersStealing = 0;

              updatedEntities.forEach(e => {
                  if (e.type === EntityType.PERSON && e.attributes) {
                      totalScore += e.attributes.individualScore || 0;
                      if (e.attributes.estado !== 'muerto') {
                          totalEnergy += e.attributes.energia;
                          botCount++;
                          currentPendingCrypto += (e.attributes.holdingCryptos || 0);
                      }
                  }
                  
                  // Count attacking intruders
                  if (e.type === EntityType.INTRUDER && e.intruderAttributes?.state === 'attacking') {
                      activeIntrudersStealing++;
                  }
              });

              setGlobalStats({
                  globalScore: Math.floor(totalScore),
                  averageEnergy: botCount > 0 ? Math.floor(totalEnergy / botCount) : 0
              });
              
              setPendingTotalCrypto(Math.floor(currentPendingCrypto));

              if (selectedEntity) {
                  const updatedSelected = updatedEntities.find(e => e.id === selectedEntity.id);
                  if (!updatedSelected) {
                      setSelectedEntity(null);
                  }
              }

              // --- INTRUDER THEFT LOGIC ---
              let newCryptoSpent = prev.player.stats.cryptoSpent || 0;
              if (activeIntrudersStealing > 0) {
                  // Uniform theft calculation
                  const stealAmount = (GAME_CONFIG.INTRUDER.STEAL_RATE_PER_SEC / 60) * activeIntrudersStealing;
                  newCryptoSpent += stealAmount;
              }
              
              // --- PLAYER ENERGY DEDUCTION (COMBAT COST) ---
              // Subtract energyConsumed from points, ensuring we don't go below 0
              const newPoints = Math.max(0, prev.player.points - playerEnergyConsumed);

              return { 
                  ...prev, 
                  entities: updatedEntities,
                  player: {
                      ...prev.player,
                      points: newPoints,
                      stats: {
                          ...prev.player.stats,
                          cryptoSpent: newCryptoSpent
                      }
                  }
              };
          });
      }, 
      isPlaying,
      gameState.isPaused 
  );

  useEffect(() => {
    if (selectedEntity) {
        const liveEntity = gameState.entities.find(e => e.id === selectedEntity.id);
        if (liveEntity && liveEntity !== selectedEntity) {
            setSelectedEntity(liveEntity);
        }
    }
  }, [gameState.entities, selectedEntity]);

  const startGame = (name: string, avatar: string) => {
    AudioManager.playLevel(1, true);

    setIsPlaying(true);
    // NEW: Use Level 1 Generator instead of just a single wallet
    const initialEntities = generateLevel1Layout();
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      entities: initialEntities, 
      level: 1, 
      hasSpawnedIntruders: false,
      player: { 
          ...prev.player, 
          name, 
          avatarUrl: avatar, 
          points: INITIAL_POINTS,
          stats: { entitiesCreated: 0, manaSpent: 0, landsCreated: 0, cryptoSpent: 0 }
      }
    }));
    
  };

  const handleContinueGame = () => {
      const loadedState = StorageService.loadGame();
      if (loadedState) {
          const savedLevel = loadedState.level || 1;
          AudioManager.playLevel(savedLevel, true);

          setGameState({
              ...loadedState,
              isPlaying: true, 
              isPaused: false,
              isWatering: false, 
              level: savedLevel,
              hasSpawnedIntruders: loadedState.hasSpawnedIntruders || false,
              player: {
                  ...loadedState.player,
                  stats: {
                      ...loadedState.player.stats,
                      cryptoSpent: loadedState.player.stats.cryptoSpent || 0 
                  }
              }
          });
          setIsPlaying(true);
      } else {
          alert("Error: Save file corrupted or missing.");
          setHasSaveGame(false);
      }
  };

  const handleExitGame = () => {
      StorageService.saveGame(gameStateRef.current);
      AudioManager.stop();

      setIsPlaying(false);
      setGameState({
        isPlaying: false,
        isPaused: false,
        isWatering: false,
        entities: [],
        level: 1,
        player: {
          name: '',
          avatarUrl: '',
          points: INITIAL_POINTS,
          stats: {
            entitiesCreated: 0,
            manaSpent: 0,
            landsCreated: 0,
            cryptoSpent: 0
          }
        }
      });
      setHasSaveGame(true); 
  };

  const handleRestartGame = () => {
      // NEW: Use Level 1 Generator for Restart as well
      const initialEntities = generateLevel1Layout();
      AudioManager.playLevel(1, true);

      setGameState(prev => ({
        ...prev,
        isWatering: false,
        isPaused: false,
        entities: initialEntities, 
        level: 1,
        hasSpawnedIntruders: false,
        player: {
          ...prev.player,
          points: INITIAL_POINTS,
          stats: {
            entitiesCreated: 0,
            manaSpent: 0,
            landsCreated: 0,
            cryptoSpent: 0
          }
        }
      }));
      setGlobalStats({ globalScore: 0, averageEnergy: 0 });
      setSelectedEntityIds([]);
  };

  const togglePause = () => {
      setGameState(prev => {
          const newPauseState = !prev.isPaused;
          return { ...prev, isPaused: newPauseState };
      });
  };

  const handleSingleNodeRecharge = (nodeId: string) => {
      const COST = GAME_CONFIG.COSTS.RECHARGE;
      if (gameState.player.points < COST) {
        setWastedManaTrigger(prev => prev + 1); // Trigger mana toast
        setIsTargetingRecharge(false);
        return;
      }

      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              points: prev.player.points - COST,
              stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + COST }
          },
          entities: prev.entities.map(e => {
              if (e.id === nodeId && e.type === EntityType.LAND && e.landAttributes) {
                   return {
                       ...e,
                       landAttributes: {
                           ...e.landAttributes,
                           resourceLevel: Math.min(
                                GAME_CONFIG.LAND.MAX_RESOURCE, 
                                e.landAttributes.resourceLevel + GAME_CONFIG.LAND.GROWTH_PER_WATER
                            )
                       }
                   };
              }
              return e;
          })
      }));

      if (waterAudioRef.current) {
        waterAudioRef.current.currentTime = 0;
        waterAudioRef.current.play().catch(e => console.log("Audio play failed", e));
      }

      setRechargingNodeId(nodeId);

      setTimeout(() => {
          setRechargingNodeId(null);
      }, 3000);
      
      setIsTargetingRecharge(false);
  };

  const handleBackgroundClick = () => {
      setSelectedEntity(null);
      setSelectedEntityIds([]); // Clear multi-selection
      setCloseModalsTrigger(prev => prev + 1);
  };

  const handleEntitySelection = (entity: GameEntity) => {
      setSelectedEntity(entity);
      // If we single click an entity, it becomes the only selected entity
      setSelectedEntityIds([entity.id]);
  };

  const handleMultiSelect = (ids: string[]) => {
      setSelectedEntityIds(ids);
      // If only one is selected via box, make it the primary selected entity
      if (ids.length === 1) {
          const entity = gameState.entities.find(e => e.id === ids[0]);
          if (entity) setSelectedEntity(entity);
      } else if (ids.length === 0) {
          setSelectedEntity(null);
      } else {
          // If multiple are selected, clear the single detail view
          setSelectedEntity(null);
      }
  };

  const handleAction = (actionType: string, payload?: any) => {
    
    // --- CHEAT CODE ACTION HANDLER ---
    if (actionType === 'ACTIVATE_LEVEL_CHEAT') {
        const { level, crypto } = payload;
        
        setGameState(prev => ({
            ...prev,
            level: level,
            player: {
                ...prev.player,
                stats: {
                    ...prev.player.stats,
                    // Cheat Math: To "give" crypto, we adjust `cryptoSpent`.
                    // Available = GlobalScore - CryptoSpent.
                    // We want Available = Crypto (payload).
                    // So: Crypto = GlobalScore - NewSpent
                    // NewSpent = GlobalScore - Crypto
                    cryptoSpent: globalStats.globalScore - crypto
                }
            }
        }));
        
        setShowLevelBanner(`NIVEL ${level} DESBLOQUEADO`);
        setTimeout(() => setShowLevelBanner(null), 3000);
        return;
    }

    if (actionType === 'BUY_STRUCTURE') {
        const { type, quantity, totalCost } = payload;
        
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                stats: {
                    ...prev.player.stats,
                    cryptoSpent: (prev.player.stats.cryptoSpent || 0) + totalCost
                }
            }
        }));

        setBlocksToPlace(quantity);
        setPlacingBlockType(type);
        
        return;
    }

    if (actionType === 'EXCHANGE_CRYPTO') {
        const EXCHANGE_RATE = 10; 
        const currentGlobalScore = globalStats.globalScore;
        const alreadySpent = gameState.player.stats.cryptoSpent || 0;
        const availableCrypto = Math.max(0, currentGlobalScore - alreadySpent);

        const amountToExchange = payload?.amount || 0;

        if (amountToExchange <= 0) return;
        if (amountToExchange > availableCrypto) return; 

        const energyGain = Math.floor(amountToExchange / EXCHANGE_RATE);
        const cryptoCost = energyGain * EXCHANGE_RATE;

        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                points: prev.player.points + energyGain,
                stats: {
                    ...prev.player.stats,
                    cryptoSpent: (prev.player.stats.cryptoSpent || 0) + cryptoCost
                }
            }
        }));

        return;
    }

    if (actionType === 'KILL_ENTITY') {
        setGameState(prev => {
            const updatedEntities = prev.entities.map(e => {
                if (e.id === payload && e.type === EntityType.PERSON && e.attributes) {
                    
                    return {
                        ...e,
                        targetPosition: undefined, 
                        velocity: { x: 0, y: 0 },
                        attributes: {
                            ...e.attributes,
                            estado: 'muerto' as const,
                            deathTimestamp: Date.now(),
                            energia: 0,
                            holdingCryptos: 0
                        }
                    };
                }
                return e;
            });
            return {
                ...prev,
                entities: updatedEntities
            };
        });
        return;
    }

    if (actionType === 'REVIVE_ENTITY') {
        const REVIVE_COST = 10;
        if (gameState.player.points < REVIVE_COST) return; 

        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                points: prev.player.points - REVIVE_COST,
                stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + REVIVE_COST }
            },
            entities: prev.entities.map(e => {
                if (e.id === payload && e.type === EntityType.PERSON && e.attributes && e.attributes.estado === 'muerto') {
                    return {
                        ...e,
                        attributes: {
                            ...e.attributes,
                            estado: 'ocioso' as const,
                            energia: 50, 
                            deathTimestamp: undefined,
                            zeroEnergySince: undefined,
                            holdingCryptos: 0
                        }
                    };
                }
                return e;
            })
        }));
        return;
    }

    // --- NEW: SET COMBAT MODE ---
    if (actionType === 'SET_COMBAT_MODE') {
        const { entityId, mode } = payload;
        setGameState(prev => ({
            ...prev,
            entities: prev.entities.map(e => {
                if (e.id === entityId && e.attributes) {
                    return {
                        ...e,
                        attributes: {
                            ...e.attributes,
                            combatMode: mode
                        }
                    };
                }
                return e;
            })
        }));
        return;
    }

    // --- NEW: SET WORK MODE ---
    if (actionType === 'SET_WORK_MODE') {
        const { entityId, mode } = payload;
        setGameState(prev => ({
            ...prev,
            entities: prev.entities.map(e => {
                if (e.id === entityId && e.attributes) {
                    return {
                        ...e,
                        attributes: {
                            ...e.attributes,
                            workMode: mode
                        }
                    };
                }
                return e;
            })
        }));
        return;
    }

    // --- NEW: SPECIAL ATTACK TITAN ---
    if (actionType === 'SPECIAL_ATTACK') {
        const entityId = payload;
        const COST = GAME_CONFIG.COMBAT.SPECIAL_ATTACK.COST;
        const MIN_VIT = GAME_CONFIG.COMBAT.SPECIAL_ATTACK.MIN_VITALITY;

        // Security Checks
        if (gameState.player.points < COST) return;
        const bot = gameState.entities.find(e => e.id === entityId);
        if (!bot || !bot.attributes || bot.attributes.energia < MIN_VIT) return;

        // 1. Deduct Player Mana
        // 2. Kill ALL Intruders (Global wipe)
        // 3. Set Bot state to performing special (visuals)
        
        setGameState(prev => {
            const updatedEntities = prev.entities.map(e => {
                // Update the Titan Bot
                if (e.id === entityId && e.attributes) {
                    return {
                        ...e,
                        attributes: {
                            ...e.attributes,
                            isPerformingSpecial: true // Triggers giant scale
                        }
                    };
                }
                // Kill all Intruders
                if (e.type === EntityType.INTRUDER && e.intruderAttributes && !e.intruderAttributes.isDying) {
                    return {
                        ...e,
                        intruderAttributes: {
                            ...e.intruderAttributes,
                            isDying: true,
                            deathTimestamp: Date.now()
                        }
                    };
                }
                return e;
            });

            return {
                ...prev,
                entities: updatedEntities,
                player: {
                    ...prev.player,
                    points: prev.player.points - COST,
                    stats: {
                        ...prev.player.stats,
                        manaSpent: prev.player.stats.manaSpent + COST
                    }
                }
            };
        });

        // 4. Reset Timer: After duration, shrink and drain energy to 0
        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                entities: prev.entities.map(e => {
                    if (e.id === entityId && e.attributes) {
                        return {
                            ...e,
                            attributes: {
                                ...e.attributes,
                                isPerformingSpecial: false,
                                energia: 0 // Drains to 0 as penalty
                            }
                        };
                    }
                    return e;
                })
            }));
        }, GAME_CONFIG.COMBAT.SPECIAL_ATTACK.DURATION_MS);

        return;
    }

    // --- COMBAT HANDLER (UPDATED for Hunt & Attack) ---
    if (actionType === 'ATTACK_INTRUDER') {
        const attackerId = payload;
        
        // Find attacker entity
        const attacker = gameState.entities.find(e => e.id === attackerId);
        if (!attacker || !attacker.attributes) return;

        // Find nearest intruder TO THIS SPECIFIC BOT
        let nearestIntruder: GameEntity | null = null;
        let minDist = Infinity;

        gameState.entities.forEach(e => {
            if (e.type === EntityType.INTRUDER) {
                const dx = e.position.x - attacker.position.x;
                const dy = e.position.y - attacker.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIntruder = e;
                }
            }
        });

        if (nearestIntruder) {
            // Initiate HUNTING mode (Cazando)
            // The logic to move closer and THEN attack is handled in updateWorldState -> processBioBot
            
            setGameState(prev => ({
                ...prev,
                entities: prev.entities.map(e => {
                    if (e.id === attackerId && e.attributes) {
                        return {
                            ...e,
                            attributes: {
                                ...e.attributes,
                                estado: 'cazando', // New state
                                combatTargetId: (nearestIntruder as GameEntity).id,
                                combatTargetPosition: (nearestIntruder as GameEntity).position
                            }
                        };
                    }
                    return e;
                })
            }));
        } else {
             // If no intruder found
             setTargetLostTrigger(prev => prev + 1);
        }
        return;
    }

    if (gameState.player.points < ACTION_COST) return;

    if (actionType === 'CREATE_LAND') {
        setIsPlacingLand(true);
        return;
    }
    
    if (actionType === 'CREATE_PERSON') {
        setPendingPersonAttributes(payload as EntityAttributes);
        return;
    }

    if (actionType === 'CREATE_RAIN') {
        const lands = gameState.entities.filter(e => e.type === EntityType.LAND);
        const hasLand = lands.length > 0;
        
        if (!hasLand) {
            setGameState(prev => ({
                ...prev,
                player: { 
                    ...prev.player, 
                    points: prev.player.points - ACTION_COST,
                    stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + ACTION_COST }
                }
            }));
            setWastedManaTrigger(prev => prev + 1);
            return;
        } 
        
        setIsTargetingRecharge(true);
        return;
    } else {
        setGameState(prev => ({
            ...prev,
            player: { 
                ...prev.player, 
                points: prev.player.points - ACTION_COST,
                stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + ACTION_COST }
            }
        }));
    }

    switch (actionType) {
        case 'CREATE_WORK':
            const workEndTime = Date.now() + GAME_CONFIG.BIOBOT.WORK_DURATION_MS; 
            
            // Check if we are targeting a specific bot (payload is ID)
            const targetId = payload;

            setGameState(prev => ({
                ...prev,
                entities: prev.entities.map(e => {
                    // If targetId is provided, only update that entity
                    if (targetId && e.id !== targetId) return e;

                    if (e.attributes && e.attributes.estado !== 'muerto') {
                        return {
                             ...e,
                             attributes: { ...e.attributes, estado: 'trabajando', workEndTime: workEndTime }
                        };
                    }
                    return e;
                })
            }));
            break;
    }
  };

  const handleLandPlacement = (position: Vector2) => {
    // Ensure position is valid (not inside wallet)
    const safePos = ensureOutsideWallet(position);

    if (blocksToPlace > 0 && placingBlockType) {
        const newBlock = createBlockEntity(placingBlockType, safePos);
        setGameState(prev => ({
            ...prev,
            entities: [...prev.entities, newBlock]
        }));
        
        setBlocksToPlace(prev => {
            const next = prev - 1;
            if (next === 0) setPlacingBlockType(null);
            return next;
        });
        return;
    }

    if (pendingPersonAttributes) {
        handlePersonPlacement(safePos);
        return;
    }

    const COST = GAME_CONFIG.COSTS.NEW_LAND;
    if (gameState.player.points < COST) return;

    const newLand = createLandEntity(safePos);
    
    setGameState(prev => ({ 
        ...prev, 
        entities: [...prev.entities, newLand],
        player: { 
            ...prev.player, 
            points: prev.player.points - COST,
            stats: { ...prev.player.stats, landsCreated: prev.player.stats.landsCreated + 1, manaSpent: prev.player.stats.manaSpent + COST, cryptoSpent: prev.player.stats.cryptoSpent || 0 } 
        }
    }));
    
    setIsPlacingLand(false);
  };
  
  const handlePersonPlacement = (position: Vector2) => {
      // Ensure position is valid
      const safePos = ensureOutsideWallet(position);

      if (!pendingPersonAttributes) return;
      const COST = GAME_CONFIG.COSTS.NEW_BIOBOT;
      if (gameState.player.points < COST) return;

      const newPerson = createPersonEntity(pendingPersonAttributes, safePos);
      
      setGameState(prev => ({ 
          ...prev, 
          entities: [...prev.entities, newPerson],
          player: { 
              ...prev.player, 
              points: prev.player.points - COST,
              stats: { ...prev.player.stats, entitiesCreated: prev.player.stats.entitiesCreated + 1, manaSpent: prev.player.stats.manaSpent + COST, cryptoSpent: prev.player.stats.cryptoSpent || 0 } 
          }
      }));

      setPendingPersonAttributes(null);
  };

  const handleEntityDrag = (id: string, position: Vector2) => {
      // Constrain dragging to valid area
      const safePos = ensureOutsideWallet(position);

      setGameState(prev => ({
          ...prev,
          entities: prev.entities.map(e => e.id === id ? { ...e, position: safePos } : e)
      }));
  };

  const handleBuyMana = (amount: number) => {
    setGameState(prev => ({
        ...prev,
        player: {
            ...prev.player,
            points: prev.player.points + amount
        }
    }));
  };
  
  // FIX: Apply Math.floor here to ensure WorldCanvas wallet UI shows whole numbers
  const availableCrypto = Math.floor(Math.max(0, globalStats.globalScore - (gameState.player.stats.cryptoSpent || 0)));

  return (
    <div className="w-full h-screen overflow-hidden font-sans">
      <MusicPlayer level={gameState.level} />
      
      <InstallPWA />

      {/* --- LOADING SCREEN PHASE --- */}
      {isLoading ? (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : (
          /* --- MAIN GAME PHASE --- */
          !isPlaying ? (
            <StartScreen 
                onStart={startGame} 
                hasSaveGame={hasSaveGame}
                onContinue={handleContinueGame}
            />
          ) : (
            <div className="relative w-full h-full animate-fadeIn">
              <WorldCanvas 
                entities={gameState.entities} 
                onEntityClick={handleEntitySelection}
                isWatering={false} 
                isPlacingLand={isPlacingLand}
                isPlacingPerson={!!pendingPersonAttributes}
                isTargetingRecharge={isTargetingRecharge} 
                rechargingNodeId={rechargingNodeId} 
                onLandPlace={handleLandPlacement} 
                onEntityDrag={handleEntityDrag}
                onNodeRecharge={handleSingleNodeRecharge} 
                walletStats={{ energy: gameState.player.points, crypto: availableCrypto }} 
                blocksToPlace={blocksToPlace} 
                level={gameState.level} 
                onBackgroundClick={handleBackgroundClick} 
                selectedEntityIds={selectedEntityIds}
                onMultiSelect={handleMultiSelect}
                isSelectionMode={isSelectionMode}
              />
              <GameInterface 
                player={gameState.player} 
                entities={gameState.entities}
                onAction={handleAction} 
                selectedEntity={selectedEntity}
                selectedEntityIds={selectedEntityIds}
                onCloseSelection={() => {
                    setSelectedEntity(null);
                    setSelectedEntityIds([]);
                }}
                wastedManaTrigger={wastedManaTrigger}
                targetLostTrigger={targetLostTrigger} 
                isPlacingLand={isPlacingLand}
                isPlacingPerson={!!pendingPersonAttributes}
                isTargetingRecharge={isTargetingRecharge}
                onBuyMana={handleBuyMana}
                globalStats={globalStats}
                pendingCrypto={pendingTotalCrypto} 
                onExit={handleExitGame}
                onRestart={handleRestartGame}
                blocksToPlace={blocksToPlace} 
                level={gameState.level} 
                showLevelBanner={showLevelBanner} 
                ghostDetectedTrigger={ghostDetectedTrigger}
                isPaused={gameState.isPaused} 
                togglePause={togglePause}
                onNodeRecharge={handleSingleNodeRecharge}
                closeModalsTrigger={closeModalsTrigger}
                isSelectionMode={isSelectionMode}
                toggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
              />
            </div>
          )
      )}
    </div>
  );
}

export default App;