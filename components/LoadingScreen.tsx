
import React, { useEffect, useState, useRef } from 'react';
import { MUSIC_TRACKS_BY_LEVEL, LOADING_SOUND_URL } from '../constants';
import { Cpu, Shield, Zap, Database, Globe, Binary, Terminal } from 'lucide-react';

interface LoadingScreenProps {
    onComplete: () => void;
}

const LORE_SNIPPETS = [
    "El Arquitecto despierta sobre un gran lienzo vivo que responde a su imaginación.",
    "Los BioBots dependen de las granjas de servidores para minar criptomonedas.",
    "Si un BioBot pasa diez minutos inactivo, su luz se apaga y entra en congelamiento.",
    "Colocar granjas lejos aumenta la rentabilidad, pero consume más vitalidad.",
    "La Billetera de Activos atrae misteriosas sombras conocidas como piratas.",
    "Los cubos de protección crean barreras entre la armonía del mundo y las amenazas.",
    "Cada nivel desbloqueado revela nuevos desafíos en el universo digital.",
    "Revivir a un BioBot es un acto casi afectivo entre creador y criatura.",
    "Optimizando nanotubos de energía...",
    "Sincronizando con la red neuronal del ecosistema..."
];

// Matrix / Cyberpunk / Binary Code Themed Images
const LOADING_IMAGES = [
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop", // Matrix Code Green
    "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=2071&auto=format&fit=crop", // Cyberpunk Developer
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", // Cyber Security / Blue Tech
    "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=2070&auto=format&fit=crop", // Data Particles
    "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop", // Monitor Code
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"  // Hardware / Chip
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [currentTip, setCurrentTip] = useState(LORE_SNIPPETS[0]);
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const totalAssets = useRef(LOADING_IMAGES.length + Object.keys(MUSIC_TRACKS_BY_LEVEL).length + 1);
    const loadedCount = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- AUDIO HANDLING ---
    useEffect(() => {
        // Create audio instance
        const audio = new Audio(LOADING_SOUND_URL);
        audio.loop = true;
        audio.volume = 0.6; // Start volume
        audioRef.current = audio;

        // Attempt playback
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Loading screen audio blocked by browser autoplay policy. User interaction needed.");
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // --- AUDIO FADE OUT LOGIC ---
    useEffect(() => {
        if (isFadingOut && audioRef.current) {
            const audio = audioRef.current;
            const fadeInterval = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume -= 0.05;
                } else {
                    audio.volume = 0;
                    audio.pause();
                    clearInterval(fadeInterval);
                }
            }, 100); // Reduce volume every 100ms

            return () => clearInterval(fadeInterval);
        }
    }, [isFadingOut]);

    // --- LORE & VISUAL ROTATION ---
    useEffect(() => {
        const tipInterval = setInterval(() => {
            setCurrentTip(prev => {
                const idx = LORE_SNIPPETS.indexOf(prev);
                return LORE_SNIPPETS[(idx + 1) % LORE_SNIPPETS.length];
            });
        }, 2500); // Slower text rotation for readability

        const bgInterval = setInterval(() => {
            setCurrentBgIndex(prev => (prev + 1) % LOADING_IMAGES.length);
        }, 2000); // Slower image rotation

        return () => {
            clearInterval(tipInterval);
            clearInterval(bgInterval);
        };
    }, []);

    // --- ASSET PRELOADING LOGIC ---
    useEffect(() => {
        const startTime = Date.now();
        const MIN_LOAD_TIME = 6000; // 6 seconds minimum
        const MAX_LOAD_TIME = 10000; // 10 seconds maximum

        const updateProgress = () => {
            loadedCount.current += 1;
            const calculatedProgress = Math.min(90, Math.floor((loadedCount.current / totalAssets.current) * 100));
            setProgress(prev => Math.max(prev, calculatedProgress));
        };

        // 1. Preload Images
        const imagePromises = LOADING_IMAGES.map(src => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => { updateProgress(); resolve(); };
                img.onerror = () => { updateProgress(); resolve(); }; // Continue even if error
            });
        });

        // 2. Warm-up Audio (Head request only to check connection/cache)
        const audioPromises = Object.values(MUSIC_TRACKS_BY_LEVEL).map(src => {
            return fetch(src, { method: 'HEAD', mode: 'no-cors' })
                .then(() => updateProgress())
                .catch(() => updateProgress());
        });

        Promise.all([...imagePromises, ...audioPromises]).then(() => {
            // Assets loaded, but check time constraints
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, MIN_LOAD_TIME - elapsed);

            // Smoothly fill bar to 100% over remaining time
            setTimeout(() => {
                setProgress(100);
                setTimeout(() => {
                    setIsFadingOut(true);
                    setTimeout(onComplete, 1500); // Wait for fade out animation (extended for audio fade)
                }, 1500);
            }, remainingTime);
        });

        // Failsafe Timeout
        const timeout = setTimeout(() => {
            setProgress(100);
            setIsFadingOut(true);
            setTimeout(onComplete, 1500);
        }, MAX_LOAD_TIME);

        return () => clearTimeout(timeout);

    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Background Layer with Blur/Overlay */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out opacity-20 saturate-0"
                    style={{ backgroundImage: `url(${LOADING_IMAGES[currentBgIndex]})` }}
                />
                
                {/* Matrix Rain Effect Overlay (Static CSS Pattern simulation) */}
                <div 
                    className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
                    style={{
                        backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)`,
                        backgroundSize: '30px 30px'
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-[#020617]/40" />
            </div>

            <div className="relative z-10 w-full max-w-3xl px-8 flex flex-col items-center">
                
                {/* Logo / Title Area */}
                <div className="mb-16 text-center animate-pulse relative">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <Cpu size={64} className="text-tech-cyan animate-spin-slow" />
                            <Binary size={32} className="text-neon-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-tech font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-tech-cyan to-neon-green tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        BIOBOTS
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-4 text-tech-cyan font-mono text-xs md:text-sm uppercase tracking-[0.4em]">
                        <Globe size={14} className="animate-spin" /> 
                        <span>Estableciendo Enlace Neural</span>
                        <span className="animate-pulse">_</span>
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.1)] mb-6 relative">
                    {/* Animated Bar */}
                    <div 
                        className="h-full bg-gradient-to-r from-tech-cyan via-white to-neon-green transition-all duration-300 ease-linear relative shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent opacity-50" />
                    </div>
                </div>

                {/* Percentage & Status Terminal */}
                <div className="w-full flex justify-between text-xs font-mono text-neon-green/80 mb-12 border-t border-slate-800 pt-2">
                    <span className="flex items-center gap-2"><Terminal size={12}/> CARGANDO ASSETS...</span>
                    <span>{progress}% COMPLETADO</span>
                </div>

                {/* Dynamic Lore Snippet */}
                <div className="h-24 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 p-6 w-full max-w-xl">
                    <p className="text-gray-300 text-center font-tech text-sm md:text-lg tracking-wide leading-relaxed animate-fade-in-up key={currentTip}">
                        "{currentTip}"
                    </p>
                </div>

                {/* Icons Deco */}
                <div className="flex gap-6 mt-12 opacity-20">
                    <Database size={24} className="text-gray-500 animate-bounce" style={{ animationDelay: '0s' }} />
                    <Shield size={24} className="text-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <Zap size={24} className="text-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>

            </div>
        </div>
    );
};
