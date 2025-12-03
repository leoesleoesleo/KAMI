
import React, { useState } from 'react';
import { AVATAR_PRESETS, BACKGROUND_IMAGE, GAME_VERSION, DEDICATION_IMAGE_URL } from '../constants';
import { Play, User, Cpu, RefreshCcw, Heart, X } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, avatar: string) => void;
  hasSaveGame?: boolean;
  onContinue?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, hasSaveGame, onContinue }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [showCredits, setShowCredits] = useState(false);

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

      {/* CREDITS BUTTON - Top Right */}
      <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={() => setShowCredits(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 hover:border-pink-500/50 hover:bg-pink-900/20 transition-all group"
          >
              <Heart size={16} className="text-pink-500 group-hover:animate-pulse" />
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-pink-200">DEDICATORIA</span>
          </button>
      </div>

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
                Tu misión es construir, optimizar y expandir un ecosistema de BioBots capaces de evolucionar, minar recursos, aprender y adaptarse en un mundo gobernado por datos.
                </p>
            </div>

            <div className="space-y-6">
                
                {/* CONTINUE BUTTON */}
                {hasSaveGame && onContinue && (
                    <button 
                    onClick={onContinue}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-tech font-bold tracking-widest transition-all duration-300 relative overflow-hidden group bg-neon-green/20 text-neon-green border border-neon-green hover:bg-neon-green hover:text-black hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-pulse"
                    >
                        <RefreshCcw size={20} fill="currentColor" />
                        RESTAURAR SIMULACIÓN
                    </button>
                )}

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
                EJECUTAR NUEVA SIMULACIÓN
                </button>
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

      {/* --- CREDITS & DEDICATION MODAL --- */}
      {showCredits && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0f172a] border border-tech-cyan/30 w-full max-w-5xl rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-[600px] animate-pop-in relative">
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => setShowCredits(false)}
                    className="absolute top-4 right-4 z-20 text-gray-500 hover:text-white bg-black/50 rounded-full p-2 transition-colors"
                  >
                      <X size={24} />
                  </button>

                  {/* LEFT: Text Content */}
                  <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-tech-cyan/20 rounded-tl-3xl" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-tech-purple/20 rounded-br-3xl" />
                      
                      <div className="relative z-10 space-y-6">
                          <div className="flex items-center gap-3 text-tech-cyan mb-2">
                              <Heart className="fill-current animate-pulse" size={24} />
                              <span className="font-mono tracking-widest uppercase font-bold">Dedicatoria</span>
                          </div>

                          <h2 className="text-4xl md:text-5xl font-tech font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight">
                              Para Santiago
                          </h2>

                          <div className="w-16 h-1 bg-gradient-to-r from-tech-cyan to-tech-purple" />

                          <p className="font-sans text-lg md:text-xl text-gray-300 leading-relaxed font-light italic opacity-90">
                              "Este juego fue creado por <strong className="text-white font-semibold">Leonardo Patiño Rodríguez</strong> en el año 2025 para su hijo <strong className="text-tech-cyan font-semibold">Santiago Patiño David</strong>, de 8 años, a quien quiere profundamente. Esta obra está dedicada a su curiosidad, imaginación y sueños."
                          </p>

                          <div className="pt-8 flex items-center gap-4 opacity-50">
                              <Cpu size={20} />
                              <span className="font-mono text-sm">BIOBOTS SYSTEM {GAME_VERSION}</span>
                          </div>
                      </div>
                  </div>

                  {/* RIGHT: Image Content */}
                  <div className="flex-1 relative h-64 md:h-auto bg-black">
                      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#0f172a] to-transparent z-10" />
                      <img 
                        src={DEDICATION_IMAGE_URL} 
                        alt="Dedicatoria" 
                        className="w-full h-full object-cover object-center opacity-80 hover:opacity-100 transition-opacity duration-1000"
                      />
                      <div className="absolute inset-0 border-l border-white/10 hidden md:block" />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
