import React, { useEffect, useState } from 'react';
import { GameEntity, EntityType } from '../types';
import { Server } from 'lucide-react';
import { GAME_CONFIG } from '../gameConfig';

interface EntityNodeProps {
  entity: GameEntity;
  onClick: (entity: GameEntity) => void;
  onMouseDown?: (e: React.MouseEvent | React.TouchEvent, entity: GameEntity) => void;
}

const EMOTES = ['😉', '😄', '😍', '😮', '🤨', '❤️', '🎵', '🤔', '✍️', '💬', '💤'];

// Sequence Timings (ms)
const SEQ_MACHINE = 0;
const SEQ_EGG = 800;
const SEQ_CRITICAL = 3000;
const SEQ_EXPLOSION = 4500;
const SEQ_COMPLETE = 5000;

export const EntityNode: React.FC<EntityNodeProps> = ({ entity, onClick, onMouseDown }) => {
  const isPerson = entity.type === EntityType.PERSON;
  
  const [activeEmote, setActiveEmote] = useState<string | null>(null);
  const [birthPhase, setBirthPhase] = useState<'INIT' | 'MACHINE' | 'EGG' | 'CRITICAL' | 'COMPLETE'>('COMPLETE');
  const [isNewborn, setIsNewborn] = useState(false);

  useEffect(() => {
      if (isPerson) {
          const age = Date.now() - entity.createdAt;
          
          if (age < SEQ_COMPLETE) {
              setIsNewborn(true);
              setBirthPhase('INIT');

              setTimeout(() => setBirthPhase('MACHINE'), SEQ_MACHINE + 100);
              setTimeout(() => setBirthPhase('EGG'), SEQ_EGG);
              setTimeout(() => setBirthPhase('CRITICAL'), SEQ_CRITICAL);
              setTimeout(() => {
                  setBirthPhase('COMPLETE');
                  setIsNewborn(false);
              }, SEQ_EXPLOSION);
          } else {
              setBirthPhase('COMPLETE');
              setIsNewborn(false);
          }
      }
  }, [entity.createdAt, isPerson]);

  useEffect(() => {
    if (!isPerson) return;
    if (entity.attributes?.estado === 'muerto') return; 
    if (isNewborn) return; 

    const interval = setInterval(() => {
        if (Math.random() > 0.7) {
            const randomEmote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
            setActiveEmote(randomEmote);
            setTimeout(() => setActiveEmote(null), 2000);
        }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPerson, entity.attributes?.estado, isNewborn]);

  const getEnergyFilter = (energy: number, isDead: boolean) => {
      if (isDead) return 'grayscale(100%) brightness(80%) sepia(30%) hue-rotate(190deg) saturate(3)'; // Blue/Cold for dead
      if (energy >= 80) return 'none'; 
      if (energy >= 50) return 'hue-rotate(-45deg) saturate(1.5)';
      return 'hue-rotate(-130deg) saturate(2)'; 
  };

  if (isPerson) {
    if (isNewborn && birthPhase !== 'COMPLETE') {
        return (
            <div 
                className="absolute z-20 pointer-events-none"
                style={{ left: entity.position.x, top: entity.position.y }}
            >
                {/* 1. FUTURISTIC MACHINE */}
                {(birthPhase === 'MACHINE' || birthPhase === 'EGG' || birthPhase === 'CRITICAL') && (
                    <div className="absolute top-0 left-0 animate-machine-deploy">
                        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-tech-cyan/50 rounded-full animate-spin-slow" 
                             style={{ borderStyle: 'dashed', transform: 'translate(-50%, -50%) perspective(500px) rotateX(60deg)' }} />
                        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-tech-purple/30 rounded-full animate-spin-reverse" 
                             style={{ transform: 'translate(-50%, -50%) perspective(500px) rotateX(60deg)' }} />
                        <div className="absolute -translate-x-1/2 -translate-y-full w-1 h-24 bg-gradient-to-t from-tech-cyan to-transparent opacity-50 blur-sm" />
                    </div>
                )}

                {/* 2 & 3. DIGITAL EGG */}
                {(birthPhase === 'EGG' || birthPhase === 'CRITICAL') && (
                    <div className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-14 h-16 
                        ${birthPhase === 'EGG' ? 'animate-hologram-form' : ''}
                        ${birthPhase === 'CRITICAL' ? 'animate-shake-critical bg-alert-red/20 border-alert-red shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'bg-black/80 border-tech-cyan shadow-[0_0_15px_rgba(6,182,212,0.5)]'}
                        border-2 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] overflow-hidden flex items-center justify-center transition-colors duration-300
                    `}>
                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]" />
                        
                        {birthPhase === 'CRITICAL' && (
                            <svg className="absolute inset-0 w-full h-full z-10 animate-pulse" viewBox="0 0 100 100">
                                <path d="M50 10 L45 30 L55 45 L40 60 L60 80" stroke="white" strokeWidth="3" fill="none" className="drop-shadow-md" />
                            </svg>
                        )}
                        
                        <div className={`w-6 h-6 rounded-full blur-md ${birthPhase === 'CRITICAL' ? 'bg-red-500' : 'bg-tech-cyan'} animate-pulse`} />
                    </div>
                )}

                {/* 4. BREAK/EXPLOSION */}
                {birthPhase === 'CRITICAL' && (
                     <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen opacity-0 animate-flash-bang" 
                          style={{ animationDelay: '1.2s' }} 
                     />
                )}
            </div>
        );
    }

    const isEating = entity.attributes?.estado === 'alimentandose';
    const isDead = entity.attributes?.estado === 'muerto';
    const energy = entity.attributes?.energia || 100;

    return (
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 group transition-opacity duration-300 animate-pop-in"
        style={{ left: entity.position.x, top: entity.position.y }}
        onClick={(e) => { e.stopPropagation(); onClick(entity); }}
        onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
        onTouchStart={(e) => onMouseDown && onMouseDown(e, entity)}
      >
        <div className={`relative ${!isDead ? 'animate-breathe' : ''} ${isEating ? 'scale-110' : ''}`}>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/40 blur-sm rounded-full scale-y-50" />
          
          <div 
            className="w-14 h-14 rounded-full shadow-[0_4px_10px_rgba(6,182,212,0.3)] bg-transparent overflow-visible transition-all duration-1000"
            style={{ filter: getEnergyFilter(energy, isDead) }}
          >
            <img 
                src={entity.avatarUrl} 
                alt="Person" 
                className="w-full h-full object-cover drop-shadow-md" 
            />
          </div>

          {!isDead && (activeEmote || isEating) && (
            <div className="absolute -top-6 -right-4 bg-slate-800 rounded-full p-1 shadow-lg text-lg animate-pop-in border border-white/20 z-20 min-w-[30px] text-center">
                {isEating ? '⚡' : activeEmote}
            </div>
          )}

          {entity.attributes?.estado === 'trabajando' && (
            <div className="absolute -top-2 -left-2 bg-orange-500 text-white p-1 rounded-full text-[8px] animate-bounce shadow-sm border border-white">
              Work
            </div>
          )}
          
          {isDead && (
             <div className="absolute -top-6 -left-4 bg-pink-900/90 text-pink-200 px-2 py-0.5 rounded-full text-[10px] font-bold border border-pink-500 shadow-lg whitespace-nowrap animate-pulse">
              💀 Muriendo
            </div>
          )}

          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-tech-cyan border border-tech-cyan/30 text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-30 font-mono tracking-wider">
            {entity.attributes?.nombre} ({Math.round(entity.attributes?.energia || 0)}%)
          </div>
        </div>
      </div>
    );
  }

  // --- LAND RENDER (SERVER FARM) ---
  if (entity.type === EntityType.LAND) {
      const resources = entity.landAttributes?.resourceLevel || 0;
      
      let bgClass = GAME_CONFIG.LAND.COLORS.EMPTY;
      let borderClass = 'border-yellow-500/40';
      let iconColor = 'text-yellow-800';
      let glowColor = 'bg-yellow-400/20';

      if (resources >= GAME_CONFIG.LAND.STAGE_2_THRESHOLD) {
          bgClass = GAME_CONFIG.LAND.COLORS.READY; 
          borderClass = 'border-green-500/40';
          iconColor = 'text-green-900';
          glowColor = 'bg-green-400/30';
      } else if (resources >= GAME_CONFIG.LAND.STAGE_1_THRESHOLD) {
          bgClass = GAME_CONFIG.LAND.COLORS.GROWING; 
          borderClass = 'border-pink-500/40';
          iconColor = 'text-pink-900';
          glowColor = 'bg-pink-400/30';
      }

      return (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-0 cursor-move group"
          style={{ left: entity.position.x, top: entity.position.y }}
          onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
          onTouchStart={(e) => onMouseDown && onMouseDown(e, entity)}
          onClick={(e) => { e.stopPropagation(); onClick(entity); }}
        >
          {/* Reduced size: w-20 h-20 mobile, w-24 h-24 desktop */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 opacity-90 transition-transform group-active:scale-105">
            <div className={`absolute inset-0 rounded-xl blur-lg scale-110 animate-pulse-slow group-hover:opacity-80 transition-colors duration-1000 ${glowColor}`} />
            <div className={`absolute inset-0 border border-dashed rounded-xl animate-[spin_20s_linear_infinite] transition-colors duration-1000 ${borderClass}`} />
            <div className={`absolute inset-1 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col items-center justify-center shadow-sm transition-all duration-1000 ${bgClass}`}>
                {/* Updated Icon: Server Farm */}
                <Server className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-1000 drop-shadow-sm ${iconColor}`} />
                <div className="w-12 h-1 bg-black/20 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-white/90 transition-all duration-500" style={{ width: `${resources}%` }} />
                </div>
            </div>
            
            <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 rounded-tl transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
            <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 rounded-tr transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 rounded-bl transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 rounded-br transition-colors duration-1000 ${borderClass.replace('border-dashed', '')}`} />
          </div>
        </div>
      );
  }

  return null;
};