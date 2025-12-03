import React, { useState, useEffect, useRef } from 'react';
import { StartScreen } from './components/StartScreen';
import { WorldCanvas } from './components/WorldCanvas';
import { GameInterface } from './components/GameInterface';
import { MusicPlayer } from './components/MusicPlayer';
// LogViewer import removed as it is replaced by LiveConsole
import { useGameLoop } from './hooks/useGameLoop';
import { createPersonEntity, createLandEntity, generateRandomPosition } from './services/gameService';
import { RuntimeTestRunner } from './services/RuntimeTestRunner';
import { Logger } from './services/LoggerService';
import { StorageService } from './services/storageService';
import { GameState, GameEntity, ACTION_COST, INITIAL_POINTS, EntityAttributes, EntityType, Vector2, EventType, EventCategory, EventSeverity } from './types';
import { WORLD_SIZE, WATER_SOUND_URL, AUTOSAVE_INTERVAL_MS } from './constants';
import { GAME_CONFIG } from './gameConfig';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSaveGame, setHasSaveGame] = useState(false);

  // Use lazy initialization for Audio to avoid blocking UI render if AudioContext is not ready
  const waterAudioRef = useRef<HTMLAudioElement | null>(null);

  const [wastedManaTrigger, setWastedManaTrigger] = useState(0); 
  const [isPlacingLand, setIsPlacingLand] = useState(false);
  
  // New State for Person Placement
  const [pendingPersonAttributes, setPendingPersonAttributes] = useState<EntityAttributes | null>(null);
  
  const [globalStats, setGlobalStats] = useState({ globalScore: 0, averageEnergy: 0 });
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isWatering: false,
    entities: [],
    player: {
      name: '',
      avatarUrl: '',
      points: INITIAL_POINTS,
      stats: {
        entitiesCreated: 0,
        manaSpent: 0,
        landsCreated: 0
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
    setIsPlaying(true);
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      player: { 
          ...prev.player, 
          name, 
          avatarUrl: avatar, 
          points: INITIAL_POINTS,
          stats: { entitiesCreated: 0, manaSpent: 0, landsCreated: 0 }
      }
    }));
    
    Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.INFO, { message: 'New Session Initialized', player: name });
  };

  const handleContinueGame = () => {
      const loadedState = StorageService.loadGame();
      if (loadedState) {
          setGameState({
              ...loadedState,
              isPlaying: true, // Force playing state
              isWatering: false // Reset transient UI states
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
      
      setIsPlaying(false);
      setGameState({
        isPlaying: false,
        isWatering: false,
        entities: [],
        player: {
          name: '',
          avatarUrl: '',
          points: INITIAL_POINTS,
          stats: {
            entitiesCreated: 0,
            manaSpent: 0,
            landsCreated: 0
          }
        }
      });
      setHasSaveGame(true); // Since we just saved
      Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.WARNING, { message: 'Session Terminated & Saved' });
  };

  const handleRestartGame = () => {
      // Clear save on restart? Or just overwrite? Let's just reset state.
      setGameState(prev => ({
        ...prev,
        isWatering: false,
        entities: [],
        player: {
          ...prev.player,
          points: INITIAL_POINTS,
          stats: {
            entitiesCreated: 0,
            manaSpent: 0,
            landsCreated: 0
          }
        }
      }));
      setGlobalStats({ globalScore: 0, averageEnergy: 0 });
      Logger.log(EventType.SYSTEM_ALERT, EventCategory.SYSTEM, EventSeverity.WARNING, { message: 'System Reboot Initiated' });
  };

  const handleAction = (actionType: string, payload?: any) => {
    
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
        
        setGameState(prev => ({
            ...prev,
            player: { 
                ...prev.player, 
                points: prev.player.points - ACTION_COST,
                stats: { ...prev.player.stats, manaSpent: prev.player.stats.manaSpent + ACTION_COST }
            }
        }));

        if (!hasLand) {
            setWastedManaTrigger(prev => prev + 1);
            Logger.log(EventType.USER_ACTION, EventCategory.ECONOMY, EventSeverity.WARNING, { action: 'RAIN_WASTED', cost: ACTION_COST });
            return;
        } else {
            if (waterAudioRef.current) {
                waterAudioRef.current.currentTime = 0;
                waterAudioRef.current.play().catch(e => console.log("Audio play failed", e));
            }

            Logger.log(EventType.LAND_WATERED, EventCategory.ECONOMY, EventSeverity.INFO, { action: 'RAIN_SUCCESS', landsAffected: lands.length });

            setGameState(prev => ({
                ...prev,
                isWatering: true,
                entities: prev.entities.map(e => {
                    if (e.type === EntityType.LAND && e.landAttributes) {
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

            setTimeout(() => {
                setGameState(prev => ({ ...prev, isWatering: false }));
            }, 3000);
            return;
        }
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
            stats: { ...prev.player.stats, landsCreated: prev.player.stats.landsCreated + 1, manaSpent: prev.player.stats.manaSpent + ACTION_COST } 
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
              stats: { ...prev.player.stats, entitiesCreated: prev.player.stats.entitiesCreated + 1, manaSpent: prev.player.stats.manaSpent + ACTION_COST } 
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

  return (
    <div className="w-full h-screen overflow-hidden font-sans">
      <MusicPlayer />

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
            isWatering={gameState.isWatering}
            isPlacingLand={isPlacingLand}
            isPlacingPerson={!!pendingPersonAttributes}
            onLandPlace={handleLandPlacement} // Reused for both
            onEntityDrag={handleEntityDrag}
          />
          <GameInterface 
            player={gameState.player} 
            entities={gameState.entities}
            onAction={handleAction} 
            selectedEntity={selectedEntity}
            onCloseSelection={() => setSelectedEntity(null)}
            wastedManaTrigger={wastedManaTrigger}
            isPlacingLand={isPlacingLand}
            isPlacingPerson={!!pendingPersonAttributes}
            onBuyMana={handleBuyMana}
            globalStats={globalStats}
            onExit={handleExitGame}
            onRestart={handleRestartGame}
          />
        </div>
      )}
    </div>
  );
}

export default App;