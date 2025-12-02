import React, { useEffect, useRef, useState } from 'react';
import { MUSIC_PLAYLIST } from '../constants';

interface MusicPlayerProps {
  // Removed specific isPlaying prop to allow continuous play
}

export const MusicPlayer: React.FC<MusicPlayerProps> = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Attempt to unlock audio on first click anywhere
    const enableAudio = () => {
      setHasInteracted(true);
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };

    window.addEventListener('click', enableAudio);
    window.addEventListener('keydown', enableAudio);

    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (hasInteracted) {
      audio.volume = 0.3;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
           console.log("Autoplay prevented until interaction");
        });
      }
    }
  }, [hasInteracted, trackIndex]);

  const handleEnded = () => {
    // Loop playlist logic
    setTrackIndex((prev) => (prev + 1) % MUSIC_PLAYLIST.length);
  };

  return (
    <audio
      ref={audioRef}
      src={MUSIC_PLAYLIST[trackIndex]}
      onEnded={handleEnded}
      loop={false} 
      autoPlay
    />
  );
};