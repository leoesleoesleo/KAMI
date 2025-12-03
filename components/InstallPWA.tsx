import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // Show button by default if not installed (we will hide it only if we confirm it's installed)
    if (!isStandalone) {
        setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Auto install supported (Chrome/Android/Edge)
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Manual fallback (iOS/Safari/Firefox)
      setShowInstructions(true);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-tech-cyan/50 text-tech-cyan px-4 py-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-tech-cyan hover:text-black transition-all duration-300 font-mono text-xs font-bold tracking-widest group"
        >
          <Download size={14} className="group-hover:animate-bounce" />
          <span>INSTALAR APP</span>
        </button>
      </div>

      {/* Manual Instructions Modal */}
      {showInstructions && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-tech-cyan/30 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl">
                  <button 
                     onClick={() => setShowInstructions(false)}
                     className="absolute top-3 right-3 text-gray-400 hover:text-white"
                  >
                      <X size={20} />
                  </button>
                  
                  <h3 className="font-tech text-xl text-white mb-4 text-center">Instalación Manual</h3>
                  
                  {isIOS ? (
                      <div className="space-y-4 text-gray-300 text-sm font-mono">
                          <p>Para instalar en iOS/iPadOS:</p>
                          <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/10">
                              <Share size={20} className="text-blue-400" />
                              <span>1. Presiona el botón <strong>Compartir</strong> en la barra del navegador.</span>
                          </div>
                          <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/10">
                              <PlusSquare size={20} className="text-gray-200" />
                              <span>2. Selecciona la opción <strong>"Agregar a Inicio"</strong>.</span>
                          </div>
                      </div>
                  ) : (
                      <div className="text-gray-300 text-sm text-center font-mono">
                          <p className="mb-4">Tu navegador no soporta la instalación automática desde este botón.</p>
                          <p>Busca la opción <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong> en el menú de opciones de tu navegador.</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </>
  );
};