
import React, { useEffect, useRef } from 'react';
import { GameEntity } from '../types';
import { updateWorldState } from '../services/gameService';

const SPEED = 0.5;
const INTERACTION_RADIUS = 60; // Distance to work

export const useGameLoop = (
  entities: GameEntity[], 
  setEntities: (update: (prev: GameEntity[]) => GameEntity[]) => void,
  isPlaying: boolean,
  isPaused: boolean // New dependency
) => {
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      // Only update world state (physics/logic) if NOT paused
      if (!isPaused) {
          setEntities(prevEntities => updateWorldState(prevEntities, SPEED, INTERACTION_RADIUS));
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isPlaying, isPaused]); // Re-run effect if pause state changes
};