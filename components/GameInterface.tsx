
import React, { useState, useRef, useEffect } from 'react';
import { PlayerState, GameEntity, Gender, INITIAL_POINTS, ACTION_COST, EntityType, BlockType } from '../types';
import { Bot, Database, Zap, Pickaxe, X, MessageCircle, Send, User, Trophy, Activity, Clock, MapPin, ShoppingBag, CheckCircle, BarChart3, Battery, Skull, Fingerprint, Crosshair, Cpu, AlertTriangle, HardDrive, LogOut, RotateCcw, HeartPulse, ArrowRightLeft, Wallet, Hammer, Shield, Lock, Box, ChevronUp, Ghost, Pause, Play, Settings, Save, Swords } from 'lucide-react';
import { createPersonJSON, getRandomGender } from '../services/gameService';
import { GAME_CONFIG } from '../gameConfig';
import { LiveConsole } from './LiveConsole';
import { Minimap } from './Minimap';
import { StorageService } from '../services/storageService';

interface GameInterfaceProps {
  player: PlayerState;
  entities: GameEntity[]; 
  onAction: (actionType: string, payload?: any) => void;
  selectedEntity: GameEntity | null;
  onCloseSelection: () => void;
  wastedManaTrigger: number;
  targetLostTrigger?: number; 
  isPlacingLand?: boolean;
  isPlacingPerson?: boolean;
  isTargetingRecharge?: boolean; 
  onBuyMana: (amount: number) => void;
  globalStats: {
      globalScore: number;
      averageEnergy: number;
  };
  pendingCrypto?: number; // New Prop for floating pending amount
  onExit: () => void;
  onRestart: () => void;
  blocksToPlace?: number; 
  level: number; 
  showLevelBanner: string | null; 
  ghostDetectedTrigger: number;
  isPaused: boolean; 
  togglePause: () => void;
  onNodeRecharge: (nodeId: string) => void; 
  closeModalsTrigger?: number; // New trigger prop
}

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ 
    player, 
    entities, 
    onAction, 
    selectedEntity, 
    onCloseSelection, 
    wastedManaTrigger,
    targetLostTrigger,
    isPlacingLand,
    isPlacingPerson,
    isTargetingRecharge,
    onBuyMana,
    globalStats,
    pendingCrypto = 0,
    onExit,
    onRestart,
    blocksToPlace,
    level,
    showLevelBanner,
    ghostDetectedTrigger,
    isPaused,
    togglePause,
    onNodeRecharge,
    closeModalsTrigger
}) => {
  const [isCreationModalOpen, setModalOpen] = useState(false);
  const [creationGender, setCreationGender] = useState<Gender>(Gender.MALE);
  const [creationName, setCreationName] = useState('');
  
  // Toast States
  const [showManaToast, setShowManaToast] = useState(false);
  const [showWastedToast, setShowWastedToast] = useState(false);
  const [showSuccessMana, setShowSuccessMana] = useState(false);
  const [showKillToast, setShowKillToast] = useState(false);
  const [showNoBotsToast, setShowNoBotsToast] = useState(false); 
  const [showReviveToast, setShowReviveToast] = useState(false);
  const [showExchangeToast, setShowExchangeToast] = useState(false);
  const [showTargetLostToast, setShowTargetLostToast] = useState(false);
  const [showGhostToast, setShowGhostToast] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showBuildModeToast, setShowBuildModeToast] = useState(false);
  const [showCryptoErrorToast, setShowCryptoErrorToast] = useState(false);
  const [showCombatToast, setShowCombatToast] = useState(false);
  const [showLowBatteryToast, setShowLowBatteryToast] = useState(false); // New Toast State

  // Tools/Build Modal
  const [isToolsModalOpen, setToolsModalOpen] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);
  const [blockQuantity, setBlockQuantity] = useState(4); 

  // Player Profile Modal
  const [isPlayerProfileOpen, setPlayerProfileOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  // Chat State
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Menu State
  const [activeMenu, setActiveMenu] = useState<'actions' | 'system' | null>(null);

  // Work Timer State for Selected Entity
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Reset chat when selection changes
  useEffect(() => {
    if (!selectedEntity) {
        setChatOpen(false);
        setChatMessages([]);
    }
  }, [selectedEntity]);

  // Handle global modal closing trigger
  useEffect(() => {
      if (closeModalsTrigger !== undefined && closeModalsTrigger > 0) {
          setModalOpen(false);
          setToolsModalOpen(false);
          setPlayerProfileOpen(false);
          setChatOpen(false);
          setActiveMenu(null);
      }
  }, [closeModalsTrigger]);

  // When opening Creation Modal, set default gender based on 70/30 probability
  useEffect(() => {
      if (isCreationModalOpen) {
          setCreationGender(getRandomGender());
      }
  }, [isCreationModalOpen]);

  useEffect(() => {
    if (wastedManaTrigger > 0) {
        setShowWastedToast(true);
        setTimeout(() => setShowWastedToast(false), 3000);
    }
  }, [wastedManaTrigger]);

  // Handle Target Lost Trigger
  useEffect(() => {
      if (targetLostTrigger && targetLostTrigger > 0) {
          setShowTargetLostToast(true);
          setTimeout(() => setShowTargetLostToast(false), 3000);
      }
  }, [targetLostTrigger]);

  // Handle Ghost Detection Trigger
  useEffect(() => {
      if (ghostDetectedTrigger > 0) {
          setShowGhostToast(true);
          setTimeout(() => setShowGhostToast(false), 4000);
      }
  }, [ghostDetectedTrigger]);

  useEffect(() => {
      if (selectedEntity?.attributes?.workEndTime) {
          const updateTimer = () => {
            const end = selectedEntity.attributes!.workEndTime!;
            const diff = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) {
                setTimeLeft(null);
            }
          };
          updateTimer(); 
          const interval = setInterval(updateTimer, 1000);
          return () => clearInterval(interval);
      } else {
          setTimeLeft(null);
      }
  }, [selectedEntity]);

  const checkManaAndExecute = (action: () => void) => {
    if (player.points < ACTION_COST) {
        setShowManaToast(true);
        setTimeout(() => setShowManaToast(false), 3000);
    } else {
        action();
    }
  };

  // --- HANDLER FIX FOR PROFILE CLICK ---
  const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent bubbling to background
      setPlayerProfileOpen(true);
      setActiveMenu(null); // Ensure side menus are closed
  };

  const handleCreatePerson = () => {
    checkManaAndExecute(() => {
        const attributes = createPersonJSON(creationGender, creationName || undefined);
        onAction('CREATE_PERSON', attributes);
        setModalOpen(false);
        setCreationName('');
        setActiveMenu(null);
    });
  };

  const handleWorkProtocol = (entityId?: string) => {
      // If we are targeting a specific bot, verify it exists and is alive
      if (entityId) {
          const targetBot = entities.find(e => e.id === entityId);
          if (!targetBot || targetBot.attributes?.estado === 'muerto') {
              setShowNoBotsToast(true);
              setTimeout(() => setShowNoBotsToast(false), 3000);
              return;
          }
      }

      checkManaAndExecute(() => {
          onAction('CREATE_WORK', entityId);
          // If action was triggered from selection, close modal
          if (entityId && selectedEntity?.id === entityId) {
              onCloseSelection();
          }
      });
  };

  const handleAttackProtocol = (entityId: string) => {
      // [FIX] Validar energía del jugador (Arquitecto)
      if (player.points <= 0) {
          setShowManaToast(true);
          setTimeout(() => setShowManaToast(false), 3000);
          return;
      }

      if (entityId) {
          const targetBot = entities.find(e => e.id === entityId);
          
          if (targetBot && targetBot.attributes) {
              // --- CRITICAL ENERGY CHECK ---
              // If energy is 0 or less, prevent attack immediately and show yellow alert
              if (targetBot.attributes.energia <= 0) {
                  setShowLowBatteryToast(true);
                  setTimeout(() => setShowLowBatteryToast(false), 4000);
                  return; // BLOCK ACTION
              }
              
              if (targetBot.attributes.estado === 'muerto') {
                  return;
              }
          }
      }

      // Check if there are intruders
      const intruders = entities.filter(e => e.type === EntityType.INTRUDER);
      if (intruders.length === 0) {
          setShowTargetLostToast(true);
          setTimeout(() => setShowTargetLostToast(false), 3000);
          return;
      }

      onAction('ATTACK_INTRUDER', entityId);
      setShowCombatToast(true);
      setTimeout(() => setShowCombatToast(false), 3000);
      onCloseSelection();
  };

  const activeBiobotsCount = entities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto').length;
  // FIX: Apply Math.floor to ensure whole numbers when displayed, removing floating point jitter from theft
  const availableCrypto = Math.floor(Math.max(0, globalStats.globalScore - (player.stats.cryptoSpent || 0)));

  const handleBuyBlocks = (e: React.MouseEvent) => {
      // Robust event handling
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      e.stopPropagation();

      if (!selectedBlockType) return;
      
      const price = selectedBlockType === BlockType.FIREWALL 
          ? GAME_CONFIG.STRUCTURES.PRICES.FIREWALL 
          : GAME_CONFIG.STRUCTURES.PRICES.ENCRYPTION;
      
      const totalCost = price * blockQuantity;
      
      if (totalCost > availableCrypto) {
          setShowCryptoErrorToast(true);
          setTimeout(() => setShowCryptoErrorToast(false), 3000);
          setToolsModalOpen(false); // Close popup as requested
          return;
      }

      onAction('BUY_STRUCTURE', { type: selectedBlockType, quantity: blockQuantity, totalCost });
      setToolsModalOpen(false);
      setActiveMenu(null);
      
      // Feedback
      setShowBuildModeToast(true);
      setTimeout(() => setShowBuildModeToast(false), 3000);
  };

  const handleRedeemCode = () => {
      if (redeemCode === '1866') {
          onBuyMana(100);
          setRedeemCode('');
          setPlayerProfileOpen(false); 
          setShowSuccessMana(true);
          setTimeout(() => setShowSuccessMana(false), 3000);
      } else {
          alert("Código de acceso denegado");
      }
  };

  const handleExchangeCrypto = (amount: number) => {
      // Execute Exchange
      onAction('EXCHANGE_CRYPTO', { amount });
      
      // Feedback
      setShowExchangeToast(true);
      setTimeout(() => setShowExchangeToast(false), 3000);
  };

  const openChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (selectedEntity?.attributes?.estado === 'muerto') return;
    
    setChatOpen(true);
    
    if (chatMessages.length === 0 && selectedEntity) {
        const greeting = selectedEntity.attributes?.sexo === Gender.MALE 
            ? "Núcleo en línea. Esperando protocolo, Arquitecto."
            : "Enlace establecido. ¿Cuál es su consulta?";
        setChatMessages([{ sender: 'bot', text: greeting }]);
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: currentMessage }];
    setChatMessages(newMessages);
    const userText = currentMessage;
    setCurrentMessage('');

    setTimeout(() => {
        let reply = "Procesando datos...";
        if (selectedEntity) {
            const personality = selectedEntity.attributes?.personalidad || 'Neutral';
            if (userText.toLowerCase().includes('hola')) {
                reply = `Saludos. Estado operativo: ${selectedEntity.attributes?.estado}.`;
            } else if (userText.toLowerCase().includes('trabaja')) {
                reply = "Afirmativo. Iniciando subrutina de producción.";
            } else {
                if (personality === 'Lógico') reply = "Cálculo finalizado. Probabilidad de éxito: 99.9%.";
                else if (personality === 'Curioso') reply = "¿Es esa la voluntad del cosmos? Interesante...";
                else if (personality === 'Protector') reply = "Firewall activo. Perímetro seguro.";
                else reply = "Datos recibidos. Actualizando base de conocimientos.";
            }
        }
        setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleKill = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (selectedEntity && selectedEntity.attributes?.estado !== 'muerto') {
        onAction('KILL_ENTITY', selectedEntity.id);
        setShowKillToast(true);
        setTimeout(() => setShowKillToast(false), 3000);
        onCloseSelection(); 
    }
  };
  
  const handleRevive = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      const REVIVE_COST = 10;
      if (player.points < REVIVE_COST) {
          setShowManaToast(true);
          setTimeout(() => setShowManaToast(false), 3000);
          return;
      }
      
      if (selectedEntity && selectedEntity.attributes?.estado === 'muerto') {
          onAction('REVIVE_ENTITY', selectedEntity.id);
          setShowReviveToast(true);
          setTimeout(() => setShowReviveToast(false), 3000);
          onCloseSelection();
      }
  };

  const handleManualSave = () => {
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
      setActiveMenu(null);
  };

  const closeChat = (e: React.MouseEvent) => {
      e.stopPropagation();
      setChatOpen(false);
  };

  const calculateOption = (percentage: number) => {
      const rawAmount = availableCrypto * percentage;
      const roundedAmount = Math.floor(rawAmount / 10) * 10;
      return roundedAmount;
  };

  const optionHigh = calculateOption(0.6); 
  const optionMid = calculateOption(0.3);  
  const optionLow = calculateOption(0.1);  

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20 font-sans">
      
      {/* INVISIBLE BACKDROP FOR CLOSING MENUS */}
      {activeMenu && (
          <div 
            className="fixed inset-0 z-25 bg-transparent pointer-events-auto"
            onClick={() => setActiveMenu(null)}
          />
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && (
          <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
              <div className="bg-black/80 border-2 border-yellow-500/50 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl animate-pulse">
                  <Pause size={48} className="text-yellow-500" />
                  <h2 className="text-3xl font-tech font-bold text-white tracking-widest">SIMULACIÓN PAUSADA</h2>
                  <button 
                    onClick={togglePause}
                    className="mt-4 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg font-mono tracking-wider transition-all"
                  >
                      REANUDAR SISTEMA
                  </button>
              </div>
          </div>
      )}

      {/* LEVEL UP BANNER ANIMATION */}
      {showLevelBanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]" />
              <div className="relative text-center animate-[popIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                  <h1 className="text-6xl md:text-8xl font-black font-tech text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan via-white to-tech-purple drop-shadow-[0_0_50px_rgba(6,182,212,0.8)] tracking-tighter">
                      {showLevelBanner}
                  </h1>
                  <div className="h-1 w-full bg-neon-green mt-4 shadow-[0_0_20px_#10b981]" />
              </div>
          </div>
      )}

      {/* Placement Mode Toast - Land */}
      {isPlacingLand && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-neon-green/90 backdrop-blur text-black px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse flex items-center gap-3 z-[60] pointer-events-auto border border-neon-green w-max max-w-[90vw] whitespace-normal text-center">
            <Crosshair size={20} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">SELECCIONAR COORDENADAS</span>
        </div>
      )}

      {/* Placement Mode Toast - Person */}
      {isPlacingPerson && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-tech-cyan/90 backdrop-blur text-black px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse flex items-center gap-3 z-[60] pointer-events-auto border border-tech-cyan w-max max-w-[90vw] whitespace-normal text-center">
            <Fingerprint size={20} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">GÉNESIS: CONFIRMAR UBICACIÓN</span>
        </div>
      )}

       {/* Placement Mode Toast - Blocks */}
       {blocksToPlace !== undefined && blocksToPlace > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-600/90 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse flex items-center gap-3 z-[60] pointer-events-auto border border-gray-400 w-max max-w-[90vw] whitespace-normal text-center">
            <Box size={20} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">MODO CONSTRUCCIÓN: {blocksToPlace} RESTANTES</span>
        </div>
      )}

      {/* Build Mode Started Toast */}
      {showBuildModeToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-purple-600/90 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-bounce flex items-center gap-3 z-[160] pointer-events-auto border border-purple-400 w-max max-w-[90vw] whitespace-normal text-center">
            <Hammer size={20} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">PROTOCOLO DE DEFENSA ACTIVADO</span>
        </div>
      )}

      {/* Recharge Mode Toast */}
      {isTargetingRecharge && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse flex items-center gap-3 z-[60] pointer-events-auto border border-blue-400 w-max max-w-[90vw] whitespace-normal text-center">
            <Zap size={20} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">[ MODO RECARGA: SELECCIONAR NODO ]</span>
        </div>
      )}

      {/* Target Lost Toast */}
      {showTargetLostToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-bounce flex items-center gap-3 z-[60] pointer-events-auto border border-red-400 w-max max-w-[90vw] whitespace-normal text-center">
            <AlertTriangle size={20} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">OBJETIVO PERDIDO: OPERACIÓN CANCELADA</span>
        </div>
      )}

      {/* Ghost Detected Toast */}
      {showGhostToast && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-purple-900/95 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_40px_rgba(168,85,247,0.7)] animate-bounce flex items-center gap-3 z-[65] pointer-events-auto border border-purple-500 w-max max-w-[90vw] whitespace-normal text-center">
            <Ghost size={24} className="shrink-0 animate-pulse text-purple-300" />
            <div className="flex flex-col items-start">
                <span className="font-tech font-bold text-xs md:text-sm text-purple-300">ANOMALÍA DETECTADA</span>
                <span className="font-mono text-xs">SERVIDOR FANTASMA MATERIALIZADO</span>
            </div>
        </div>
      )}

      {/* Combat Started Toast */}
      {showCombatToast && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-red-900/95 backdrop-blur text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-[0_0_40px_rgba(220,38,38,0.8)] animate-pulse flex items-center gap-3 z-[65] pointer-events-auto border border-red-500 w-max max-w-[90vw] whitespace-normal text-center">
            <Swords size={24} className="shrink-0 text-red-300" />
            <span className="font-mono font-bold text-xs md:text-sm text-red-100">COMBATE INICIADO: PROTOCOLO ALFA</span>
        </div>
      )}

      {/* Toast Notification for Mana */}
      {showManaToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-alert-red text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-red-500 w-max max-w-[90vw] whitespace-normal text-center">
            <X size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">¡ENERGÍA INSUFICIENTE!</span>
        </div>
      )}

      {/* Toast Notification for NO UNITS FOUND */}
      {showNoBotsToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-yellow-300 w-max max-w-[90vw] whitespace-normal text-center">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">ERROR: NO UNIDADES OPERATIVAS</span>
        </div>
      )}

      {/* Toast Notification for Low Battery - UPDATED DESIGN */}
      {showLowBatteryToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-bounce flex items-center gap-3 z-[100] pointer-events-auto border-2 border-yellow-300 w-max max-w-[90vw] whitespace-normal text-center">
            <Battery size={24} className="shrink-0 text-black" />
            <div className="flex flex-col">
                <span className="font-tech font-bold text-sm md:text-base">¡ALERTA! BIOBOT SIN ENERGÍA</span>
                <span className="font-mono text-xs font-bold">ATAQUE DENEGADO</span>
            </div>
        </div>
      )}

      {/* Toast Notification for Save */}
      {showSaveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-blue-300 w-max max-w-[90vw] whitespace-normal text-center">
            <Save size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">PROGRESO GUARDADO</span>
        </div>
      )}

      {/* Toast Notification for Success Mana Purchase */}
      {showSuccessMana && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-neon-green/20 backdrop-blur-md text-neon-green px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-neon-green w-max max-w-[90vw] whitespace-normal text-center">
            <CheckCircle size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">RECARGA EXITOSA +100</span>
        </div>
      )}
      
      {/* Toast Notification for Success Crypto Exchange */}
      {showExchangeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tech-purple/20 backdrop-blur-md text-tech-purple px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-tech-purple w-max max-w-[90vw] whitespace-normal text-center">
            <ArrowRightLeft size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">CONVERSIÓN COMPLETADA</span>
        </div>
      )}

      {/* Toast Notification for Wasted Mana */}
      {showWastedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-alert-red/90 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-red-500 w-max text-center max-w-[90vw] whitespace-normal">
            <Activity size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">¡ERROR! OBJETIVO NO VÁLIDO.</span>
        </div>
      )}

      {/* Toast Notification for Kill */}
      {showKillToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900/90 text-alert-red px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-alert-red w-max max-w-[90vw] whitespace-normal text-center">
            <Skull size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">TERMINACIÓN EJECUTADA</span>
        </div>
      )}
      
      {/* Toast Notification for Revive */}
      {showReviveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-neon-green/90 text-black px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-neon-green w-max max-w-[90vw] whitespace-normal text-center">
            <HeartPulse size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">SISTEMA REINICIADO: UNIDAD ACTIVA</span>
        </div>
      )}

      {/* Toast Notification for Insufficient Crypto */}
      {showCryptoErrorToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-yellow-400 w-max max-w-[90vw] whitespace-normal text-center">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">SALDO INSUFICIENTE: REQUIERE MÁS CRIPTO</span>
        </div>
      )}

      {/* Top Bar Wrapper - Responsive */}
      {/* INCREASED Z-INDEX to ensure it's above the backdrop layer */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between pointer-events-auto w-full gap-3 md:gap-0 relative z-30">
        
        {/* Left: Player Profile & Energy */}
        <div 
            onClick={handleProfileClick}
            className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex items-center gap-3 md:gap-4 border border-tech-cyan/30 cursor-pointer hover:bg-slate-800 transition-colors w-full md:w-auto justify-center md:justify-start group"
        >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden border border-tech-cyan shrink-0 relative">
                <img src={player.avatarUrl} alt="Architect Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-tech-cyan/20 group-hover:bg-transparent transition-colors" />
            </div>
            <div className="flex flex-col items-start">
                <h2 className="font-tech font-bold text-gray-100 text-sm md:text-base tracking-wide">{player.name}</h2>
                <div className="flex items-center gap-1 text-tech-cyan font-mono font-bold text-xs md:text-sm">
                    <Zap size={14} fill="currentColor" />
                    <span>{player.points} ENERGÍA</span>
                </div>
            </div>
        </div>

        {/* Right: Global Stats Group + LEVEL INDICATOR */}
        <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
             
             {/* LEVEL INDICATOR */}
             <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[80px] border border-white/20 h-14 md:h-16 group hover:border-white/40 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                     <ChevronUp size={10} /> PROGRESO
                 </span>
                 <span className="text-base md:text-xl font-tech font-bold text-white leading-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                     NIVEL {level}
                 </span>
            </div>

             {/* Global Crypto Stat */}
             <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[120px] border border-tech-purple/30 h-14 md:h-16 group hover:border-tech-purple/60 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-tech-purple font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                     <Trophy size={10} /> CRIPTOMONEDAS
                 </span>
                 <span className="text-base md:text-xl font-tech font-bold text-white leading-tight drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]">
                     {availableCrypto.toLocaleString()}
                 </span>
                 {pendingCrypto > 0 && (
                     <span className="text-[9px] text-yellow-400 font-mono animate-pulse mt-0.5">
                         +{pendingCrypto.toLocaleString()} minando...
                     </span>
                 )}
            </div>

            {/* Vitality Stat */}
            <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[120px] border border-neon-green/30 h-14 md:h-16 group hover:border-neon-green/60 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-neon-green font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                     <Battery size={10} /> VITALIDAD DE BIOBOTS
                 </span>
                 <span className={`text-base md:text-xl font-tech font-bold leading-tight ${globalStats.averageEnergy > 70 ? 'text-neon-green' : globalStats.averageEnergy > 30 ? 'text-yellow-500' : 'text-alert-red'}`}>
                     {globalStats.averageEnergy}%
                 </span>
            </div>
        </div>
      </div>

      {/* Tools / Build Modal - INCREASED Z-INDEX TO FIX CLICK ISSUE */}
      {isToolsModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
              <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-600 relative">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-tech text-xl font-bold text-white flex items-center gap-2">
                          <Hammer size={20} className="text-gray-400" /> ALMACÉN DE RECURSOS
                      </h3>
                      <button onClick={() => setToolsModalOpen(false)}><X size={20} className="text-gray-500 hover:text-white" /></button>
                  </div>

                  <div className="mb-4">
                      <h4 className="text-gray-400 text-xs font-mono font-bold mb-2 uppercase">Estructura & Defensa</h4>
                      <div className="grid grid-cols-2 gap-3">
                          {/* Firewall Block */}
                          <button 
                            onClick={() => setSelectedBlockType(BlockType.FIREWALL)}
                            className={`p-3 rounded border flex flex-col items-center gap-2 transition-all ${selectedBlockType === BlockType.FIREWALL ? 'bg-gray-700 border-white ring-2 ring-white/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                          >
                              <Shield size={24} className="text-gray-300" />
                              <span className="text-sm font-bold text-white">Bloque Firewall</span>
                              <span className="text-xs text-tech-purple font-mono">{GAME_CONFIG.STRUCTURES.PRICES.FIREWALL} Cripto</span>
                          </button>

                          {/* Encryption Block */}
                          <button 
                            onClick={() => setSelectedBlockType(BlockType.ENCRYPTION)}
                            className={`p-3 rounded border flex flex-col items-center gap-2 transition-all ${selectedBlockType === BlockType.ENCRYPTION ? 'bg-yellow-900/30 border-yellow-600 ring-2 ring-yellow-500/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                          >
                              <Lock size={24} className="text-yellow-500" />
                              <span className="text-sm font-bold text-white">Bloque Cifrado</span>
                              <span className="text-xs text-tech-purple font-mono">{GAME_CONFIG.STRUCTURES.PRICES.ENCRYPTION} Cripto</span>
                          </button>
                      </div>
                  </div>

                  <div className="mb-6 opacity-50 cursor-not-allowed">
                      <h4 className="text-gray-500 text-xs font-mono font-bold mb-2 uppercase">Equipamiento (Próximamente)</h4>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-col items-center gap-2">
                              <Box size={24} className="text-gray-700" />
                              <span className="text-xs text-gray-600">Módulo IA</span>
                          </div>
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-col items-center gap-2">
                              <Box size={24} className="text-gray-700" />
                              <span className="text-xs text-gray-600">Turbo Cargador</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Quantity & Buy */}
                  {selectedBlockType && (
                      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-400">Cantidad:</span>
                              <div className="flex items-center gap-3">
                                  <button onClick={() => setBlockQuantity(Math.max(1, blockQuantity - 1))} className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">-</button>
                                  <span className="text-white font-mono font-bold w-6 text-center">{blockQuantity}</span>
                                  <button onClick={() => setBlockQuantity(blockQuantity + 1)} className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">+</button>
                              </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                              <span className="text-sm text-gray-400">Total:</span>
                              <span className="font-mono font-bold text-tech-purple text-lg">
                                  {(selectedBlockType === BlockType.FIREWALL ? GAME_CONFIG.STRUCTURES.PRICES.FIREWALL : GAME_CONFIG.STRUCTURES.PRICES.ENCRYPTION) * blockQuantity} Cripto
                              </span>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={handleBuyBlocks}
                            className="w-full mt-4 bg-tech-cyan text-black font-bold py-3 rounded hover:bg-cyan-400 transition-colors shadow-lg active:scale-95"
                          >
                              ADQUIRIR Y CONSTRUIR
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Player Profile Modal */}
      {isPlayerProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
              <div className="bg-slate-900 rounded-2xl p-6 md:p-8 w-full max-w-[420px] shadow-[0_0_40px_rgba(6,182,212,0.15)] border border-tech-cyan/50 relative overflow-y-auto max-h-[90vh]">
                  <button onClick={() => setPlayerProfileOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-alert-red transition-colors">
                      <X size={24} />
                  </button>
                  <div className="flex flex-col items-center mb-6">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-tech-cyan mb-4 overflow-hidden shadow-lg relative">
                          <img src={player.avatarUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 border-t border-white/20" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-tech font-bold text-white text-center tracking-wide">{player.name}</h2>
                      <p className="text-tech-cyan font-mono font-bold tracking-widest uppercase text-xs md:text-sm">Arquitecto del Sistema</p>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4 font-mono">
                      {/* Unidades Creadas (Histórico) */}
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3 text-gray-400">
                              <Cpu size={18} />
                              <span className="text-sm md:text-base">Unidades Creadas</span>
                          </div>
                          <span className="font-bold text-lg md:text-xl text-white">{player.stats.entitiesCreated}</span>
                      </div>

                      {/* Unidades Disponibles (Activas) */}
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3 text-gray-400">
                              <User size={18} />
                              <span className="text-sm md:text-base">Unidades Disponibles</span>
                          </div>
                          <span className="font-bold text-lg md:text-xl text-neon-green">{activeBiobotsCount}</span>
                      </div>

                      {/* Nodos de Datos (Creados) */}
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3 text-gray-400">
                              <HardDrive size={18} />
                              <span className="text-sm md:text-base">Nodos Creados</span>
                          </div>
                          <span className="font-bold text-lg md:text-xl text-white">{player.stats.landsCreated}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3 text-gray-400">
                              <Zap size={18} />
                              <span className="text-sm md:text-base">Energía Total</span>
                          </div>
                          <span className="font-bold text-lg md:text-xl text-tech-cyan">{player.points}</span>
                      </div>
                      
                      {/* Crypto Exchange Section */}
                      <div className="pt-4 border-t border-slate-700">
                          <h4 className="font-tech font-bold text-gray-300 mb-3 flex items-center gap-2 text-sm md:text-base">
                             <Wallet size={18} className="text-tech-purple" /> Bolsa de Valores (10:1)
                          </h4>
                          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-400 uppercase tracking-wide">Saldo Líquido</span>
                              <span className="font-mono font-bold text-tech-purple">{availableCrypto.toLocaleString()} CRIPTO</span>
                          </div>
                          
                          {/* 3-Option Exchange Grid */}
                          <div className="grid grid-cols-3 gap-2">
                              {/* Option 1: 60% */}
                              <button 
                                  onClick={() => handleExchangeCrypto(optionHigh)}
                                  disabled={optionHigh <= 0}
                                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-tech-purple/50 bg-tech-purple/10 hover:bg-tech-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                              >
                                  <span className="text-xs text-gray-400 mb-1">60%</span>
                                  <span className="text-sm font-bold text-white mb-1">{optionHigh}</span>
                                  <span className="text-[10px] text-neon-green group-hover:underline">+{optionHigh / 10}⚡</span>
                              </button>

                              {/* Option 2: 30% */}
                              <button 
                                  onClick={() => handleExchangeCrypto(optionMid)}
                                  disabled={optionMid <= 0}
                                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-tech-purple/50 bg-tech-purple/10 hover:bg-tech-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                              >
                                  <span className="text-xs text-gray-400 mb-1">30%</span>
                                  <span className="text-sm font-bold text-white mb-1">{optionMid}</span>
                                  <span className="text-[10px] text-neon-green group-hover:underline">+{optionMid / 10}⚡</span>
                              </button>

                              {/* Option 3: 10% */}
                              <button 
                                  onClick={() => handleExchangeCrypto(optionLow)}
                                  disabled={optionLow <= 0}
                                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-tech-purple/50 bg-tech-purple/10 hover:bg-tech-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                              >
                                  <span className="text-xs text-gray-400 mb-1">10%</span>
                                  <span className="text-sm font-bold text-white mb-1">{optionLow}</span>
                                  <span className="text-[10px] text-neon-green group-hover:underline">+{optionLow / 10}⚡</span>
                              </button>
                          </div>
                          
                          {availableCrypto < 10 && (
                             <div className="text-center text-[10px] text-gray-500 mt-2 italic">Mínimo requerido: 10 Cripto</div>
                          )}
                      </div>

                      {/* Shop Section */}
                      <div className="pt-4 border-t border-slate-700">
                          <h4 className="font-tech font-bold text-gray-300 mb-3 flex items-center gap-2 text-sm md:text-base">
                             <ShoppingBag size={18} className="text-neon-green" /> Inyección Manual
                          </h4>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Ingresar Código" 
                                className="flex-1 bg-black/40 border border-slate-600 rounded p-2 focus:border-tech-cyan outline-none transition-colors text-sm text-white font-mono"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value)}
                              />
                              <button 
                                onClick={handleRedeemCode}
                                className="bg-neon-green/20 border border-neon-green text-neon-green px-4 py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-neon-green hover:text-black transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                              >
                                  EJECUTAR
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Selected Entity Modal (Bottom Left) */}
      {selectedEntity && !isChatOpen && (
        <div className="pointer-events-auto absolute left-4 md:left-24 bottom-24 md:bottom-24 w-[calc(100%-2rem)] md:w-80 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700 p-4 md:p-5 z-40">
            <button onClick={onCloseSelection} className="absolute top-2 right-2 text-gray-500 hover:text-alert-red transition-colors">
                <X size={18} />
            </button>
            
            {/* --- WALLET PANEL --- */}
            {selectedEntity.type === EntityType.WALLET ? (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-tech-cyan bg-slate-800 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] relative">
                         <div className="absolute inset-0 border border-dashed border-white/30 rounded-full animate-spin-slow" />
                         <Cpu size={24} className="text-tech-cyan" />
                    </div>
                    <h3 className="font-tech font-bold text-xl text-white tracking-widest mb-1">CORE WALLET</h3>
                    <p className="text-[10px] text-gray-400 font-mono mb-4">SISTEMA FINANCIERO CENTRAL</p>
                    
                    <div className="w-full space-y-3">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-tech-cyan/30 flex justify-between items-center">
                            <span className="text-tech-cyan font-mono text-xs font-bold">ENERGÍA</span>
                            <span className="text-white font-tech text-lg">{player.points}</span>
                        </div>
                         <div className="bg-slate-800/50 p-3 rounded-lg border border-tech-purple/30 flex justify-between items-center">
                            <span className="text-tech-purple font-mono text-xs font-bold">CRIPTOMONEDAS</span>
                            <span className="text-white font-tech text-lg">{availableCrypto}</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- STANDARD ENTITY PANEL (Person/Land) --- */
                <>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border border-tech-cyan shadow-lg bg-slate-800 overflow-hidden relative ${selectedEntity.attributes?.estado === 'muerto' ? 'grayscale opacity-50' : ''}`}>
                             {selectedEntity.type === EntityType.PERSON ? (
                                 <img src={selectedEntity.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                             ) : selectedEntity.type === EntityType.BLOCK ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                    {selectedEntity.blockAttributes?.type === BlockType.FIREWALL ? <Shield size={32} className="text-gray-400" /> : <Lock size={32} className="text-yellow-600" />}
                                </div>
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                    <HardDrive size={32} className="text-tech-cyan" />
                                </div>
                             )}
                             
                             {selectedEntity.attributes?.estado !== 'muerto' && (
                                 <div className="absolute bottom-0 left-0 w-full h-1 bg-tech-cyan animate-pulse" />
                             )}
                        </div>
                        <div>
                            <h3 className="font-tech font-bold text-lg md:text-xl text-white tracking-wide">
                                {selectedEntity.type === EntityType.LAND ? (selectedEntity.landAttributes?.isGhost ? 'GHOST NODE' : 'DATA NODE') : selectedEntity.type === EntityType.BLOCK ? 'STRUCTURE' : selectedEntity.attributes?.nombre}
                            </h3>
                            <p className="text-[10px] md:text-xs text-tech-cyan font-mono uppercase tracking-widest">
                                {selectedEntity.type === EntityType.LAND ? `ID: ${selectedEntity.id.slice(0,6)}` : selectedEntity.type === EntityType.BLOCK ? selectedEntity.blockAttributes?.type : `${selectedEntity.attributes?.sexo} • v.${selectedEntity.attributes?.edad}.0`}
                            </p>
                        </div>
                    </div>
                    
                    {selectedEntity.type === EntityType.PERSON && selectedEntity.attributes && (
                        <div className="space-y-2 text-xs md:text-sm text-gray-300 font-mono mb-4">
                            <div className="flex justify-between border-b border-slate-700 pb-1">
                                <span className="text-gray-500">Módulo:</span>
                                <span className="font-semibold text-tech-purple">{selectedEntity.attributes.personalidad}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-1">
                                <span className="text-gray-500">Batería:</span>
                                <span className={`font-semibold ${selectedEntity.attributes.energia > 50 ? 'text-neon-green' : 'text-alert-red'}`}>{Math.round(selectedEntity.attributes.energia)}%</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-1">
                                <span className="text-gray-500">Output:</span>
                                <span className="font-semibold text-tech-cyan flex items-center gap-1">
                                    <BarChart3 size={14} /> {Math.floor(selectedEntity.attributes.individualScore)}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-1">
                                <span className="text-gray-500">Estado:</span>
                                <span className="font-semibold capitalize flex items-center gap-1">
                                    {selectedEntity.attributes.estado === 'muerto' ? (
                                        <span className="text-pink-600 animate-pulse font-bold">FALLO CRÍTICO</span>
                                    ) : (
                                        <span className="text-blue-400">{selectedEntity.attributes.estado}</span>
                                    )}

                                    {selectedEntity.attributes.estado === 'trabajando' && timeLeft !== null && (
                                        <span className="text-orange-400 font-bold ml-1 flex items-center">
                                            <Clock size={12} className="mr-1"/> {timeLeft}s
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {selectedEntity.type === EntityType.LAND && selectedEntity.landAttributes && (
                         <div className="space-y-2 text-xs md:text-sm text-gray-300 font-mono mb-4">
                            <div className="flex justify-between border-b border-slate-700 pb-1">
                                <span className="text-gray-500">Recursos:</span>
                                <span className="font-semibold text-neon-green">{Math.round(selectedEntity.landAttributes.resourceLevel)}%</span>
                            </div>
                            
                            {/* RECHARGE BUTTON IN NODE PROPERTIES */}
                            <button
                                onClick={() => {
                                    onNodeRecharge(selectedEntity.id);
                                    onCloseSelection(); // Auto-close modal
                                }}
                                disabled={isPlacingLand || isPlacingPerson || isTargetingRecharge}
                                className="w-full bg-blue-600/20 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] mt-2"
                            >
                                <Zap size={18} />
                                RECARGAR ENERGÍA (-{ACTION_COST})
                            </button>
                         </div>
                    )}

                    {selectedEntity.type === EntityType.PERSON && selectedEntity.attributes && (
                        <div className="flex flex-col gap-2">
                            {/* ACTIONS ROW */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={openChat}
                                    disabled={selectedEntity.attributes.estado === 'muerto'}
                                    className="flex-1 bg-slate-800 border border-slate-600 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-tech-cyan/10 hover:border-tech-cyan hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm font-mono font-bold"
                                >
                                    <MessageCircle size={16} />
                                    <span>CONSOLA</span>
                                </button>

                                {GAME_CONFIG.DEATH.ENABLE_MANUAL_KILL && selectedEntity.attributes.estado !== 'muerto' && (
                                    <button 
                                        onClick={handleKill}
                                        className="w-12 bg-alert-red/10 border border-alert-red/50 text-alert-red rounded-lg flex items-center justify-center hover:bg-alert-red hover:text-white transition-all"
                                        title="Terminar Proceso"
                                    >
                                        <Skull size={20} />
                                    </button>
                                )}
                                
                                {/* REVIVE BUTTON - Only visible when dead */}
                                {selectedEntity.attributes.estado === 'muerto' && (
                                    <button 
                                        onClick={handleRevive}
                                        className="flex-1 bg-neon-green/10 border border-neon-green/50 text-neon-green py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-neon-green hover:text-black transition-all text-xs md:text-sm font-mono animate-pulse"
                                        title="Reactivar Unidad (-10 Energía)"
                                    >
                                        <HeartPulse size={16} />
                                        <span>REVIVIR</span>
                                    </button>
                                )}
                            </div>

                            {/* PRIMARY ACTION BUTTON - CONDITIONAL BY GENDER */}
                            {selectedEntity.attributes.estado !== 'muerto' && (
                                <>
                                    {selectedEntity.attributes.sexo === Gender.FEMALE ? (
                                        // BETA: MINER BUTTON
                                        <button
                                            onClick={() => {
                                                handleWorkProtocol(selectedEntity.id);
                                                onCloseSelection(); // Auto-close modal
                                            }}
                                            disabled={isPlacingLand || isPlacingPerson || isTargetingRecharge}
                                            className="w-full bg-orange-600/20 border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white transition-all py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]"
                                        >
                                            <Pickaxe size={18} />
                                            MINAR
                                        </button>
                                    ) : (
                                        // ALFA: GUARDIAN BUTTON
                                        <button
                                            onClick={() => {
                                                handleAttackProtocol(selectedEntity.id);
                                            }}
                                            disabled={isPlacingLand || isPlacingPerson || isTargetingRecharge}
                                            className="w-full bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
                                        >
                                            <Swords size={18} />
                                            ATACAR
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && selectedEntity && (
        <div className="pointer-events-auto absolute left-4 md:left-24 bottom-24 md:bottom-24 w-[calc(100%-2rem)] md:w-80 h-80 md:h-96 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-tech-cyan/40 flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="p-3 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-slate-600">
                        <img src={selectedEntity.avatarUrl} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-mono font-bold text-sm text-tech-cyan">{selectedEntity.attributes?.nombre}</span>
                </div>
                <button onClick={closeChat} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50 font-mono">
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-2 rounded-lg text-xs md:text-sm ${msg.sender === 'user' ? 'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/50 rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-gray-300 rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input 
                    type="text" 
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Comando de texto..."
                    className="flex-1 bg-slate-900 rounded border border-slate-700 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-tech-cyan font-mono"
                />
                <button 
                    onClick={handleSendMessage}
                    className="bg-tech-cyan/20 border border-tech-cyan text-tech-cyan p-2 rounded hover:bg-tech-cyan hover:text-black transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
      )}

      {/* NEW: Minecraft-Inspired Action Dock (Left Side) */}
      <div className="pointer-events-auto absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 z-30"> 
          
          {/* 1. BIOBOT COMMAND CENTER */}
          <div className="relative group">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'actions' ? null : 'actions')}
                className={`w-14 h-14 md:w-16 md:h-16 bg-slate-900 border-2 ${activeMenu === 'actions' ? 'border-tech-cyan shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'border-slate-600 hover:border-white'} rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95`}
                title="Comandos BioBot"
              >
                  <Bot size={32} className={`${activeMenu === 'actions' ? 'text-tech-cyan' : 'text-gray-300'}`} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-tech-cyan rounded-full border-2 border-slate-900" />
              </button>

              {/* Sub-menu (Pop-out) */}
              {activeMenu === 'actions' && (
                  <div className="absolute left-full top-0 ml-3 bg-slate-900/95 backdrop-blur-xl p-2 rounded-xl border border-tech-cyan/30 shadow-2xl flex flex-col gap-1 animate-pop-in origin-left min-w-[180px]">
                      <div className="text-[10px] text-gray-400 font-mono font-bold uppercase mb-1 border-b border-gray-700 pb-1 px-1">Acciones</div>
                      
                      {/* Create Bot */}
                      <button 
                        onClick={() => { setModalOpen(true); setActiveMenu(null); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"
                      >
                          <div className="p-2 bg-tech-cyan/20 rounded text-tech-cyan"><Cpu size={20}/></div>
                          <span className="text-sm font-bold">Crear BioBot</span>
                      </button>

                      {/* Create Node */}
                      <button 
                        onClick={() => checkManaAndExecute(() => { onAction('CREATE_LAND'); setActiveMenu(null); })}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"
                      >
                          <div className="p-2 bg-neon-green/20 rounded text-neon-green"><Database size={20}/></div>
                          <span className="text-sm font-bold">Nuevo Nodo</span>
                      </button>

                      {/* Tools */}
                      <button 
                        onClick={() => { setToolsModalOpen(true); setActiveMenu(null); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"
                      >
                          <div className="p-2 bg-gray-600/30 rounded text-gray-300"><Hammer size={20}/></div>
                          <span className="text-sm font-bold">Herramientas</span>
                      </button>
                  </div>
              )}
          </div>

          {/* 2. SYSTEM CORE */}
          <div className="relative group">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'system' ? null : 'system')}
                className={`w-14 h-14 md:w-16 md:h-16 bg-slate-900 border-2 ${activeMenu === 'system' ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]' : 'border-slate-600 hover:border-white'} rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95`}
                title="Sistema del Juego"
              >
                  <Settings size={32} className={`${activeMenu === 'system' ? 'text-yellow-500' : 'text-gray-300'}`} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-slate-900" />
              </button>

              {/* Sub-menu (Pop-out) */}
              {activeMenu === 'system' && (
                  <div className="absolute left-full top-0 ml-3 bg-slate-900/95 backdrop-blur-xl p-2 rounded-xl border border-yellow-500/30 shadow-2xl flex flex-col gap-1 animate-pop-in origin-left min-w-[180px]">
                      <div className="text-[10px] text-gray-400 font-mono font-bold uppercase mb-1 border-b border-gray-700 pb-1 px-1">Sistema</div>
                      
                      {/* Pause */}
                      <button 
                        onClick={() => { togglePause(); setActiveMenu(null); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"
                      >
                          <div className={`p-2 rounded ${isPaused ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                              {isPaused ? <Play size={20}/> : <Pause size={20}/>}
                          </div>
                          <span className="text-sm font-bold">{isPaused ? "Reanudar" : "Pausar"}</span>
                      </button>

                      {/* Save */}
                      <button 
                        onClick={handleManualSave}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"
                      >
                          <div className="p-2 bg-blue-500/20 rounded text-blue-400"><Save size={20}/></div>
                          <span className="text-sm font-bold">Guardar</span>
                      </button>

                      {/* Restart */}
                      <button 
                        onClick={() => { onRestart(); setActiveMenu(null); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"
                      >
                          <div className="p-2 bg-orange-500/20 rounded text-orange-500"><RotateCcw size={20}/></div>
                          <span className="text-sm font-bold">Reiniciar</span>
                      </button>

                      {/* Exit */}
                      <button 
                        onClick={() => { onExit(); setActiveMenu(null); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/30 text-red-400 transition-colors w-48 border border-red-900/50 hover:border-red-500"
                      >
                          <div className="p-2 bg-red-500/10 rounded text-red-500"><LogOut size={20}/></div>
                          <span className="text-sm font-bold">Salir</span>
                      </button>
                  </div>
              )}
          </div>

      </div>

      {/* Creation Modal */}
      {isCreationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
            <div className="bg-slate-900 rounded-xl p-6 md:p-8 w-full max-w-sm shadow-[0_0_50px_rgba(6,182,212,0.2)] border border-tech-cyan/50">
                <h3 className="font-tech text-xl md:text-2xl font-bold mb-6 text-center text-white tracking-widest uppercase flex items-center justify-center gap-2">
                    <Cpu size={24} className="text-tech-cyan"/> Génesis de BioBot
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1 font-mono">Tipo de Unidad</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCreationGender(Gender.MALE)}
                                className={`flex-1 py-3 rounded border transition-all text-sm md:text-base font-mono ${creationGender === Gender.MALE ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-slate-800 border-slate-700 text-gray-500 hover:border-red-500/50'}`}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="font-bold">ALFA (M)</span>
                                    <span className="text-[10px] uppercase opacity-70">Guardián</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => setCreationGender(Gender.FEMALE)}
                                className={`flex-1 py-3 rounded border transition-all text-sm md:text-base font-mono ${creationGender === Gender.FEMALE ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-slate-800 border-slate-700 text-gray-500 hover:border-orange-500/50'}`}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="font-bold">BETA (F)</span>
                                    <span className="text-[10px] uppercase opacity-70">Minero</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-bold text-gray-400 mb-1 font-mono">Designación</label>
                         <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 focus:border-tech-cyan outline-none text-white font-mono"
                            placeholder="Ej: X-99"
                            value={creationName}
                            onChange={(e) => setCreationName(e.target.value)}
                         />
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="flex-1 py-3 text-gray-400 hover:bg-slate-800 rounded transition-colors text-sm md:text-base font-mono border border-transparent"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleCreatePerson}
                            className="flex-1 py-3 bg-tech-cyan/20 border border-tech-cyan text-tech-cyan font-bold rounded hover:bg-tech-cyan hover:text-black transition-all text-sm md:text-base font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                            INICIAR (-{ACTION_COST})
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* MINIMAP */}
      <div className="pointer-events-auto absolute right-4 bottom-32 md:bottom-32 z-30">
        <Minimap entities={entities} />
      </div>

      {/* LIVE CONSOLE INTEGRATION */}
      <div className="pointer-events-auto relative z-50">
          <LiveConsole />
      </div>

    </div>
  );
};
