
import React, { useEffect } from 'react';
import { AudioManager } from '../services/AudioManager';

interface MusicPlayerProps {
  level: number;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ level }) => {
  
  // 1. Setup unlock listeners on mount
  // This is critical for browsers that block autoplay. 
  // We listen for the first user interaction to "unlock" (play) the audio.
  useEffect(() => {
    const unlockAudio = () => {
      AudioManager.unlock();
      // Ensure current level music is playing if it was blocked
      if (level > 0) {
          AudioManager.playLevel(level);
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [level]); // Added level dependence so closure has latest level

  // 2. React to Level Changes
  useEffect(() => {
      if (level > 0) {
          AudioManager.playLevel(level);
      }
  }, [level]);

  // 3. Cleanup on unmount
  useEffect(() => {
      return () => {
          // Optional: Stop music when entire player unmounts
          // AudioManager.stop(); 
      };
  }, []);

  return null;
};
