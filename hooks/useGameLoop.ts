

import React, { useEffect, useRef } from 'react';

export const useGameLoop = (
  onTick: (time: number) => void,
  isPlaying: boolean,
  isPaused: boolean
) => {
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      if (!isPaused) {
          onTick(time);
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
  }, [isPlaying, isPaused, onTick]);
};