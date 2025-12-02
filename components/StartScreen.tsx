import React, { useState } from 'react';
import { AVATAR_PRESETS, BACKGROUND_IMAGE } from '../constants';
import { Music, Play, User } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, avatar: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-modern-dark text-ethereal-white">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-modern-dark via-transparent to-modern-dark" />

      <div className="relative z-10 w-full max-w-4xl p-8 grid grid-cols-1 md:grid-cols-2 gap-12 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
        
        {/* Left Col: Welcome & Form */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-ethereal-white to-gray-400">
              KAMI
            </h1>
            <p className="text-gray-300 font-sans font-light">
              Toma el lugar de la divinidad. Crea vida, moldea el entorno y observa cómo evoluciona tu civilización.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-divine-gold transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Nombre de tu Deidad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-divine-gold/50 transition-all font-sans"
              />
            </div>
            
            <button 
              onClick={() => name && onStart(name, selectedAvatar)}
              disabled={!name}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-serif font-bold tracking-widest transition-all duration-300 ${name ? 'bg-divine-gold text-modern-dark hover:bg-yellow-500 hover:shadow-[0_0_20px_rgba(197,160,89,0.4)] transform hover:-translate-y-1' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              <Play size={18} fill="currentColor" />
              INICIAR JUEGO NUEVO
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
            <Music size={12} />
            <span>Incluye banda sonora inmersiva</span>
          </div>
        </div>

        {/* Right Col: Avatar Selection */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-serif text-lg text-ethereal-white/80 border-b border-white/10 pb-2">Elige tu Avatar</h3>
          <div className="grid grid-cols-5 gap-3">
            {AVATAR_PRESETS.map((avatar, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAvatar(avatar)}
                className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all duration-300 ${selectedAvatar === avatar ? 'border-divine-gold scale-110 shadow-[0_0_15px_rgba(197,160,89,0.5)]' : 'border-transparent hover:border-white/30 grayscale hover:grayscale-0'}`}
              >
                <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center mt-4">
             <div className="w-32 h-32 rounded-full border-4 border-divine-gold p-1 shadow-2xl bg-gradient-to-br from-white/10 to-transparent">
               <img src={selectedAvatar} alt="Selected" className="w-full h-full rounded-full object-cover animate-float" />
             </div>
          </div>
          <p className="text-center text-sm text-divine-gold font-serif">
            {name || "Deidad Desconocida"}
          </p>
        </div>
      </div>
    </div>
  );
};