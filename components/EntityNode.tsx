
import React, { useEffect, useState } from 'react';
import { GameEntity, EntityType, BlockType } from '../types';
import { Server, Wallet, Cpu, Shield, Lock, Box } from 'lucide-react';
import { GAME_CONFIG } from '../gameConfig';

interface EntityNodeProps {
  entity: GameEntity;
  onClick: (entity: GameEntity) => void;
  onMouseDown?: (e: React.MouseEvent | React.TouchEvent, entity: GameEntity) => void;
  walletStats?: { energy: number; crypto: number }; 
}

const EMOTES = ['😉', '😄', '😍', '😮', '🤨', '❤️', '🎵', '🤔', '✍️', '💬', '💤'];

// Sequence Timings (ms)
const SEQ_MACHINE = 0;
const SEQ_EGG = 800;
const SEQ_CRITICAL = 3000;
const SEQ_EXPLOSION = 4500;
const SEQ_COMPLETE = 5000;

export const EntityNode: React.FC<EntityNodeProps> = ({ entity, onClick, onMouseDown, walletStats }) => {
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

  // --- BLOCK RENDER (STRUCTURES) ---
  if (entity.type === EntityType.BLOCK) {
      const type = entity.blockAttributes?.type;
      const size = GAME_CONFIG.STRUCTURES.GRID_SIZE;

      if (type === BlockType.FIREWALL) {
          return (
            <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-move group"
                style={{ left: entity.position.x, top: entity.position.y, width: size, height: size }}
                onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
                onTouchStart={(e) => onMouseDown && onMouseDown(e, entity)}
                onClick={(e) => { e.stopPropagation(); onClick(entity); }}
            >
                <div className="w-full h-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-sm border-2 border-gray-600 shadow-md flex items-center justify-center relative overflow-hidden">
                    {/* Metallic Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-50" />
                    <div className="absolute inset-0 border border-white/20" />
                    <Shield size={20} className="text-gray-800 relative z-10 drop-shadow-sm" />
                </div>
            </div>
          );
      } else if (type === BlockType.ENCRYPTION) {
          return (
             <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-move group"
                style={{ left: entity.position.x, top: entity.position.y, width: size, height: size }}
                onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
                onTouchStart={(e) => onMouseDown && onMouseDown(e, entity)}
                onClick={(e) => { e.stopPropagation(); onClick(entity); }}
            >
                <div className="w-full h-full bg-[#5d4037] rounded-sm border-2 border-[#3e2723] shadow-md flex items-center justify-center relative overflow-hidden">
                    {/* Tech-Wood Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30" />
                    <div className="absolute inset-0 border border-yellow-600/20" />
                    {/* Digital Circuit Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,0,0.2)_50%,transparent_75%)] bg-[size:10px_10px]" />
                    <Lock size={18} className="text-yellow-500 relative z-10 drop-shadow-md" />
                </div>
            </div>
          );
      }
      return null;
  }

  // --- WALLET RENDER ---
  if (entity.type === EntityType.WALLET) {
      const energy = walletStats?.energy || 0;
      const crypto = walletStats?.crypto || 0;
      const totalFunds = energy + crypto;

      let styleClass = "border-tech-cyan shadow-[0_0_30px_rgba(6,182,212,0.4)]";
      let pulseClass = "";
      let ringClass = "border-tech-cyan/30";

      if (totalFunds < 100) {
          // Low Funds: Red/Amber
          styleClass = "border-alert-red shadow-[0_0_20px_rgba(239,68,68,0.3)] opacity-80";
          pulseClass = "animate-pulse-slow";
          ringClass = "border-alert-red/30";
      } else if (totalFunds > 500) {
          // High Funds: Neon Green/Bright
          styleClass = "border-neon-green shadow-[0_0_50px_rgba(34,197,94,0.6)]";
          pulseClass = "animate-pulse";
          ringClass = "border-neon-green/50";
      }

      return (
        <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            style={{ left: entity.position.x, top: entity.position.y }}
            onClick={(e) => { e.stopPropagation(); onClick(entity); }}
        >
            {/* Spinning Outer Ring */}
            <div className={`absolute -inset-8 rounded-full border-2 border-dashed animate-spin-slow ${ringClass}`} />
            <div className={`absolute -inset-4 rounded-full border border-dotted animate-spin-reverse ${ringClass}`} />

            {/* Core Container - RESIZED SMALLER */}
            <div className={`relative w-16 h-16 md:w-20 md:h-20 bg-black/80 backdrop-blur-xl rounded-full border-2 flex items-center justify-center transition-all duration-500 hover:scale-105 ${styleClass} ${pulseClass}`}>
                
                {/* Tech Core Detail */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] opacity-20 rounded-full" />
                
                <div className="relative flex flex-col items-center justify-center text-white">
                    <div className="relative">
                        <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg relative z-10" />
                        <Cpu className="absolute -top-1 -right-1 w-3 h-3 text-tech-cyan animate-pulse z-0 opacity-80" />
                    </div>
                    <div className="mt-1 text-[8px] md:text-[10px] font-mono font-bold tracking-widest text-tech-cyan">CORE</div>
                </div>

                {/* Status Indicator Dot */}
                <div className={`absolute top-1 right-2 w-2 h-2 rounded-full ${totalFunds < 100 ? 'bg-red-500' : 'bg-neon-green'} animate-ping`} />
            </div>
        </div>
      );
  }

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
    const isWorking = entity.attributes?.estado === 'trabajando';
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
            className="w-14 h-14 rounded-full shadow-[0_4px_10px_rgba(6,182,212,0.3)] bg-transparent overflow-visible transition-all duration-1000 relative z-10"
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

          {/* NEW VISUAL EFFECT FOR WORKING (Electric Thruster) */}
          {isWorking && !isDead && (
            <div className="absolute top-[80%] left-1/2 -translate-x-1/2 z-0 pointer-events-none">
                {/* Electric Propulsion Tail */}
                <div className="relative w-8 h-12 flex justify-center">
                    {/* Core Glow */}
                    <div className="absolute top-0 w-2 h-4 bg-white rounded-full blur-[2px] animate-pulse" />
                    {/* Outer Blue Glow */}
                    <div className="absolute top-0 w-4 h-8 bg-tech-cyan/60 blur-md rounded-full" />
                    {/* Electric Stream SVG */}
                    <svg 
                        viewBox="0 0 24 24" 
                        className="w-full h-full text-tech-cyan animate-thruster-burn drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]"
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M12 2L10 8L14 12L10 16L12 22" />
                    </svg>
                </div>
            </div>
          )}
          
          {isDead && (
             <div className="absolute -top-6 -left-4 bg-pink-900/90 text-pink-200 px-2 py-0.5 rounded-full text-[10px] font-bold border border-pink-500 shadow-lg whitespace-nowrap animate-pulse z-30">
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
      const isGhost = entity.landAttributes?.isGhost;
      
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

      const cursorClass = isGhost ? 'cursor-not-allowed opacity-80' : 'cursor-move group-active:scale-105';

      return (
        <div 
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-0 group ${cursorClass}`}
          style={{ left: entity.position.x, top: entity.position.y }}
          onMouseDown={(e) => onMouseDown && onMouseDown(e, entity)}
          onTouchStart={(e) => onMouseDown && onMouseDown(e, entity)}
          onClick={(e) => { e.stopPropagation(); onClick(entity); }}
        >
          {/* Reduced size: w-20 h-20 mobile, w-24 h-24 desktop */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 opacity-90 transition-transform">
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
