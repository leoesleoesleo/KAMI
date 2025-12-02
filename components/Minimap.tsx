
import React from 'react';
import { GameEntity, EntityType, Vector2 } from '../types';
import { WORLD_SIZE } from '../constants';

interface MinimapProps {
    entities: GameEntity[];
    viewportOffset?: Vector2; // Optional: could show camera rect later
}

export const Minimap: React.FC<MinimapProps> = ({ entities }) => {
    return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-tech-cyan/30 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] w-[150px] h-[150px] relative overflow-hidden group">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(6,182,212,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            {/* Title Overlay (Fades out on hover to see clearer) */}
            <div className="absolute top-1 left-2 text-[8px] font-mono text-gray-500 group-hover:opacity-0 transition-opacity pointer-events-none">
                SECTOR SCAN
            </div>

            {entities.map(entity => {
                // Map world position to percentage (0-100%)
                const left = (entity.position.x / WORLD_SIZE) * 100;
                const top = (entity.position.y / WORLD_SIZE) * 100;
                
                // Styles based on Entity Type
                let colorClass = '';
                let sizeClass = '';
                let zIndex = 0;

                if (entity.type === EntityType.PERSON) {
                    if (entity.attributes?.estado === 'muerto') {
                        colorClass = 'bg-gray-500';
                        sizeClass = 'w-1 h-1';
                        zIndex = 10;
                    } else {
                        colorClass = 'bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.8)] animate-pulse';
                        sizeClass = 'w-1.5 h-1.5 rounded-full';
                        zIndex = 20;
                    }
                } else if (entity.type === EntityType.LAND) {
                    const resources = entity.landAttributes?.resourceLevel || 0;
                    if (resources >= 100) colorClass = 'bg-neon-green';
                    else if (resources >= 50) colorClass = 'bg-pink-400';
                    else colorClass = 'bg-yellow-600';
                    
                    sizeClass = 'w-2 h-2 rounded-sm';
                    zIndex = 5;
                }

                return (
                    <div
                        key={entity.id}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 ${colorClass} ${sizeClass}`}
                        style={{ 
                            left: `${left}%`, 
                            top: `${top}%`,
                            zIndex
                        }}
                    />
                );
            })}
            
            {/* Border Overlay */}
            <div className="absolute inset-0 border border-tech-cyan/20 rounded-lg pointer-events-none" />
        </div>
    );
};
