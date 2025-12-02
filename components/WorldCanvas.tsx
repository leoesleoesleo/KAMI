import React, { useRef, useState } from 'react';
import { GameEntity, Vector2, EntityType } from '../types';
import { WORLD_SIZE } from '../constants';
import { EntityNode } from './EntityNode';
import { ZoomIn, ZoomOut, Zap } from 'lucide-react';

interface WorldCanvasProps {
  entities: GameEntity[];
  onEntityClick: (entity: GameEntity) => void;
  isWatering: boolean;
  isPlacingLand: boolean;
  isPlacingPerson?: boolean;
  onLandPlace: (position: Vector2) => void;
  onEntityDrag: (id: string, position: Vector2) => void;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({ 
    entities, 
    onEntityClick, 
    isWatering, 
    isPlacingLand,
    isPlacingPerson,
    onLandPlace,
    onEntityDrag
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Vector2>({ x: -WORLD_SIZE / 2 + window.innerWidth / 2, y: -WORLD_SIZE / 2 + window.innerHeight / 2 });
  
  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [startPan, setStartPan] = useState<Vector2>({ x: 0, y: 0 });

  const hasDraggedRef = useRef(false);

  const applyZoom = (newScale: number) => {
      if (!containerRef.current) return;
      
      // Calculate the world coordinates of the viewport center
      const viewportCenter = {
          x: containerRef.current.clientWidth / 2,
          y: containerRef.current.clientHeight / 2
      };

      const worldFocus = {
          x: (viewportCenter.x - offset.x) / scale,
          y: (viewportCenter.y - offset.y) / scale
      };

      // Calculate new offset so that worldFocus stays at viewportCenter
      const newOffset = {
          x: viewportCenter.x - worldFocus.x * newScale,
          y: viewportCenter.y - worldFocus.y * newScale
      };

      // Apply
      setScale(Math.round(newScale * 1000) / 1000); // Higher precision
      setOffset(newOffset);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // Ultra-smooth zoom sensitivity for precise control
    const zoomSensitivity = 0.0005; 
    const targetScale = Math.min(Math.max(0.2, scale - e.deltaY * zoomSensitivity), 3);
    applyZoom(targetScale);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    // Precise 5% step
    const step = 0.05;
    const targetScale = direction === 'in' 
        ? Math.min(3, scale + step)
        : Math.max(0.2, scale - step);
    
    applyZoom(targetScale);
  };

  const getWorldCoordinates = (screenX: number, screenY: number): Vector2 => {
     return {
         x: (screenX - offset.x) / scale,
         y: (screenY - offset.y) / scale
     };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlacingLand || isPlacingPerson) return;

    if (e.button === 0) {
      if (draggingEntityId) {
      } else {
        setIsPanning(true);
        setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    }
  };

  const handleEntityMouseDown = (e: React.MouseEvent, entity: GameEntity) => {
      if ((entity.type === EntityType.LAND || entity.type === EntityType.PERSON) && !isPlacingLand && !isPlacingPerson) {
          e.stopPropagation();
          setDraggingEntityId(entity.id);
          hasDraggedRef.current = false;
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPlacingLand || isPlacingPerson) return;

    if (draggingEntityId) {
        hasDraggedRef.current = true;
        const worldPos = getWorldCoordinates(e.clientX, e.clientY);
        const clampedX = Math.max(0, Math.min(WORLD_SIZE, worldPos.x));
        const clampedY = Math.max(0, Math.min(WORLD_SIZE, worldPos.y));
        
        onEntityDrag(draggingEntityId, { x: clampedX, y: clampedY });
        return;
    }

    if (isPanning) {
      setOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingEntityId(null);
    setTimeout(() => {
        hasDraggedRef.current = false;
    }, 50);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (isPlacingLand || isPlacingPerson) {
          const worldPos = getWorldCoordinates(e.clientX, e.clientY);
          onLandPlace(worldPos);
      }
  };

  const handleEntityClickWrapper = (entity: GameEntity) => {
      if (hasDraggedRef.current) {
          return;
      }
      onEntityClick(entity);
  };

  // NEW: "Nanotube / Magic Cable" Recharge Effect
  const NanotubeRechargeEffect = ({ position }: { position: Vector2 }) => (
    <div 
        className="absolute pointer-events-none z-50"
        style={{ left: position.x, top: position.y }}
    >
        {/* The Connection Cable SVG */}
        <svg 
            width="100" 
            height="500" 
            viewBox="0 0 100 500" 
            className="absolute -bottom-0 left-1/2 -translate-x-1/2 overflow-visible"
        >
            <defs>
                <linearGradient id="energyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(6,182,212,0)" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
            </defs>
            
            {/* The physical 'nanotube' structure */}
            <path 
                d="M50 0 L50 500" 
                stroke="rgba(6,182,212,0.3)" 
                strokeWidth="2" 
                fill="none" 
            />
            
            {/* The ionized current flowing down */}
            <path 
                d="M50 0 L50 500" 
                stroke="url(#energyGradient)" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="20, 20"
                className="animate-energy-flow"
            />
        </svg>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
             {/* Connection Flash at contact point */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full blur-xl animate-connection-flash mix-blend-overlay" />
             
             {/* Tech Ring Pulse */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-tech-cyan rounded-full animate-shockwave-expand opacity-0" />
             
             {/* Central Node Glow */}
             <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_#06b6d4] animate-pulse" />
        </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#020617] overflow-hidden relative ${isPlacingLand || isPlacingPerson ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onTouchStart={handleMouseDown as any}
      onTouchMove={handleMouseMove as any}
      onTouchEnd={handleMouseUp}
    >
      {/* World Container */}
      <div 
        className="relative origin-top-left transition-transform duration-75 ease-out will-change-transform"
        style={{
          width: WORLD_SIZE,
          height: WORLD_SIZE,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        {/* BACKGROUND: Soft Tech Relief + Thermal Map */}
        <div className="absolute inset-0 bg-[#020617]" />
        
        {/* 1. Relief/Topographic Pattern (Subtle) */}
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '300px 300px'
            }}
        />

        {/* 2. Heat Zone (Top Right - Warm) */}
        <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
                background: `radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.4) 0%, transparent 60%)`
            }}
        />

        {/* 3. Cold Zone (Bottom Left - Cool) */}
        <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
                background: `radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.4) 0%, transparent 60%)`
            }}
        />

        {/* 4. Digital Grid (Subtle overlay for structure) */}
        <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
                backgroundSize: '100px 100px'
            }}
        />

        {/* World Border (Neon Line) */}
        <div className="absolute inset-0 border-4 border-cyan-900/50 rounded shadow-[0_0_50px_rgba(6,182,212,0.1)]" />
        
        {entities.map(entity => (
          <React.Fragment key={entity.id}>
            <EntityNode 
              entity={entity} 
              onClick={handleEntityClickWrapper}
              onMouseDown={handleEntityMouseDown} 
            />
            {isWatering && entity.type === EntityType.LAND && (
                <NanotubeRechargeEffect position={entity.position} />
            )}
          </React.Fragment>
        ))}

      </div>

      {/* Vignette (Tech Style) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,#020617_100%)] opacity-80" />

      {/* Placing Indicator */}
      {isPlacingLand && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-neon-green animate-pulse font-tech text-xl md:text-2xl font-bold bg-slate-900/90 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.4)] border border-neon-green/50 tracking-widest whitespace-nowrap z-50">
              [ TARGET: LAND COORDINATES ]
          </div>
      )}

      {/* Placing Person Indicator */}
      {isPlacingPerson && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-tech-cyan animate-pulse font-tech text-xl md:text-2xl font-bold bg-slate-900/90 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-tech-cyan/50 tracking-widest whitespace-nowrap z-50">
              [ TARGET: BIOBOT COORDINATES ]
          </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto scale-75 md:scale-100 origin-right">
        <button 
            onClick={() => handleZoom('in')}
            className="p-2 hover:bg-white/10 rounded-lg text-tech-cyan hover:text-white transition-colors active:scale-95"
            title="Aumentar Zoom"
        >
            <ZoomIn size={24} />
        </button>
        <div className="text-center text-xs font-mono text-gray-400 py-1 border-t border-b border-gray-700 w-full">
            {Math.round(scale * 100)}%
        </div>
        <button 
            onClick={() => handleZoom('out')}
            className="p-2 hover:bg-white/10 rounded-lg text-tech-cyan hover:text-white transition-colors active:scale-95"
            title="Reducir Zoom"
        >
            <ZoomOut size={24} />
        </button>
      </div>
    </div>
  );
};