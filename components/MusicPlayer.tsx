
import React, { useEffect } from 'react';
import { AudioManager } from '../services/AudioManager';

interface MusicPlayerProps {
  level: number;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ level }) => {
  
  // 1. Setup unlock listeners on mount
  useEffect(() => {
    const unlockAudio = () => {
      AudioManager.unlock();
      // Remove listeners once unlocked (AudioManager handles idempotency)
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // 2. React to Level Changes
  useEffect(() => {
      if (level > 0) {
          AudioManager.playLevel(level);
      }
  }, [level]);

  // 3. Cleanup on unmount (Optional, usually we want music to persist unless app closes)
  useEffect(() => {
      return () => {
          // AudioManager.stop(); // Uncomment if music should stop when component unmounts
      };
  }, []);

  // This component renders nothing, it's a logic controller
  return null;
};
