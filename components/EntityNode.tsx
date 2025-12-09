

import React, { useEffect, useState } from 'react';
import { GameEntity, EntityType, BlockType } from '../types';
import { Server, Wallet, Cpu, Shield, Lock, Box, Activity, Crosshair } from 'lucide-react';
import { GAME_CONFIG } from '../gameConfig';
import { WALLET_CENTER } from '../services/gameService';

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
    if (entity.attributes?.estado === 'muerto' || entity.attributes?.estado === 'peleando') return; 
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

  // --- INTRUDER RENDER (MATRIX SENTINEL) ---
  if (entity.type === EntityType.INTRUDER) {
      const isAttacking = entity.intruderAttributes?.state === 'attacking';
      const isEngaged = entity.intruderAttributes?.isEngaged;
      const isDying = entity.intruderAttributes?.isDying;
      const phase = entity.intruderAttributes?.tentaclePhase || 0;
      
      // Calculate rotation to face the Wallet
      const dx = WALLET_CENTER.x - entity.position.x;
      const dy = WALLET_CENTER.y - entity.position.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      if (isDying) {
          return (
              <div 
                  className="absolute z-20 pointer-events-none"
                  style={{ left: entity.position.x, top: entity.position.y }}
              >
                  {/* EXPLOSION EFFECT */}
                  <div className="absolute -translate-x-1/2 -translate-y-1/2">
                      <div className="w-16 h-16 bg-red-500 rounded-full animate-ping opacity-75" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-yellow-400 rounded-full animate-shockwave-expand" />
                      <div className="absolute inset-0 w-16 h-16 bg-white rounded-full animate-flash-burst" />
                      {/* Particles */}
                      <div className="absolute inset-0 w-2 h-2 bg-red-400 rounded-full animate-[float_0.5s_ease-out_forwards] translate-x-4 -translate-y-4" />
                      <div className="absolute inset-0 w-2 h-2 bg-orange-400 rounded-full animate-[float_0.5s_ease-out_forwards] -translate-x-4 -translate-y-2" />
                      <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-[float_0.5s_ease-out_forwards] translate-x-2 translate-y-4" />
                  </div>
              </div>
          );
      }

      // Procedural Tentacles
      const tentacles = Array.from({ length: 6 }).map((_, i) => {
          const offset = i * 0.5;
          const sway = Math.sin(phase + offset) * 10;
          return (
              <path 
                key={i}
                d={`M -5 ${i * 3 - 8} Q -25 ${i * 5 - 10 + sway} -50 ${i * 6 - 12 + sway * 2}`}
                stroke="#64748b" // Lighter Slate Grey for visibility
                strokeWidth="3"
                fill="none"
                className="opacity-90"
              />
          );
      });

      return (
          <div 
            className={`absolute z-20 pointer-events-none drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] ${isEngaged ? 'animate-shake-critical' : ''}`}
            style={{ 
                left: entity.position.x, 
                top: entity.position.y,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`
            }}
          >
              <svg width="80" height="50" viewBox="-50 -25 80 50" className="overflow-visible">
                  {/* Tentacles trailing behind */}
                  {tentacles}
                  
                  {/* Main Body (Oval Head) - Metallic Grey */}
                  <defs>
                    <radialGradient id="sentinelMetal" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </radialGradient>
                  </defs>
                  
                  <ellipse 
                    cx="0" 
                    cy="0" 
                    rx="14" 
                    ry="10" 
                    fill="url(#sentinelMetal)" 
                    stroke={isEngaged ? "#ef4444" : "#cbd5e1"} 
                    strokeWidth={isEngaged ? "2" : "1"}
                    className={isEngaged ? "animate-pulse" : ""}
                  />
                  
                  {/* Multiple Red Eyes (Matrix Sentinel Style) - Bright Red */}
                  <circle cx="5" cy="-4" r="2" fill="#ef4444" className="animate-pulse" />
                  <circle cx="8" cy="0" r="2.5" fill="#ef4444" className="animate-pulse" />
                  <circle cx="5" cy="4" r="2" fill="#ef4444" className="animate-pulse" />
                  
                  {/* Side sensor eyes */}
                  <circle cx="-2" cy="-6" r="1.5" fill="#991b1b" />
                  <circle cx="-2" cy="6" r="1.5" fill="#991b1b" />
                  
                  {/* Status Effect if attacking */}
                  {isAttacking && (
                      <circle cx="12" cy="0" r="20" fill="none" stroke="red" strokeWidth="2" strokeDasharray="4,2" className="animate-ping opacity-60" />
                  )}
                  
                  {/* Status Effect if Engaged (Taking Damage) */}
                  {isEngaged && (
                       <circle cx="0" cy="0" r="18" fill="none" stroke="white" strokeWidth="1" className="animate-ping opacity-80" />
                  )}
              </svg>
          </div>
      );
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
            onClick={(e) => { e.stopPropagation(); }}
            onDoubleClick={(e) => { e.stopPropagation(); onClick(entity); }}
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
    const isFighting = entity.attributes?.estado === 'peleando';
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
        {/* COMBAT VISUALS (ALPHA ONLY) */}
        {isFighting && entity.attributes?.combatTargetPosition && (
            <div className="absolute top-1/2 left-1/2 pointer-events-none z-50">
                <svg className="overflow-visible" width="1" height="1">
                     {/* Laser Beam */}
                     <line 
                        x1="0" 
                        y1="0" 
                        x2={entity.attributes.combatTargetPosition.x - entity.position.x} 
                        y2={entity.attributes.combatTargetPosition.y - entity.position.y} 
                        stroke="#ef4444" 
                        strokeWidth="3"
                        strokeDasharray="10,5"
                        className="animate-energy-flow opacity-80"
                     />
                     {/* Target Impact Effect (Tornado) */}
                     <g transform={`translate(${entity.attributes.combatTargetPosition.x - entity.position.x}, ${entity.attributes.combatTargetPosition.y - entity.position.y})`}>
                         <circle r="25" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-spin-slow opacity-50" />
                         <circle r="15" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" className="animate-spin-reverse opacity-80" />
                         <path d="M-10,-10 L10,10 M10,-10 L-10,10" stroke="white" strokeWidth="2" className="animate-pulse" />
                     </g>
                </svg>
            </div>
        )}

        <div className={`relative ${!isDead && !isFighting ? 'animate-breathe' : ''} ${isEating ? 'scale-110' : ''}`}>
          {/* Shadow/Base (Scaled down to match body) */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-black/40 blur-sm rounded-full scale-y-50" />
          
          {/* MAIN BODY (RESIZED: w-9 h-9 mobile, w-11 h-11 desktop) */}
          <div 
            className={`w-9 h-9 md:w-11 md:h-11 rounded-full shadow-[0_4px_10px_rgba(6,182,212,0.3)] bg-transparent overflow-visible transition-all duration-1000 relative z-10 ${isFighting ? 'shadow-[0_0_20px_rgba(239,68,68,0.6)]' : ''}`}
            style={{ filter: getEnergyFilter(energy, isDead) }}
          >
            <img 
                src={entity.avatarUrl} 
                alt="Person" 
                className={`w-full h-full object-cover drop-shadow-md ${isFighting ? 'animate-shake-critical' : ''}`} 
            />
          </div>

          {!isDead && !isFighting && (activeEmote || isEating) && (
            <div className="absolute -top-6 -right-4 bg-slate-800 rounded-full p-1 shadow-lg text-lg animate-pop-in border border-white/20 z-20 min-w-[24px] text-center scale-75 md:scale-90">
                {isEating ? '⚡' : activeEmote}
            </div>
          )}

          {/* COMBAT INDICATOR */}
          {isFighting && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-alert-red/90 text-white px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold border border-red-500 shadow-lg whitespace-nowrap animate-bounce z-30 flex items-center gap-1">
                <Crosshair size={10} /> ATACANDO
            </div>
          )}

          {/* NEW VISUAL EFFECT FOR WORKING (Electric Thruster) */}
          {isWorking && !isDead && (
            <div className="absolute top-[80%] left-1/2 -translate-x-1/2 z-0 pointer-events-none">
                {/* Electric Propulsion Tail */}
                <div className="relative w-6 h-8 md:w-8 md:h-12 flex justify-center">
                    {/* Core Glow */}
                    <div className="absolute top-0 w-1.5 h-3 bg-white rounded-full blur-[2px] animate-pulse" />
                    {/* Outer Blue Glow */}
                    <div className="absolute top-0 w-3 h-6 bg-tech-cyan/60 blur-md rounded-full" />
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
             <div className="absolute -top-6 -left-4 bg-pink-900/90 text-pink-200 px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold border border-pink-500 shadow-lg whitespace-nowrap animate-pulse z-30">
              💀 Muriendo
            </div>
          )}

          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-tech-cyan border border-tech-cyan/30 text-[9px] md:text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-30 font-mono tracking-wider">
            {entity.attributes?.nombre} ({Math.round(entity.attributes?.energia || 0)}%)
          </div>
        </div>
      </div>
    );
  }

  // --- LAND RENDER (MATRIX POWER PLANT TOWER) ---
  if (entity.type === EntityType.LAND) {
      const resources = entity.landAttributes?.resourceLevel || 0;
      const isGhost = entity.landAttributes?.isGhost;
      
      // Map existing stages to Neon Colors based on Matrix Aesthetic
      let fluidColor = 'bg-yellow-500';
      let shadowColor = 'shadow-yellow-500/50';
      let coreColor = 'text-yellow-200';

      if (resources >= GAME_CONFIG.LAND.STAGE_2_THRESHOLD) {
          // Green (Full Power / Matrix Green)
          fluidColor = 'bg-neon-green';
          shadowColor = 'shadow-neon-green/60';
          coreColor = 'text-green-100';
      } else if (resources >= GAME_CONFIG.LAND.STAGE_1_THRESHOLD) {
          // Pink (Charging / Biomechanical)
          fluidColor = 'bg-pink-500';
          shadowColor = 'shadow-pink-500/60';
          coreColor = 'text-pink-100';
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
          {/* TOWER CONTAINER (Vertical, Biomechanical) */}
          {/* REDUCED SIZE BY 40% (Original: w-16 h-28 md:w-20 md:h-36) */}
          <div className="relative w-10 h-16 md:w-12 md:h-20 transition-transform duration-300">
            
            {/* 1. Base Pedestal (Scaled down) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2.5 bg-slate-900 border-t border-slate-700 rounded-[50%] shadow-lg z-20" />
            
            {/* 2. Main Tower Cylinder (Glass/Metal) */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3/4 h-[90%] bg-black/60 border-x border-slate-700 backdrop-blur-sm overflow-hidden z-10 rounded-t-xl">
                
                {/* Energy Fluid (Vertical Fill) */}
                <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out ${fluidColor} opacity-80`}
                    style={{ height: `${resources}%` }}
                >
                    {/* Fluid Surface Glow */}
                    <div className="absolute top-0 w-full h-0.5 bg-white/50 blur-[1px]" />
                    {/* Bubbles effect via CSS pattern */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:6px_6px]" />
                </div>

                {/* Inner Core Structure (Spine) */}
                <div className="absolute inset-0 flex flex-col justify-evenly opacity-30">
                    <div className="w-full h-px bg-slate-500" />
                    <div className="w-full h-px bg-slate-500" />
                    <div className="w-full h-px bg-slate-500" />
                    <div className="w-full h-px bg-slate-500" />
                    <div className="w-full h-px bg-slate-500" />
                </div>
            </div>

            {/* 3. Outer Ribs (The "Matrix Pod" look) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Left Rib (Scaled margin) */}
                <div className="absolute left-0.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-600 via-slate-400 to-slate-600 rounded-full opacity-80" />
                {/* Right Rib (Scaled margin) */}
                <div className="absolute right-0.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-600 via-slate-400 to-slate-600 rounded-full opacity-80" />
                
                {/* Top Cap (Scaled height) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-3.5 bg-slate-800 rounded-full border-b border-slate-500 flex items-center justify-center shadow-md">
                    <Activity size={10} className={`${coreColor} animate-pulse`} />
                </div>
            </div>

            {/* 4. Glow Aura (Outer Halo) */}
            <div className={`absolute inset-0 -z-10 rounded-full blur-lg opacity-40 transition-colors duration-1000 ${shadowColor}`} />

            {/* Ghost Indicator */}
            {isGhost && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                    <div className="bg-purple-900/80 text-purple-200 text-[6px] px-1 rounded border border-purple-500/50">GHOST</div>
                </div>
            )}
          </div>
        </div>
      );
  }

  return null;
};