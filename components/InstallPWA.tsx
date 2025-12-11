import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, RefreshCcw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // Show button by default if not installed
    if (!isStandalone) {
        setIsVisible(true);
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    // Listen for custom update event from index.html
    const handleUpdateFound = (e: CustomEvent<ServiceWorkerRegistration>) => {
        console.log("InstallPWA: Update detected via event");
        setUpdateAvailable(true);
        setRegistration(e.detail);
        setIsVisible(true); // Ensure button shows up even if installed
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    // @ts-ignore - Custom event logic
    window.addEventListener('sw-update-found', handleUpdateFound);

    // Initial check for waiting worker if event missed
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
            .then(reg => {
                if (reg && reg.waiting) {
                    setUpdateAvailable(true);
                    setRegistration(reg);
                    setIsVisible(true);
                }
            })
            .catch(err => {
                // Handle origin mismatch errors in preview environments
                console.warn("Service Worker access failed (likely environment restriction):", err);
            });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      // @ts-ignore
      window.removeEventListener('sw-update-found', handleUpdateFound);
    };
  }, []);

  const handleClick = async () => {
    // Priority 1: Update Available
    if (updateAvailable && registration && registration.waiting) {
        // Send message to SW to skip waiting and reload
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // The controllerchange event in index.html will handle the reload
        return;
    }

    // Priority 2: Install
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
          onClick={handleClick}
          className={`flex items-center gap-2 backdrop-blur-md border px-4 py-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 font-mono text-xs font-bold tracking-widest group
            ${updateAvailable 
                ? 'bg-neon-green/90 border-neon-green/50 text-black hover:bg-neon-green hover:scale-105' 
                : 'bg-slate-900/90 border-tech-cyan/50 text-tech-cyan hover:bg-tech-cyan hover:text-black'
            }`}
        >
          {updateAvailable ? (
              <>
                <RefreshCcw size={14} className="group-hover:animate-spin" />
                <span>ACTUALIZAR VERSIÓN</span>
              </>
          ) : (
              <>
                <Download size={14} className="group-hover:animate-bounce" />
                <span>DESCARGAR JUEGO</span>
              </>
          )}
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