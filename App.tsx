
import React, { useState, useEffect, useRef } from 'react';
import { StartScreen } from './components/StartScreen';
import { WorldCanvas } from './components/WorldCanvas';
import { GameInterface } from './components/GameInterface';
import { MusicPlayer } from './components/MusicPlayer';
import { InstallPWA } from './components/InstallPWA';
import { useGameLoop } from './hooks/useGameLoop';
import { createPersonEntity, createLandEntity, generateRandomPosition, createWalletEntity, createBlockEntity } from './services/gameService';
import { RuntimeTestRunner } from './services/RuntimeTestRunner';
import { Logger } from './services/LoggerService';
import { StorageService } from './services/storageService';
import { AudioManager } from './services/AudioManager'; // Import AudioManager
import { GameState, GameEntity, ACTION_COST, INITIAL_POINTS, EntityAttributes, EntityType, Vector2, EventType, EventCategory, EventSeverity, BlockType } from './types';
import { WORLD_SIZE, WATER_SOUND_URL, AUTOSAVE_INTERVAL_MS } from './constants';
import { GAME_CONFIG } from './gameConfig';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSaveGame, setHasSaveGame] = useState(false);

  // Use lazy initialization for Audio to avoid blocking UI render if AudioContext is not ready
  const waterAudioRef = useRef<HTMLAudioElement | null>(null);

  const [wastedManaTrigger, setWastedManaTrigger] = useState(0); 
  const [targetLostTrigger, setTargetLostTrigger] = useState(0); // New trigger for auto-cancel
  const [isPlacingLand, setIsPlacingLand] = useState(false);
  
  // New State for Person Placement
  const [pendingPersonAttributes, setPendingPersonAttributes] = useState<EntityAttributes | null>(null);
  
  // New State for Single Target Recharge
  const [isTargetingRecharge, setIsTargetingRecharge] = useState(false);
  const [rechargingNodeId, setRechargingNodeId] = useState<string | null>(null);

  // --- STRUCTURE PLACEMENT STATE ---
  const [blocksToPlace, setBlocksToPlace] = useState<number>(0);
  const [placingBlockType, setPlacingBlockType] = useState<BlockType | null>(null);

  const [globalStats, setGlobalStats] = useState({ globalScore: 0, averageEnergy: 0 });
  const [showLevelBanner, setShowLevelBanner] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
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

  // Ref to access latest state inside intervals/timeouts without triggering re-renders
  const gameStateRef = useRef(gameState);

  // Update ref whenever state changes
  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  // Init Audio & Check Save
  useEffect(() => {
      waterAudioRef.current = new Audio(WATER_SOUND_URL);
      
      // Check for save game
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

  // Periodic Snapshot Logging
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
        Logger.log(
            EventType.SYSTEM_ALERT,
            EventCategory.SYSTEM,
            EventSeverity.INFO,
            { 
                message: 'Ecosystem Snapshot', 
                entities: gameState.entities.length, 
                mana: gameState.player.points,
                score: globalStats.globalScore 
            }
        );
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [isPlaying, gameState.entities.length, gameState.player.points, globalStats.globalScore]);

  // --- AUTO-SAVE SYSTEM ---
  useEffect(() => {
      if (!isPlaying) return;

      const interval = setInterval(() => {
          const success = StorageService.saveGame(gameStateRef.current);
          if (success) {
              Logger.log(
                  EventType.SYSTEM_ALERT,
                  EventCategory.SYSTEM,
                  EventSeverity.INFO,
                  { message: 'Auto-save Complete' }
              );
          }
      }, AUTOSAVE_INTERVAL_MS);

      return () => clearInterval(interval);
  }, [isPlaying]);

  // --- CRITICAL BUG FIX: MONITOR TARGET AVAILABILITY ---
  // If user is targeting recharge, but all lands disappear, cancel the mode.
  useEffect(() => {
      if (isTargetingRecharge) {
          const hasLands = gameState.entities.some(e => e.type === EntityType.LAND);
          if (!hasLands) {
              setIsTargetingRecharge(false);
              setTargetLostTrigger(prev => prev + 1); // Notify UI
              Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.WARNING, { message: 'Recharge Mode Cancelled: No Nodes Available' });
          }
      }
  }, [gameState.entities, isTargetingRecharge]);

  // --- LEVEL UP SYSTEM ---
  useEffect(() => {
      if (!isPlaying) return;
      
      const currentLevel = gameState.level;
      const crypto = Math.max(0, globalStats.globalScore - (gameState.player.stats.cryptoSpent || 0));
      const energy = gameState.player.points;
      
      let nextLevel = currentLevel;

      // Check Level 3
      if (currentLevel < 3) {
          if (crypto > GAME_CONFIG.LEVELS.LVL3.MIN_CRYPTO || energy > GAME_CONFIG.LEVELS.LVL3.MIN_ENERGY) {
              nextLevel = 3;
          } 
          // Check Level 2
          else if (currentLevel < 2) {
              if (crypto > GAME_CONFIG.LEVELS.LVL2.MIN_CRYPTO || energy > GAME_CONFIG.LEVELS.LVL2.MIN_ENERGY) {
                  nextLevel = 2;
              }
          }
      }

      if (nextLevel > currentLevel) {
          setGameState(prev => ({ ...prev, level: nextLevel }));
          setShowLevelBanner(`NIVEL ${nextLevel} ALCANZADO`);
          
          // Play sound or effect could go here
          Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.INFO, { message: `LEVEL UP: ${nextLevel}` });
          
          setTimeout(() => {
              setShowLevelBanner(null);
          }, 3000); // Show banner for 3 seconds
      }

  }, [globalStats.globalScore, gameState.player.points, isPlaying, gameState.level, gameState.player.stats.cryptoSpent]);


  const [selectedEntity, setSelectedEntity] = useState<GameEntity | null>(null);

  useGameLoop(
      gameState.entities, 
      (newEntities) => {
          setGameState(prev => {
              const updatedEntities = typeof newEntities === 'function' ? newEntities(prev.entities) : newEntities;
              
              let totalScore = 0;
              let totalEnergy = 0;
              let botCount = 0;

              updatedEntities.forEach(e => {
                  if (e.type === EntityType.PERSON && e.attributes) {
                      totalScore += e.attributes.individualScore || 0;
                      if (e.attributes.estado !== 'muerto') {
                          totalEnergy += e.attributes.energia;
                          botCount++;
                      }
                  }
              });

              setGlobalStats({
                  globalScore: Math.floor(totalScore),
                  averageEnergy: botCount > 0 ? Math.floor(totalEnergy / botCount) : 0
              });

              if (selectedEntity) {
                  const updatedSelected = updatedEntities.find(e => e.id === selectedEntity.id);
                  if (!updatedSelected) {
                      setSelectedEntity(null);
                  }
              }
              return { ...prev, entities: updatedEntities };
          });
      }, 
      isPlaying
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
    // Force Audio Playback immediately on user interaction
    // Level 1 logic
    AudioManager.playLevel(1, true);

    setIsPlaying(true);
    // Initialize with Wallet Entity
    const walletEntity = createWalletEntity();
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      entities: [walletEntity], // Start with Wallet
      level: 1, // Start Level 1
      player: { 
          ...prev.player, 
          name, 
          avatarUrl: avatar, 
          points: INITIAL_POINTS,
          stats: { entitiesCreated: 0, manaSpent: 0, landsCreated: 0, cryptoSpent: 0 }
      }
    }));
    
    Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.INFO, { message: 'New Session Initialized', player: name });
  };

  const handleContinueGame = () => {
      const loadedState = StorageService.loadGame();
      if (loadedState) {
          // Resume Audio for saved level
          const savedLevel = loadedState.level || 1;
          AudioManager.playLevel(savedLevel, true);

          setGameState({
              ...loadedState,
              isPlaying: true, // Force playing state
              isWatering: false, // Reset transient UI states
              level: savedLevel,
              player: {
                  ...loadedState.player,
                  stats: {
                      ...loadedState.player.stats,
                      cryptoSpent: loadedState.player.stats.cryptoSpent || 0 // Ensure backward compatibility
                  }
              }
          });
          setIsPlaying(true);
          Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.INFO, { message: 'Session Restored from Backup' });
      } else {
          // Fallback if load fails
          alert("Error: Save file corrupted or missing.");
          setHasSaveGame(false);
      }
  };

  const handleExitGame = () => {
      // Save before exiting
      StorageService.saveGame(gameStateRef.current);
      
      // Stop Music
      AudioManager.stop();

      setIsPlaying(false);
      setGameState({
        isPlaying: false,
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
      setHasSaveGame(true); // Since we just saved
      Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.WARNING, { message: 'Session Terminated & Saved' });
  };

  const handleRestartGame = () => {
      const walletEntity = createWalletEntity();
      
      // Restart Audio Level 1
      AudioManager.playLevel(1, true);

      setGameState(prev => ({
        ...prev,
        isWatering: false,
        entities: [walletEntity], // Reset entities but keep wallet
        level: 1,
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
      Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.WARNING, { message: 'System Reboot Initiated' });
  };

  const handleSingleNodeRecharge = (nodeId: string) => {
      if (gameState.player.points < ACTION_COST) {
        setIsTargetingRecharge(false);
        return;
      }

      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              points: prev.player.points - ACTION_COST,
              stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + ACTION_COST }
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

      // Trigger Audio
      if (waterAudioRef.current) {
        waterAudioRef.current.currentTime = 0;
        waterAudioRef.current.play().catch(e => console.log("Audio play failed", e));
      }

      // Visuals & Logs
      setRechargingNodeId(nodeId);
      Logger.log(EventType.LAND_WATERED, EventCategory.ECONOMY, EventSeverity.INFO, { action: 'NODE_RECHARGE', target: nodeId });

      // Reset State
      setTimeout(() => {
          setRechargingNodeId(null);
      }, 3000);
      
      setIsTargetingRecharge(false);
  };

  const handleAction = (actionType: string, payload?: any) => {
    
    // --- BUY STRUCTURES (BLOCKS) ACTION ---
    if (actionType === 'BUY_STRUCTURE') {
        const { type, quantity, totalCost } = payload;
        
        // Deduct Crypto
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

        // Set Build Mode State
        setBlocksToPlace(quantity);
        setPlacingBlockType(type);
        
        Logger.log(
            EventType.USER_ACTION,
            EventCategory.ECONOMY,
            EventSeverity.INFO,
            { action: 'BUY_BLOCKS', type, quantity, cost: totalCost }
        );
        return;
    }

    // --- EXCHANGE CRYPTO ACTION ---
    if (actionType === 'EXCHANGE_CRYPTO') {
        const EXCHANGE_RATE = 10; // 10 Crypto = 1 Energy
        const currentGlobalScore = globalStats.globalScore;
        const alreadySpent = gameState.player.stats.cryptoSpent || 0;
        const availableCrypto = Math.max(0, currentGlobalScore - alreadySpent);

        // Payload should contain amount now
        const amountToExchange = payload?.amount || 0;

        if (amountToExchange <= 0) return;
        if (amountToExchange > availableCrypto) return; // Validation

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

        Logger.log(
            EventType.USER_ACTION, 
            EventCategory.ECONOMY, 
            EventSeverity.INFO, 
            { action: 'EXCHANGE_EXEC', cost: cryptoCost, gain: energyGain }
        );
        return;
    }

    if (actionType === 'KILL_ENTITY') {
        setGameState(prev => {
            const updatedEntities = prev.entities.map(e => {
                if (e.id === payload && e.type === EntityType.PERSON && e.attributes) {
                    
                    if (e.attributes.estado !== 'muerto') {
                        Logger.log(EventType.USER_ACTION, EventCategory.LIFECYCLE, EventSeverity.CRITICAL, { action: 'KILL_CMD', target: e.id });
                    }

                    return {
                        ...e,
                        targetPosition: undefined, // Reset target so physics stops interpolating
                        velocity: { x: 0, y: 0 },
                        attributes: {
                            ...e.attributes,
                            estado: 'muerto' as const,
                            deathTimestamp: Date.now(),
                            energia: 0 
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
        if (gameState.player.points < REVIVE_COST) return; // UI handles toast usually, but logic safety check

        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                points: prev.player.points - REVIVE_COST,
                stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + REVIVE_COST }
            },
            entities: prev.entities.map(e => {
                if (e.id === payload && e.type === EntityType.PERSON && e.attributes && e.attributes.estado === 'muerto') {
                    Logger.log(EventType.USER_ACTION, EventCategory.LIFECYCLE, EventSeverity.INFO, { action: 'REVIVE_CMD', target: e.id });
                    return {
                        ...e,
                        attributes: {
                            ...e.attributes,
                            estado: 'ocioso' as const,
                            energia: 50, // Revive with 50% energy
                            deathTimestamp: undefined,
                            zeroEnergySince: undefined
                        }
                    };
                }
                return e;
            })
        }));
        return;
    }

    if (gameState.player.points < ACTION_COST) return;

    if (actionType === 'CREATE_LAND') {
        setIsPlacingLand(true);
        return;
    }
    
    // NEW: Handle Biobot Creation Request (Enter Placement Mode)
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
            Logger.log(EventType.USER_ACTION, EventCategory.ECONOMY, EventSeverity.WARNING, { action: 'RECHARGE_FAILED', reason: 'NO_NODES' });
            return;
        } 
        
        // Enter Recharge Targeting Mode
        setIsTargetingRecharge(true);
        return;
    } else {
        // Fallback deduction for generic actions (like Work)
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
        // CREATE_PERSON removed from here, moved to handlePersonPlacement
        case 'CREATE_WORK':
            Logger.log(EventType.USER_ACTION, EventCategory.USER, EventSeverity.INFO, { action: 'WORK_ORDER' });
            // Use configurable duration from GAME_CONFIG
            const workEndTime = Date.now() + GAME_CONFIG.BIOBOT.WORK_DURATION_MS; 
            
            setGameState(prev => ({
                ...prev,
                entities: prev.entities.map(e => {
                    // FIX: Ensure dead bots do not work
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
    // 1. Check for Block Placement First
    if (blocksToPlace > 0 && placingBlockType) {
        const newBlock = createBlockEntity(placingBlockType, position);
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

    // Determine which type of placement we are doing based on state
    if (pendingPersonAttributes) {
        handlePersonPlacement(position);
        return;
    }

    if (gameState.player.points < ACTION_COST) return;

    const newLand = createLandEntity(position);
    
    setGameState(prev => ({ 
        ...prev, 
        entities: [...prev.entities, newLand],
        player: { 
            ...prev.player, 
            points: prev.player.points - ACTION_COST,
            stats: { ...prev.player.stats, landsCreated: prev.player.stats.landsCreated + 1, manaSpent: prev.player.stats.manaSpent + ACTION_COST, cryptoSpent: prev.player.stats.cryptoSpent || 0 } 
        }
    }));
    
    setIsPlacingLand(false);
  };
  
  const handlePersonPlacement = (position: Vector2) => {
      if (!pendingPersonAttributes) return;
      if (gameState.player.points < ACTION_COST) return;

      const newPerson = createPersonEntity(pendingPersonAttributes, position);
      
      setGameState(prev => ({ 
          ...prev, 
          entities: [...prev.entities, newPerson],
          player: { 
              ...prev.player, 
              points: prev.player.points - ACTION_COST,
              stats: { ...prev.player.stats, entitiesCreated: prev.player.stats.entitiesCreated + 1, manaSpent: prev.player.stats.manaSpent + ACTION_COST, cryptoSpent: prev.player.stats.cryptoSpent || 0 } 
          }
      }));

      setPendingPersonAttributes(null);
  };

  const handleEntityDrag = (id: string, position: Vector2) => {
      setGameState(prev => ({
          ...prev,
          entities: prev.entities.map(e => e.id === id ? { ...e, position } : e)
      }));
  };

  const handleBuyMana = (amount: number) => {
    Logger.log(EventType.USER_ACTION, EventCategory.ECONOMY, EventSeverity.INFO, { action: 'BUY_MANA', amount });
    setGameState(prev => ({
        ...prev,
        player: {
            ...prev.player,
            points: prev.player.points + amount
        }
    }));
  };
  
  // Calculate Crypto Stats for passing to components
  const availableCrypto = Math.max(0, globalStats.globalScore - (gameState.player.stats.cryptoSpent || 0));

  return (
    <div className="w-full h-screen overflow-hidden font-sans">
      <MusicPlayer level={gameState.level} />
      
      {/* PWA INSTALL BUTTON (Separate from HUD) */}
      <InstallPWA />

      {!isPlaying ? (
        <StartScreen 
            onStart={startGame} 
            hasSaveGame={hasSaveGame}
            onContinue={handleContinueGame}
        />
      ) : (
        <div className="relative w-full h-full animate-fadeIn">
          <WorldCanvas 
            entities={gameState.entities} 
            onEntityClick={setSelectedEntity}
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
            level={gameState.level} // NEW: Pass Level
          />
          <GameInterface 
            player={gameState.player} 
            entities={gameState.entities}
            onAction={handleAction} 
            selectedEntity={selectedEntity}
            onCloseSelection={() => setSelectedEntity(null)}
            wastedManaTrigger={wastedManaTrigger}
            targetLostTrigger={targetLostTrigger} 
            isPlacingLand={isPlacingLand}
            isPlacingPerson={!!pendingPersonAttributes}
            isTargetingRecharge={isTargetingRecharge}
            onBuyMana={handleBuyMana}
            globalStats={globalStats}
            onExit={handleExitGame}
            onRestart={handleRestartGame}
            blocksToPlace={blocksToPlace} 
            level={gameState.level} // NEW: Pass Level
            showLevelBanner={showLevelBanner} // NEW: Pass Banner State
          />
        </div>
      )}
    </div>
  );
}

export default App;
