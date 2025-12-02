import React, { useState } from 'react';
import { AVATAR_PRESETS, BACKGROUND_IMAGE } from '../constants';
import { Music, Play, User, Cpu } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, avatar: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-deep-space text-gray-100 font-sans">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center transition-transform duration-[40s] hover:scale-105"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
      />
      
      {/* Tech Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent)`,
            backgroundSize: '50px 50px'
        }}
      />
      
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-deep-space via-deep-space/80 to-transparent" />

      <div className="relative z-10 w-full max-w-6xl p-4 md:p-8 flex flex-col items-center overflow-y-auto h-full md:h-auto justify-center">
        
        {/* DOMINANT TITLE SECTION - RESPONSIVE */}
        <div className="text-center mb-8 md:mb-12 animate-title-pulse w-full px-4">
            <h1 className="text-4xl sm:text-6xl md:text-9xl font-tech font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-tech-cyan to-tech-purple drop-shadow-[0_0_25px_rgba(6,182,212,0.6)] tracking-tight leading-tight">
              BioBots
            </h1>
            <h2 className="text-sm sm:text-xl md:text-3xl font-mono text-neon-green tracking-[0.3em] md:tracking-[0.5em] uppercase mt-2 drop-shadow-md break-words">
              Génesis Evolutiva
            </h2>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 backdrop-blur-xl bg-slate-900/60 rounded-3xl border border-tech-cyan/20 shadow-[0_0_50px_rgba(6,182,212,0.1)] p-6 md:p-8">
            {/* Left Col: Welcome & Form */}
            <div className="flex flex-col justify-center space-y-6 md:space-y-8">
            <div className="space-y-4 text-center md:text-left">
                <p className="text-gray-400 font-mono text-xs md:text-sm leading-relaxed border-l-2 border-tech-cyan/50 pl-4">
                Inicializando simulación...<br/>
                Toma el control del núcleo central. Programa la vida, optimiza el código genético y evoluciona tu enjambre digital.
                </p>
            </div>

            <div className="space-y-6">
                <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-cyan group-focus-within:text-neon-green transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Identificador de Arquitecto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-tech-cyan/30 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-tech-cyan focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono"
                />
                </div>
                
                <button 
                onClick={() => name && onStart(name, selectedAvatar)}
                disabled={!name}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-tech font-bold tracking-widest transition-all duration-300 relative overflow-hidden group ${name ? 'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan hover:bg-tech-cyan hover:text-deep-space hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]' : 'bg-gray-800/50 text-gray-600 border border-gray-700 cursor-not-allowed'}`}
                >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <Play size={20} fill="currentColor" />
                EJECUTAR SIMULACIÓN
                </button>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500 font-mono">
                <Music size={12} />
                <span>Secuencia de audio inmersiva activa</span>
            </div>
            </div>

            {/* Right Col: Avatar Selection */}
            <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-tech text-lg text-tech-purple">Selección de Avatar</h3>
                <Cpu size={16} className="text-tech-cyan animate-pulse" />
            </div>
            
            <div className="grid grid-cols-5 gap-2 md:gap-3">
                {AVATAR_PRESETS.map((avatar, idx) => (
                <button
                    key={idx}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-300 ${selectedAvatar === avatar ? 'border-tech-cyan scale-110 shadow-[0_0_15px_rgba(6,182,212,0.5)] bg-tech-cyan/20' : 'border-transparent hover:border-white/20 grayscale hover:grayscale-0 bg-black/30'}`}
                >
                    <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
                ))}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center mt-4 relative">
                <div className="absolute inset-0 bg-tech-cyan/5 blur-3xl rounded-full" />
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-tech-cyan p-1 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-black/50 relative">
                <div className="absolute inset-0 border-t-2 border-neon-green rounded-full animate-spin-slow" />
                <div className="absolute inset-0 border-b-2 border-tech-purple rounded-full animate-spin-reverse" />
                <img src={selectedAvatar} alt="Selected" className="w-full h-full rounded-full object-cover relative z-10" />
                </div>
                
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 font-mono mb-1">ARQUITECTO:</p>
                    <p className="text-lg text-neon-green font-tech tracking-wider">
                        {name || "NO_DATA"}
                    </p>
                </div>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};