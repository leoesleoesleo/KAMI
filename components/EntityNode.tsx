
import React, { useEffect, useState } from 'react';
import { GameEntity, EntityType } from '../types';
import { Leaf, Droplets } from 'lucide-react';
import { GAME_CONFIG } from '../gameConfig';

interface EntityNodeProps {
  entity: GameEntity;
  onClick: (entity: GameEntity) => void;
  onMouseDown?: (e: React.MouseEvent, entity: GameEntity) => void;
}

const EMOTES = ['😉', '😄', '😍', '😮', '🤨', '❤️', '🎵', '🤔', '✍️', '💬', '💤'];

export const EntityNode: React.FC<EntityNodeProps> = ({ entity, onClick, onMouseDown }) => {
  const isPerson = entity.type === EntityType.PERSON;
  
  // Empathy System State
  const [activeEmote, setActiveEmote] = useState<string | null>(null);

  useEffect(() => {
    if (!isPerson) return;
    if (entity.attributes?.estado === 'muerto') return; // Dead bots don't emote

    // Random Emote Generator interval
    const interval = setInterval(() => {
        // 30% chance every 4 seconds to show an emote
        if (Math.random() > 0.7) {
            const randomEmote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
            setActiveEmote(randomEmote);
            
            // Hide emote after 2 seconds
            setTimeout(() => {
                setActiveEmote(null);
            }, 2000);
        }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPerson, entity.attributes?.estado]);

  // Color Filter Logic based on Energy
  const getEnergyFilter = (energy: number, isDead: boolean) => {
      if (isDead) return 'grayscale(100%) brightness(80%) sepia(30%) hue-rotate(280deg)'; // Pinkish/Cold dead look
      
      if (energy >= 80) return 'none'; // Yellow (Standard)
      if (energy >= 50) return 'hue-rotate(-45deg) saturate(1.5)'; // Orange (Tired)
      return 'hue-rotate(-130deg) saturate(2)'; // Pink/Magenta (Exhausted)
  };

  if (isPerson) {
    const isEating = entity.attributes?.estado === 'alimentandose';
    const isDead = entity.attributes?.estado === 'muerto';
    const energy = entity.attributes?.energia || 100;

    return (
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 group transition-opacity duration-300"
        style={{ left: entity.position.x, top: entity.position.y }}
        onClick={(e) => { e.stopPropagation(); onClick(entity); }}
        onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
      >
        <div className={`relative ${!isDead ? 'animate-breathe' : ''} ${isEating ? 'scale-110' : ''}`}>
          {/* Shadow */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/20 blur-sm rounded-full scale-y-50" />
          
          {/* Avatar Container with Dynamic Color Filter */}
          <div 
            className="w-14 h-14 rounded-full shadow-[0_4px_10px_rgba(234,179,8,0.3)] bg-transparent overflow-visible transition-all duration-1000"
            style={{ filter: getEnergyFilter(energy, isDead) }}
          >
            <img 
                src={entity.avatarUrl} 
                alt="Person" 
                className="w-full h-full object-cover drop-shadow-md" 
            />
          </div>

          {/* Emote Overlay */}
          {!isDead && (activeEmote || isEating) && (
            <div className="absolute -top-6 -right-4 bg-white rounded-full p-1 shadow-lg text-lg animate-pop-in border border-divine-gold/20 z-20 min-w-[30px] text-center">
                {isEating ? '😋' : activeEmote}
            </div>
          )}

          {/* Status Indicators */}
          {entity.attributes?.estado === 'trabajando' && (
            <div className="absolute -top-2 -left-2 bg-blue-500 text-white p-1 rounded-full text-[8px] animate-bounce shadow-sm border border-white">
              Work
            </div>
          )}
          
          {isDead && (
             <div className="absolute -top-6 -left-4 bg-pink-900 text-pink-200 px-2 py-0.5 rounded-full text-[10px] font-bold border border-pink-400 shadow-lg whitespace-nowrap animate-pulse">
              💀 Muriendo
            </div>
          )}

          {/* Name Tooltip */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-30 font-bold tracking-wider">
            {entity.attributes?.nombre} ({Math.round(entity.attributes?.energia || 0)}%)
          </div>
        </div>
      </div>
    );
  }

  // --- FERTILE LAND RENDER LOGIC ---
  if (entity.type === EntityType.LAND) {
      const resources = entity.landAttributes?.resourceLevel || 0;
      
      let bgClass = GAME_CONFIG.LAND.COLORS.EMPTY;
      let borderClass = 'border-yellow-500/40';
      let iconColor = 'text-yellow-600/70';
      let glowColor = 'bg-yellow-200/40';

      if (resources >= GAME_CONFIG.LAND.STAGE_2_THRESHOLD) {
          bgClass = GAME_CONFIG.LAND.COLORS.READY; // Green
          borderClass = 'border-green-500/40';
          iconColor = 'text-green-800';
          glowColor = 'bg-green-300/60';
      } else if (resources >= GAME_CONFIG.LAND.STAGE_1_THRESHOLD) {
          bgClass = GAME_CONFIG.LAND.COLORS.GROWING; // Pink
          borderClass = 'border-pink-500/40';
          iconColor = 'text-pink-700';
          glowColor = 'bg-pink-300/50';
      }

      return (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-0 cursor-move group"
          style={{ left: entity.position.x, top: entity.position.y }}
          onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
          onClick={(e) => { e.stopPropagation(); onClick(entity); }}
        >
          <div className="relative w-32 h-32 opacity-90 transition-transform group-active:scale-105">
            {/* Glow Square */}
            <div className={`absolute inset-0 rounded-3xl blur-xl scale-110 animate-pulse-slow group-hover:opacity-80 transition-colors duration-1000 ${glowColor}`} />
            
            {/* Dashed Border Square */}
            <div className={`absolute inset-0 border-2 border-dashed rounded-3xl animate-[spin_20s_linear_infinite] transition-colors duration-1000 ${borderClass}`} />
            
            {/* Main Land Square */}
            <div className={`absolute inset-2 backdrop-blur-sm rounded-2xl border border-white/20 flex flex-col items-center justify-center shadow-sm transition-all duration-1000 ${bgClass}`}>
                <Leaf className={`w-12 h-12 transition-colors duration-1000 drop-shadow-sm ${iconColor}`} />
                {/* Resource Bar */}
                <div className="w-16 h-1.5 bg-black/10 rounded-full mt-2 overflow-hidden">
                    <div 
                        className="h-full bg-white/80 transition-all duration-500"
                        style={{ width: `${resources}%` }}
                    />
                </div>
            </div>
            
            {/* Corner Accents */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />

            {/* Drag Handle hint */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs text-green-800 font-bold bg-white/90 px-2 py-1 shadow-sm rounded pointer-events-none whitespace-nowrap">
                Mover Parcela
            </div>
          </div>
        </div>
      );
  }

  return null;
};
