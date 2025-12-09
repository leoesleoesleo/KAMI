
import React, { useRef, useState } from 'react';
import { GameEntity, Vector2, EntityType } from '../types';
import { WORLD_SIZE } from '../constants';
import { EntityNode } from './EntityNode';
import { ZoomIn, ZoomOut, Zap } from 'lucide-react';
import { snapToGrid } from '../services/gameService';

interface WorldCanvasProps {
  entities: GameEntity[];
  onEntityClick: (entity: GameEntity) => void;
  isWatering: boolean; // Keeping prop for backwards compat, but logic moved to reloadingNodeId
  isPlacingLand: boolean;
  isPlacingPerson?: boolean;
  isTargetingRecharge?: boolean; // New Prop
  rechargingNodeId?: string | null; // New Prop
  onLandPlace: (position: Vector2) => void;
  onEntityDrag: (id: string, position: Vector2) => void;
  onNodeRecharge?: (id: string) => void; // New Handler
  walletStats?: { energy: number; crypto: number }; // NEW: Stats for Wallet Visuals
  blocksToPlace?: number;
  level?: number; // New Level Prop
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({ 
    entities, 
    onEntityClick, 
    isWatering, 
    isPlacingLand,
    isPlacingPerson,
    isTargetingRecharge,
    rechargingNodeId,
    onLandPlace,
    onEntityDrag,
    onNodeRecharge,
    walletStats,
    blocksToPlace,
    level = 1
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Vector2>({ x: -WORLD_SIZE / 2 + window.innerWidth / 2, y: -WORLD_SIZE / 2 + window.innerHeight / 2 });
  
  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [startPan, setStartPan] = useState<Vector2>({ x: 0, y: 0 });

  const hasDraggedRef = useRef(false);

  // Helper to get coordinates from either Mouse or Touch event
  const getEventPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      // For mouse events or if touches is empty
      const mouseEvent = e as React.MouseEvent | MouseEvent;
      return { x: mouseEvent.clientX, y: mouseEvent.clientY };
  };

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

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPlacingLand || isPlacingPerson || isTargetingRecharge || (blocksToPlace && blocksToPlace > 0)) return;
    
    // Check if it's a mouse event and left click (button 0)
    // For touch, there is no 'button' property, so we proceed
    if ('button' in e && e.button !== 0) return;

    if (draggingEntityId) {
        // Entity logic handled in dragging effect
    } else {
      setIsPanning(true);
      const pos = getEventPos(e);
      setStartPan({ x: pos.x - offset.x, y: pos.y - offset.y });
    }
  };

  const handleEntityMouseDown = (e: React.MouseEvent | React.TouchEvent, entity: GameEntity) => {
      if ((entity.type === EntityType.LAND || entity.type === EntityType.PERSON || entity.type === EntityType.BLOCK) && !isPlacingLand && !isPlacingPerson && !isTargetingRecharge && (!blocksToPlace || blocksToPlace <= 0)) {
          
          // --- GHOST NODE RESTRICTION ---
          // Ghost Nodes are immovable anomalies
          if (entity.type === EntityType.LAND && entity.landAttributes?.isGhost) {
              return;
          }

          e.stopPropagation();
          setDraggingEntityId(entity.id);
          hasDraggedRef.current = false;
      }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPlacingLand || isPlacingPerson || isTargetingRecharge || (blocksToPlace && blocksToPlace > 0)) return;

    const pos = getEventPos(e);

    if (draggingEntityId) {
        hasDraggedRef.current = true;
        const worldPos = getWorldCoordinates(pos.x, pos.y);
        
        let clampedX = Math.max(0, Math.min(WORLD_SIZE, worldPos.x));
        let clampedY = Math.max(0, Math.min(WORLD_SIZE, worldPos.y));
        
        // --- GRID SNAPPING FOR BLOCKS ---
        const draggingEntity = entities.find(e => e.id === draggingEntityId);
        if (draggingEntity && draggingEntity.type === EntityType.BLOCK) {
            const snapped = snapToGrid({x: clampedX, y: clampedY});
            clampedX = snapped.x;
            clampedY = snapped.y;
        }

        onEntityDrag(draggingEntityId, { x: clampedX, y: clampedY });
        return;
    }

    if (isPanning) {
      setOffset({
        x: pos.x - startPan.x,
        y: pos.y - startPan.y,
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
      if (isPlacingLand || isPlacingPerson || (blocksToPlace && blocksToPlace > 0)) {
          const worldPos = getWorldCoordinates(e.clientX, e.clientY);
          // Block placement logic will handle snapping inside createBlockEntity
          onLandPlace(worldPos);
      }
  };

  const handleEntityClickWrapper = (entity: GameEntity) => {
      if (hasDraggedRef.current) {
          return;
      }
      
      // NEW: Intercept click if we are targeting a node for recharge
      if (isTargetingRecharge && entity.type === EntityType.LAND && onNodeRecharge) {
          onNodeRecharge(entity.id);
          return;
      }

      // FIX: Prevent selection/popup for Blocks (Security Cubes)
      // Users can drag them (via MouseDown) but clicking won't open properties
      if (entity.type === EntityType.BLOCK) {
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

  const getCursorStyle = () => {
      if (isPlacingLand || isPlacingPerson || isTargetingRecharge || (blocksToPlace && blocksToPlace > 0)) return 'cursor-crosshair';
      if (isPanning) return 'cursor-grabbing';
      return 'cursor-grab';
  };

  // --- BACKGROUND RENDER LOGIC ---
  const renderBackground = () => {
      // LEVEL 1: Dark Tech (Default)
      if (level === 1) {
          return (
              <>
                <div className="absolute inset-0 bg-[#020617]" />
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 2.24 5 5 2.24 5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 2.24 5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 2.24 5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2364748b' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundSize: '300px 300px'
                    }}
                />
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at 90% 10%, rgba(234, 88, 12, 0.15) 0%, rgba(234, 88, 12, 0.05) 40%, transparent 70%), radial-gradient(circle at 10% 90%, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 40%, transparent 70%)`
                    }}
                />
                <div 
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
                        backgroundSize: '100px 100px'
                    }}
                />
                <div className="absolute inset-0 border-4 border-cyan-900/50 rounded shadow-[0_0_50px_rgba(6,182,212,0.1)]" />
              </>
          );
      } 
      
      // LEVEL 2: Biotech / Nature (Green/Teal)
      else if (level === 2) {
          return (
              <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] to-[#111827]" />
                  {/* Organic Lake Pattern */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] mix-blend-overlay" />
                  
                  {/* Hex Grid Overlay */}
                  <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0' stroke='%2334d399' stroke-width='1'/%3E%3C/svg%3E")`,
                    }}
                  />
                   
                   {/* Biotech Glows */}
                   <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
                   <div className="absolute inset-0 border-4 border-emerald-800/50 rounded shadow-[0_0_50px_rgba(16,185,129,0.2)]" />
              </>
          );
      }

      // LEVEL 3: Ascension / Sky (Blue/Purple/White)
      else {
          return (
              <>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-[#312e81] to-[#4c1d95]" />
                  {/* Cloud/Data Texture */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                  
                  {/* Floating Platforms effect via gradient */}
                  <div 
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{
                          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 20%)`
                      }}
                  />
                  
                  {/* High Tech Grid */}
                   <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(167,139,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.5) 1px, transparent 1px)`,
                        backgroundSize: '200px 200px'
                    }}
                  />

                  <div className="absolute inset-0 border-4 border-violet-500/50 rounded shadow-[0_0_80px_rgba(167,139,250,0.4)]" />
              </>
          );
      }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#020617] overflow-hidden relative ${getCursorStyle()}`}
      style={{ touchAction: 'none' }} // Prevent scrolling on mobile
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
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
        {/* DYNAMIC BACKGROUND */}
        {renderBackground()}
        
        {entities.map(entity => (
          <React.Fragment key={entity.id}>
            <EntityNode 
              entity={entity} 
              onClick={handleEntityClickWrapper}
              onMouseDown={handleEntityMouseDown}
              walletStats={walletStats} // NEW: Pass Stats to Entity Node
            />
            
            {/* Show Recharge Effect ONLY on the specific target node */}
            {entity.type === EntityType.LAND && rechargingNodeId === entity.id && (
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
              [ TARGET: DATA NODE COORDINATES ]
          </div>
      )}

      {/* Placing Person Indicator */}
      {isPlacingPerson && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-tech-cyan animate-pulse font-tech text-xl md:text-2xl font-bold bg-slate-900/90 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-tech-cyan/50 tracking-widest whitespace-nowrap z-50">
              [ TARGET: BIOBOT COORDINATES ]
          </div>
      )}

      {/* Placing Blocks Indicator */}
      {blocksToPlace !== undefined && blocksToPlace > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white animate-pulse font-tech text-xl md:text-2xl font-bold bg-slate-900/90 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-gray-400/50 tracking-widest whitespace-nowrap z-50">
              [ BUILD MODE ACTIVE ]
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
