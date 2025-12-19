import React, { useState, useEffect } from 'react';
import { AVATAR_PRESETS, BACKGROUND_IMAGE, GAME_VERSION, DEDICATION_IMAGE_URL } from '../constants';
import { Play, User, Cpu, RefreshCcw, Heart, X, Info, Code2, Cloud, Palette, Smartphone, Zap, BookOpen, Shield, Skull, Database, Wallet, TrendingUp, Binary, Eye, ThumbsUp, Activity, Share2, Globe, MessageCircle, Send, Link } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, avatar: string) => void;
  hasSaveGame?: boolean;
  onContinue?: () => void;
}

// Resource URL provided
const BRAND_LOGO_URL = "https://leoesleoesleo.github.io/imagenes/biobots_genesys.png";

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, hasSaveGame, onContinue }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [showCredits, setShowCredits] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  // Social Stats State - Initialized to 0
  const [visitCount, setVisitCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    // --- VISIT COUNTER LOGIC ---
    const storedVisits = localStorage.getItem('biobots_visits');
    const newVisits = storedVisits ? parseInt(storedVisits) + 1 : 1;
    localStorage.setItem('biobots_visits', newVisits.toString());

    // Set real local visits count (starts from 1 on first visit)
    setVisitCount(newVisits);

    // --- LIKE LOGIC ---
    const likedState = localStorage.getItem('biobots_liked') === 'true';
    setHasLiked(likedState);
    
    // Initialize like count based on stored state (0 or 1)
    if (likedState) {
        setLikeCount(1);
    } else {
        setLikeCount(0);
    }
  }, []);

  const handleLike = () => {
    const newState = !hasLiked;
    setHasLiked(newState);
    setLikeCount(prev => newState ? prev + 1 : prev - 1);
    localStorage.setItem('biobots_liked', newState.toString());
  };

  const handleShareGame = async () => {
      const shareData = {
          title: 'BioBots: Génesis Evolutiva',
          text: '¡Únete a la simulación! Gestiona BioBots, mina Criptomonedas y evoluciona en este universo digital. 🤖⚡',
          url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              setShareModalOpen(true);
          }
      } else {
          setShareModalOpen(true);
      }
  };

  const handleManualShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
      const url = window.location.href;
      const text = '¡Únete a la simulación! Gestiona BioBots, mina Criptomonedas y evoluciona en este universo digital. 🤖⚡';
      
      let shareUrl = '';

      switch (platform) {
          case 'whatsapp':
              shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
              break;
          case 'facebook':
              shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
              break;
          case 'twitter':
              shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
              break;
          case 'copy':
              navigator.clipboard.writeText(`${text}\n${url}`);
              alert("¡Enlace copiado al portapapeles!");
              break;
      }

      if (platform !== 'copy') {
          window.open(shareUrl, '_blank');
      }
      setShareModalOpen(false);
  };

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

      {/* TOP RIGHT ACTIONS (Dedication, About, History) */}
      <div className="absolute top-6 right-6 z-50 flex flex-wrap justify-end gap-3 pointer-events-auto">
          <button 
            onClick={() => setShowLore(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-900/20 transition-all group"
          >
              <BookOpen size={16} className="text-yellow-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-yellow-200 hidden md:inline">HISTORIA</span>
          </button>

          <button 
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 hover:border-tech-cyan/50 hover:bg-tech-cyan/10 transition-all group"
          >
              <Info size={16} className="text-tech-cyan group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-tech-cyan hidden md:inline">ACERCA DE</span>
          </button>

          <button 
            onClick={() => setShowCredits(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 hover:border-pink-500/50 hover:bg-pink-900/20 transition-all group"
          >
              <Heart size={16} className="text-pink-500 group-hover:animate-pulse" />
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-pink-200 hidden md:inline">DEDICATORIA</span>
          </button>
      </div>

      {/* MAIN CONTAINER: Split Screen Layout */}
      <div className="relative z-10 w-full max-w-7xl p-4 md:p-8 flex flex-col md:flex-row-reverse items-center justify-center h-full overflow-y-auto overflow-x-hidden scrollbar-hide gap-4 md:gap-16 pt-24 md:pt-8">
        
        {/* --- RIGHT PANEL (Visual / Hero Image) --- */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center shrink-0 animate-fade-in-down mb-4 md:mb-0">
            {/* Main Brand Image Container */}
            <div className="relative group perspective-1000 flex justify-center w-full">
                {/* Back Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[120%] h-[90%] md:h-[120%] bg-tech-cyan/20 blur-[40px] md:blur-[60px] rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-700 animate-pulse-slow" />
                
                {/* The Logo Image - Optimized responsiveness */}
                <img 
                    src={BRAND_LOGO_URL} 
                    alt="BioBots: Génesis Evolutiva" 
                    className="relative z-10 w-[85%] sm:w-[70%] md:w-full max-w-[320px] sm:max-w-[450px] md:max-w-[600px] lg:max-w-[700px] h-auto max-h-[25vh] md:max-h-none object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] transform transition-transform duration-700 group-hover:scale-105 animate-float"
                />

                {/* Cyberpunk Decor Lines (Desktop Only) */}
                <div className="absolute -left-12 top-1/2 w-20 h-[1px] bg-gradient-to-r from-transparent to-tech-cyan/50 hidden md:block" />
                <div className="absolute -right-12 top-1/2 w-20 h-[1px] bg-gradient-to-l from-transparent to-tech-cyan/50 hidden md:block" />
            </div>
        </div>

        {/* --- LEFT PANEL (Form & Controls) --- */}
        <div className="w-full md:w-1/2 flex flex-col gap-6 max-w-xl animate-fade-in-up pb-12 md:pb-0">
            
            {/* Glass Panel: Consolidated Form & Avatar Selection */}
            <div className="backdrop-blur-xl bg-slate-900/70 rounded-3xl border border-tech-cyan/20 shadow-[0_0_50px_rgba(6,182,212,0.1)] p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
                {/* Decorative corner glow */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-tech-cyan/5 blur-xl rounded-br-full" />
                
                {/* Version & Status Header */}
                <div className="flex items-center gap-3 opacity-90 pb-4 border-b border-white/10">
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-neon-green" />
                    <h2 className="text-[10px] md:text-xs font-mono text-neon-green tracking-[0.2em] uppercase flex items-center gap-2">
                       <Cpu size={12} className="animate-spin-slow"/> v.{GAME_VERSION} • SIMULACIÓN ACTIVA
                    </h2>
                </div>

                {/* Description */}
                <p className="text-gray-300 font-mono text-[10px] md:text-sm leading-relaxed border-l-2 border-tech-cyan/50 pl-4">
                    Tu misión es construir, optimizar y expandir un ecosistema de BioBots capaces de evolucionar, minar recursos y adaptarse.
                </p>

                {/* CONTINUE BUTTON */}
                {hasSaveGame && onContinue && (
                    <button 
                    onClick={onContinue}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-3 font-tech font-bold tracking-widest transition-all duration-300 relative overflow-hidden group bg-neon-green/20 text-neon-green border border-neon-green hover:bg-neon-green hover:text-black hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-pulse"
                    >
                        <RefreshCcw size={18} fill="currentColor" />
                        RESTAURAR SIMULACIÓN
                    </button>
                )}

                {/* NAME INPUT */}
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-cyan group-focus-within:text-neon-green transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Identificador de Arquitecto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-tech-cyan/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-tech-cyan focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono text-sm md:text-base"
                    />
                </div>

                {/* AVATAR SELECTION COMPACT */}
                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-tech text-[10px] md:text-sm text-tech-purple flex items-center gap-2">
                            <Cpu size={14}/> Selección de Avatar
                        </h3>
                        <div className="text-[10px] text-neon-green font-mono tracking-wider">{name ? name.toUpperCase() : "NO_DATA"}</div>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                         {/* Large Preview & Share Action */}
                         <div className="relative shrink-0 flex flex-col items-center gap-2">
                             <div className="relative w-12 h-12 md:w-20 md:h-20">
                                 <div className="absolute inset-0 bg-tech-cyan/20 rounded-full animate-pulse" />
                                 <img src={selectedAvatar} alt="Selected" className="w-full h-full rounded-full object-cover border-2 border-tech-cyan shadow-[0_0_15px_rgba(6,182,212,0.5)] bg-black/50" />
                             </div>
                             <button 
                                onClick={handleShareGame}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-tech-cyan/10 border border-tech-cyan/30 hover:bg-tech-cyan/20 transition-all group"
                                title="Compartir Perfil"
                             >
                                <Share2 size={12} className="text-tech-cyan group-hover:scale-110" />
                                <span className="text-[8px] font-mono font-bold text-tech-cyan">INVITAR</span>
                             </button>
                         </div>
                         
                         {/* Grid */}
                         <div className="flex-1 grid grid-cols-5 gap-1 md:gap-2">
                            {AVATAR_PRESETS.map((avatar, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedAvatar(avatar)}
                                    className={`relative rounded-lg overflow-hidden aspect-square border transition-all duration-200 ${selectedAvatar === avatar ? 'border-tech-cyan scale-110 shadow-lg' : 'border-transparent hover:border-white/20 grayscale hover:grayscale-0 bg-black/30'}`}
                                >
                                    <img src={avatar} alt={`A${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                         </div>
                    </div>
                </div>
                
                {/* START BUTTON */}
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

            {/* SOCIAL STATS (Outside Panel) */}
            <div className="grid grid-cols-2 gap-4">
                 {/* Visit Counter */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-slate-800/60 transition-colors group cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Eye size={18} />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[9px] text-gray-500 font-mono font-bold uppercase tracking-wider">Accesos</p>
                            <p className="text-sm md:text-lg font-tech font-bold text-white group-hover:text-blue-200 transition-colors">
                                {visitCount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <Activity size={16} className="text-blue-500/20 group-hover:text-blue-400 transition-colors" />
                </div>

                {/* Like Counter */}
                <button 
                    onClick={handleLike}
                    className={`bg-slate-900/40 backdrop-blur-md border rounded-xl p-3 flex items-center justify-between transition-all group ${hasLiked ? 'border-neon-green/50 bg-neon-green/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-white/10 hover:bg-slate-800/60'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 ${hasLiked ? 'bg-neon-green/20 text-neon-green' : 'bg-pink-500/10 text-pink-500'}`}>
                            <ThumbsUp size={18} className={hasLiked ? 'fill-current' : ''} />
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] md:text-[9px] text-gray-500 font-mono font-bold uppercase tracking-wider">Aprobación</p>
                            <p className={`text-sm md:text-lg font-tech font-bold transition-colors ${hasLiked ? 'text-neon-green' : 'text-white'}`}>
                                {likeCount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </button>
            </div>

        </div>

      </div>

      {/* --- SHARE MODAL (Fallback) --- */}
      {isShareModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto p-4 animate-fade-in">
              <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(6,182,212,0.3)] border border-tech-cyan/50 relative animate-pop-in">
                  <button onClick={() => setShareModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                      <X size={20} />
                  </button>
                  
                  <div className="flex flex-col items-center mb-6">
                      <Share2 size={32} className="text-tech-cyan mb-2 animate-pulse" />
                      <h3 className="font-tech text-xl font-bold text-white tracking-widest uppercase">COMPARTIR SISTEMA</h3>
                      <p className="text-xs text-gray-400 text-center mt-1">Invita a otros Arquitectos a unirse a la simulación evolutiva.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                      <button 
                        onClick={() => handleManualShare('whatsapp')}
                        className="flex flex-col items-center gap-2 p-4 bg-green-900/20 border border-green-700 rounded-lg hover:bg-green-800/30 transition-all hover:scale-105"
                      >
                          <MessageCircle size={24} className="text-green-400" />
                          <span className="text-sm font-bold text-green-100">WhatsApp</span>
                      </button>

                      <button 
                        onClick={() => handleManualShare('facebook')}
                        className="flex flex-col items-center gap-2 p-4 bg-blue-900/20 border border-blue-700 rounded-lg hover:bg-blue-800/30 transition-all hover:scale-105"
                      >
                          <Globe size={24} className="text-blue-400" />
                          <span className="text-sm font-bold text-blue-100">Facebook</span>
                      </button>

                      <button 
                        onClick={() => handleManualShare('twitter')}
                        className="flex flex-col items-center gap-2 p-4 bg-sky-900/20 border border-sky-700 rounded-lg hover:bg-sky-800/30 transition-all hover:scale-105"
                      >
                          <Send size={24} className="text-sky-400" />
                          <span className="text-sm font-bold text-sky-100">Twitter / X</span>
                      </button>

                      <button 
                        onClick={() => handleManualShare('copy')}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all hover:scale-105"
                      >
                          <Link size={24} className="text-gray-300" />
                          <span className="text-sm font-bold text-gray-200">Copiar Link</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

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
                  <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden overflow-y-auto">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-tech-cyan/20 rounded-tl-3xl" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-tech-purple/20 rounded-br-3xl" />
                      
                      <div className="relative z-10 space-y-6">
                          <div className="flex items-center gap-3 text-tech-cyan mb-2">
                              <Heart className="fill-current animate-pulse" size={24} />
                              <span className="font-mono tracking-widest uppercase font-bold">Dedicatoria</span>
                          </div>

                          <h2 className="text-3xl md:text-5xl font-tech font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight">
                              Para Santiago
                          </h2>

                          <div className="w-16 h-1 bg-gradient-to-r from-tech-cyan to-tech-purple" />

                          <p className="font-sans text-base md:text-xl text-gray-300 leading-relaxed font-light italic opacity-90">
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

      {/* --- WORLD LORE (HISTORY) MODAL --- */}
      {showLore && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0f172a] border border-yellow-500/20 w-full max-w-4xl rounded-2xl shadow-[0_0_60px_rgba(234,179,8,0.15)] flex flex-col max-h-[90vh] overflow-hidden animate-pop-in relative">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                              <BookOpen size={24} />
                          </div>
                          <div>
                              <h2 className="font-tech text-xl md:text-3xl font-bold text-white tracking-wide">Historia</h2>
                              <p className="text-[10px] text-yellow-500 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"/>
                                  Archivos
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setShowLore(false)} className="text-gray-500 hover:text-white p-2 bg-black/30 rounded-full transition-colors border border-transparent hover:border-white/20">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 font-sans text-gray-300 leading-loose scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-transparent">
                      
                      {/* Segment 1: Genesis */}
                      <div className="flex gap-6 items-start group">
                          <div className="hidden md:flex flex-col items-center gap-2 mt-1">
                              <div className="p-2 rounded-lg bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/30 group-hover:scale-110 transition-transform">
                                  <Zap size={20} />
                              </div>
                              <div className="h-full w-px bg-gradient-to-b from-tech-cyan/30 to-transparent" />
                          </div>
                          <p className="text-sm md:text-lg">
                              En un mundo físico donde la tecnología parece tener alma, el <strong className="text-white">Arquitecto</strong> despierta sobre un gran lienzo vivo que responde a su imaginación. Allí descubre su propósito: crear <strong className="text-tech-cyan">biobots</strong>, seres metálicos con luces que laten como si tuvieran emociones 🤖✨.
                          </p>
                      </div>

                      {/* Segment 2: Energy */}
                      <div className="flex gap-6 items-start group">
                          <div className="hidden md:flex flex-col items-center gap-2 mt-1">
                              <div className="p-2 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/30 group-hover:scale-110 transition-transform">
                                  <Database size={20} />
                              </div>
                              <div className="h-full w-px bg-gradient-to-b from-neon-green/30 to-transparent" />
                          </div>
                          <p className="text-sm md:text-lg">
                              Para dar vida a este pequeño ecosistema, el Arquitecto construye <strong className="text-neon-green">granjas de servidores</strong> que generan energía 🌱. A medida que estas se cargan, cambian de amarillo a rosa y finalmente a verde, señalando su potencia máxima. Los biobots dependen de ellas para vivir y <strong className="text-white">minar criptomonedas</strong>.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ABOUT / ARCHITECTURE MODAL --- */}
      {showAbout && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0f172a] border border-tech-cyan/30 w-full max-w-4xl rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.2)] flex flex-col max-h-[90vh] overflow-hidden animate-pop-in relative">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-tech-cyan/10 border border-tech-cyan/50 flex items-center justify-center text-tech-cyan">
                              <Code2 size={24} />
                          </div>
                          <div>
                              <h2 className="font-tech text-xl md:text-2xl font-bold text-white tracking-wide">Arquitectura</h2>
                              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Stack Tecnológico</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAbout(false)} className="text-gray-500 hover:text-white p-2 bg-black/30 rounded-full">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 font-sans">
                      <div className="bg-gradient-to-r from-slate-800/50 to-transparent p-4 rounded-xl border-l-4 border-tech-cyan">
                          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                              <strong className="text-white">BioBots</strong> está desarrollado como una <strong className="text-tech-cyan">Progressive Web App (PWA)</strong> utilizando React + TypeScript + Vite.
                          </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Core */}
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 hover:border-tech-cyan/30 transition-colors group">
                              <div className="flex items-center gap-2 text-tech-cyan font-bold font-mono text-sm uppercase mb-2">
                                  <Zap size={16} /> Core
                              </div>
                              <ul className="space-y-2 text-xs md:text-sm text-gray-400">
                                  <li className="flex items-start gap-2">React 18</li>
                                  <li className="flex items-start gap-2">TypeScript</li>
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};