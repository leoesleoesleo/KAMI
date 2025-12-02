
import React, { useRef, useState } from 'react';
import { GameEntity, Vector2, EntityType } from '../types';
import { WORLD_SIZE } from '../constants';
import { EntityNode } from './EntityNode';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface WorldCanvasProps {
  entities: GameEntity[];
  onEntityClick: (entity: GameEntity) => void;
  isWatering: boolean;
  isPlacingLand: boolean;
  onLandPlace: (position: Vector2) => void;
  onEntityDrag: (id: string, position: Vector2) => void;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({ 
    entities, 
    onEntityClick, 
    isWatering, 
    isPlacingLand,
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

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(0.2, scale - e.deltaY * zoomSensitivity), 3);
    setScale(newScale);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const step = 0.2;
    const newScale = direction === 'in' 
        ? Math.min(3, scale + step)
        : Math.max(0.2, scale - step);
    setScale(newScale);
  };

  const getWorldCoordinates = (screenX: number, screenY: number): Vector2 => {
     // Transform logic: Screen -> World
     // screen = world * scale + offset
     // world = (screen - offset) / scale
     return {
         x: (screenX - offset.x) / scale,
         y: (screenY - offset.y) / scale
     };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // If placing land, click logic is handled in onClick, not drag
    if (isPlacingLand) return;

    if (e.button === 0) { // Left click
      if (draggingEntityId) {
          // Handled in EntityNode, but safety check
      } else {
        setIsPanning(true);
        setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    }
  };

  const handleEntityMouseDown = (e: React.MouseEvent, entity: GameEntity) => {
      // Enable dragging for both Land and Person entities
      if ((entity.type === EntityType.LAND || entity.type === EntityType.PERSON) && !isPlacingLand) {
          e.stopPropagation(); // Stop world panning
          setDraggingEntityId(entity.id);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPlacingLand) return;

    if (draggingEntityId) {
        // Update entity position
        const worldPos = getWorldCoordinates(e.clientX, e.clientY);
        // Clamp to world bounds
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
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (isPlacingLand) {
          const worldPos = getWorldCoordinates(e.clientX, e.clientY);
          onLandPlace(worldPos);
      }
  };

  // Improved Juicy Watering Effect
  const WateringEffect = ({ position }: { position: Vector2 }) => (
    <div 
        className="absolute pointer-events-none z-30"
        style={{ left: position.x, top: position.y }}
    >
        {/* Container for Can Animation: Hover and Tilt */}
        <div className="absolute -top-32 -left-14 animate-[float_3s_ease-in-out_infinite]">
            <div className="origin-bottom-right transition-transform duration-1000 animate-[pulse_1s_ease-in-out] rotate-[-25deg]">
                {/* Custom SVG: Orange Modern Watering Can - Scaled down */}
                <svg 
                    width="90" 
                    height="90" 
                    viewBox="0 0 100 100" 
                    className="drop-shadow-2xl"
                >
                    {/* Can Body */}
                    <path d="M20 45 Q20 35 30 35 H60 Q70 35 70 45 V80 Q70 90 60 90 H30 Q20 90 20 80 Z" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
                    {/* Highlights */}
                    <path d="M25 45 Q25 40 30 40 H55" stroke="#FDBA74" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
                    <circle cx="35" cy="65" r="8" fill="#FDBA74" opacity="0.4" />

                    {/* Handle */}
                    <path d="M25 35 Q10 20 5 45 Q0 70 20 80" fill="none" stroke="#EA580C" strokeWidth="6" strokeLinecap="round" />
                    
                    {/* Spout Base */}
                    <path d="M65 50 L90 35" stroke="#EA580C" strokeWidth="8" strokeLinecap="round" />
                    
                    {/* Rose (The Head) */}
                    <ellipse cx="92" cy="34" rx="6" ry="12" fill="#FCD34D" stroke="#B45309" strokeWidth="1" transform="rotate(-30 92 34)" />
                    
                    {/* Badge/Logo */}
                    <circle cx="45" cy="65" r="12" fill="#FFF7ED" />
                    <path d="M45 58 L47 63 H52 L48 66 L49 71 L45 68 L41 71 L42 66 L38 63 H43 Z" fill="#F59E0B" />
                </svg>
            </div>
            
            {/* Water Stream & Droplets */}
            <div className="absolute top-[22px] left-[60px] w-20 h-40 overflow-visible">
                 {/* Main Stream Lines */}
                 <div className="absolute left-2 top-0 w-1 h-24 bg-gradient-to-b from-cyan-300 to-transparent opacity-60 animate-[pulse_0.2s_infinite]" />
                 
                 {/* Falling Droplets */}
                 {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute bg-cyan-400 rounded-full rounded-tr-none border border-cyan-200 shadow-[0_0_5px_rgba(34,211,238,0.8)]"
                        style={{
                            width: `${4 + Math.random() * 4}px`,
                            height: `${4 + Math.random() * 4}px`,
                            left: `${Math.random() * 10}px`,
                            top: '0px',
                            animation: `waterDrop 0.8s linear infinite`,
                            animationDelay: `${Math.random() * 0.5}s`,
                            transform: 'rotate(-45deg)'
                        }}
                    >
                        {/* Shine reflection */}
                        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                    </div>
                 ))}
            </div>
        </div>

        {/* Splash Effect on Ground */}
        <div className="absolute top-8 left-0 w-32 h-32 flex items-center justify-center pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
                 <div 
                    key={`splash-${i}`}
                    className="absolute bg-blue-300 rounded-full opacity-0 animate-splash"
                    style={{
                        width: '6px',
                        height: '6px',
                        left: '50%',
                        top: '50%',
                        animationDelay: `${0.2 + Math.random() * 0.5}s`,
                        transform: `rotate(${i * 60}deg) translate(15px)`
                    }}
                 />
            ))}
            <div className="absolute w-20 h-4 bg-blue-400/30 blur-md rounded-[100%] animate-pulse" />
        </div>

        <style>{`
            @keyframes waterDrop {
                0% { transform: translateY(0) rotate(-45deg) scale(0.5); opacity: 0; }
                20% { opacity: 1; transform: translateY(10px) rotate(-45deg) scale(1); }
                100% { transform: translateY(120px) rotate(-45deg) scale(0.8); opacity: 0; }
            }
        `}</style>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#142615] overflow-hidden relative ${isPlacingLand ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* 
        RPG TACTICAL / PIXEL ART STYLE BACKGROUND
        1. Base: Void is Dark Green
        2. World: Bright Green Grass
        3. Pattern: Checkerboard for tiles
      */}
      
      {/* World Container */}
      <div 
        className="relative origin-top-left transition-transform duration-75 ease-out will-change-transform"
        style={{
          width: WORLD_SIZE,
          height: WORLD_SIZE,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        {/* Base Grass Layer */}
        <div className="absolute inset-0 bg-[#4ade80]" />

        {/* Checkerboard Tile Pattern (CSS Gradient) */}
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
                backgroundImage: `
                    linear-gradient(45deg, #15803d 25%, transparent 25%, transparent 75%, #15803d 75%, #15803d),
                    linear-gradient(45deg, #15803d 25%, transparent 25%, transparent 75%, #15803d 75%, #15803d)
                `,
                backgroundPosition: '0 0, 50px 50px',
                backgroundSize: '100px 100px'
            }}
        />

        {/* Subtle Grid Lines (Overlay) */}
         <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#14532d 1px, transparent 1px), linear-gradient(90deg, #14532d 1px, transparent 1px)`,
                backgroundSize: '100px 100px'
            }}
         />

        {/* World Border (Map Style) */}
        <div className="absolute inset-0 border-[20px] border-[#3f6212] rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)]" />
        
        {entities.map(entity => (
          <React.Fragment key={entity.id}>
            <EntityNode 
              entity={entity} 
              onClick={onEntityClick}
              onMouseDown={handleEntityMouseDown} 
            />
            {isWatering && entity.type === EntityType.LAND && (
                <WateringEffect position={entity.position} />
            )}
          </React.Fragment>
        ))}

      </div>

      {/* Vignette (Forest Style) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(10,35,10,0.7)_100%)]" />

      {/* Placing Indicator */}
      {isPlacingLand && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white animate-pulse font-serif text-2xl font-bold bg-green-900/80 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(74,222,128,0.4)] border border-green-400 tracking-widest">
              SELECCIONAR COORDENADAS
          </div>
      )}

      {/* Zoom Controls: Light/Nature Mode Adaptation */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-green-900/80 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-green-500/30 pointer-events-auto">
        <button 
            onClick={() => handleZoom('in')}
            className="p-2 hover:bg-white/10 rounded-lg text-green-100 hover:text-white transition-colors"
            title="Acercar"
        >
            <ZoomIn size={24} />
        </button>
        <div className="text-center text-xs font-mono text-green-200 py-1 border-t border-b border-white/10">
            {Math.round(scale * 100)}%
        </div>
        <button 
            onClick={() => handleZoom('out')}
            className="p-2 hover:bg-white/10 rounded-lg text-green-100 hover:text-white transition-colors"
            title="Alejar"
        >
            <ZoomOut size={24} />
        </button>
      </div>
    </div>
  );
};
