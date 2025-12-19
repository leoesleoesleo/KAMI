import React, { useState, useRef, useEffect } from 'react';
import { PlayerState, GameEntity, Gender, INITIAL_POINTS, ACTION_COST, EntityType, BlockType } from '../types';
import { Bot, Database, Zap, Pickaxe, X, MessageCircle, Send, User, Trophy, Activity, Clock, MapPin, ShoppingBag, CheckCircle, BarChart3, Battery, Skull, Fingerprint, Crosshair, Cpu, AlertTriangle, HardDrive, LogOut, RotateCcw, HeartPulse, ArrowRightLeft, Wallet, Hammer, Shield, Lock, Box, ChevronUp, Ghost, Pause, Play, Settings, Save, Swords, Share2, Link, Globe, Users, SquareDashedMousePointer, Dna, ShieldCheck, Microscope, ScanSearch, Flame } from 'lucide-react';
import { createPersonJSON, getRandomGender } from '../services/gameService';
import { GAME_CONFIG } from '../gameConfig';
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
  selectedEntityIds?: string[]; // New Multi-select
  isSelectionMode?: boolean; // New Toggle
  toggleSelectionMode?: () => void; // New Handler
}

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

const SHARE_PREVIEW_URL = "https://leoesleoesleo.github.io/imagenes/biobots_genesys.png";

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
    closeModalsTrigger,
    selectedEntityIds = [],
    isSelectionMode = false,
    toggleSelectionMode
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
  const [showLowBatteryToast, setShowLowBatteryToast] = useState(false); 
  const [showSpecialAttackToast, setShowSpecialAttackToast] = useState(false);

  // Tools/Build Modal
  const [isToolsModalOpen, setToolsModalOpen] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);
  const [blockQuantity, setBlockQuantity] = useState(4); 

  // Player Profile Modal
  const [isPlayerProfileOpen, setPlayerProfileOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  // Share Modal
  const [isShareModalOpen, setShareModalOpen] = useState(false);

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
          setShareModalOpen(false);
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

  const checkManaAndExecute = (action: () => void, cost: number = ACTION_COST) => {
    if (player.points < cost) {
        setShowManaToast(true);
        setTimeout(() => setShowManaToast(false), 3000);
    } else {
        action();
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      setPlayerProfileOpen(true);
      setActiveMenu(null); 
  };

  const handleCreatePerson = () => {
    checkManaAndExecute(() => {
        const attributes = createPersonJSON(creationGender, creationName || undefined);
        onAction('CREATE_PERSON', attributes);
        setModalOpen(false);
        setCreationName('');
        setActiveMenu(null);
    }, GAME_CONFIG.COSTS.NEW_BIOBOT);
  };

  const handleWorkProtocol = (entityId?: string) => {
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
          if (entityId && selectedEntity?.id === entityId) {
              onCloseSelection();
          }
      }, ACTION_COST);
  };

  const handleAttackProtocol = (entityId: string) => {
      if (player.points <= 0) {
          setShowManaToast(true);
          setTimeout(() => setShowManaToast(false), 3000);
          return;
      }

      if (entityId) {
          const targetBot = entities.find(e => e.id === entityId);
          
          if (targetBot && targetBot.attributes) {
              if (targetBot.attributes.energia <= 0) {
                  setShowLowBatteryToast(true);
                  setTimeout(() => setShowLowBatteryToast(false), 4000);
                  return; 
              }
              
              if (targetBot.attributes.estado === 'muerto') {
                  return;
              }
          }
      }

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

  const handleSpecialAttack = (entityId: string) => {
      if (player.points < GAME_CONFIG.COMBAT.SPECIAL_ATTACK.COST) {
          setShowManaToast(true);
          setTimeout(() => setShowManaToast(false), 3000);
          return;
      }
      
      onAction('SPECIAL_ATTACK', entityId);
      
      setShowSpecialAttackToast(true);
      setTimeout(() => setShowSpecialAttackToast(false), 3000);
      onCloseSelection();
  };

  const handleToggleCombatMode = (entityId: string) => {
      if (!selectedEntity || !selectedEntity.attributes) return;
      const currentMode = selectedEntity.attributes.combatMode || 'hunter';
      const newMode = currentMode === 'hunter' ? 'guardian' : 'hunter';
      onAction('SET_COMBAT_MODE', { entityId, mode: newMode });
  };

  const handleBulkAttack = () => {
      if (!selectedEntityIds) return;
      
      const alfas = selectedEntityIds.filter(id => {
          const e = entities.find(ent => ent.id === id);
          return e && e.type === EntityType.PERSON && e.attributes?.sexo === Gender.MALE;
      });
      
      let attacksTriggered = 0;
      alfas.forEach(id => {
           const bot = entities.find(e => e.id === id);
           if (bot && bot.attributes?.estado !== 'muerto' && bot.attributes!.energia > 0) {
               onAction('ATTACK_INTRUDER', id);
               attacksTriggered++;
           }
      });

      if (attacksTriggered > 0) {
          setShowCombatToast(true);
          setTimeout(() => setShowCombatToast(false), 3000);
          onCloseSelection(); 
      }
  };

  const handleBulkMine = () => {
      if (!selectedEntityIds) return;
      
      const betas = selectedEntityIds.filter(id => {
          const e = entities.find(ent => ent.id === id);
          return e && e.type === EntityType.PERSON && e.attributes?.sexo === Gender.FEMALE;
      });
      
      let workTriggered = 0;
      betas.forEach(id => {
           const bot = entities.find(e => e.id === id);
           if (bot && bot.attributes?.estado !== 'muerto') {
               if (player.points >= ACTION_COST) {
                   onAction('CREATE_WORK', id);
                   workTriggered++;
               }
           }
      });
      
      if (workTriggered > 0) {
          onCloseSelection();
      }
  };

  const activeBiobotsCount = entities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto').length;
  const availableCrypto = Math.floor(Math.max(0, globalStats.globalScore - (player.stats.cryptoSpent || 0)));

  const handleBuyBlocks = (e: React.MouseEvent) => {
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
          setToolsModalOpen(false); 
          return;
      }

      onAction('BUY_STRUCTURE', { type: selectedBlockType, quantity: blockQuantity, totalCost });
      setToolsModalOpen(false);
      setActiveMenu(null);
      
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
          return;
      } 
      
      const secretPattern = /^#secret00bio(0[1-9]|10)$/;
      if (secretPattern.test(redeemCode)) {
          const levelStr = redeemCode.replace('#secret00bio', '');
          const targetLevel = parseInt(levelStr, 10);

          let targetCrypto = 0;
          if (targetLevel === 1) {
              targetCrypto = 1000; 
          } else {
              // @ts-ignore
              const configKey = `LVL${targetLevel}`;
              // @ts-ignore
              const levelConfig = GAME_CONFIG.LEVELS[configKey];
              if (levelConfig) {
                  targetCrypto = levelConfig.MIN_CRYPTO;
              }
          }

          onAction('ACTIVATE_LEVEL_CHEAT', { level: targetLevel, crypto: targetCrypto });
          setRedeemCode('');
          setPlayerProfileOpen(false);
          return;
      }

      alert("Código de acceso denegado");
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
              onBuyMana(100);
              setShowSuccessMana(true);
              setTimeout(() => setShowSuccessMana(false), 3000);
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

      onBuyMana(100);
      setShareModalOpen(false);
      setShowSuccessMana(true);
      setTimeout(() => setShowSuccessMana(false), 3000);
  };

  const handleExchangeCrypto = (amount: number) => {
      onAction('EXCHANGE_CRYPTO', { amount });
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

  const groupSelectionCount = selectedEntityIds.length;
  const groupAlfas = selectedEntityIds.filter(id => {
      const e = entities.find(ent => ent.id === id);
      return e && e.type === EntityType.PERSON && e.attributes?.sexo === Gender.MALE;
  }).length;
  const groupBetas = selectedEntityIds.filter(id => {
      const e = entities.find(ent => ent.id === id);
      return e && e.type === EntityType.PERSON && e.attributes?.sexo === Gender.FEMALE;
  }).length;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20 font-sans">
      {activeMenu && <div className="fixed inset-0 z-25 bg-transparent pointer-events-auto" onClick={() => setActiveMenu(null)} />}
      {isPaused && (
          <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
              <div className="bg-black/80 border-2 border-yellow-500/50 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl animate-pulse">
                  <Pause size={48} className="text-yellow-500" />
                  <h2 className="text-3xl font-tech font-bold text-white tracking-widest">SIMULACIÓN PAUSADA</h2>
                  <button onClick={togglePause} className="mt-4 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg font-mono tracking-wider transition-all">REANUDAR SISTEMA</button>
              </div>
          </div>
      )}
      {showLevelBanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]" />
              <div className="relative text-center animate-[popIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                  <h1 className="text-6xl md:text-8xl font-black font-tech text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan via-white to-tech-purple drop-shadow-[0_0_50px_rgba(6,182,212,0.8)] tracking-tighter">{showLevelBanner}</h1>
                  <div className="h-1 w-full bg-neon-green mt-4 shadow-[0_0_20px_#10b981]" />
              </div>
          </div>
      )}

      {/* DOCK BARRA SUPERIOR */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between pointer-events-auto w-full gap-3 md:gap-0 relative z-30">
        <div onClick={handleProfileClick} className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex items-center gap-3 md:gap-4 border border-tech-cyan/30 cursor-pointer hover:bg-slate-800 transition-colors w-full md:w-auto justify-center md:justify-start group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden border border-tech-cyan shrink-0 relative">
                <img src={player.avatarUrl} alt="Architect" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-tech-cyan/20 group-hover:bg-transparent transition-colors" />
            </div>
            <div className="flex flex-col items-start">
                <h2 className="font-tech font-bold text-gray-100 text-sm md:text-base tracking-wide">{player.name}</h2>
                <div className="flex items-center gap-1 text-tech-cyan font-mono font-bold text-xs md:text-sm"><Zap size={14} fill="currentColor" /><span>{player.points} ENERGÍA</span></div>
            </div>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
             <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[80px] border border-white/20 h-14 md:h-16 group hover:border-white/40 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1"><ChevronUp size={10} /> PROGRESO</span>
                 <span className="text-base md:text-xl font-tech font-bold text-white leading-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">NIVEL {level}</span>
            </div>
             <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[120px] border border-tech-purple/30 h-14 md:h-16 group hover:border-tech-purple/60 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-tech-purple font-mono font-bold uppercase tracking-wider flex items-center gap-1"><Trophy size={10} /> CRIPTOMONEDAS</span>
                 <span className="text-base md:text-xl font-tech font-bold text-white leading-tight drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]">{availableCrypto.toLocaleString()}</span>
                 {pendingCrypto > 0 && <span className="text-[9px] text-yellow-400 font-mono animate-pulse mt-0.5">+{pendingCrypto.toLocaleString()} minando...</span>}
            </div>
            <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[120px] border border-neon-green/30 h-14 md:h-16 group hover:border-neon-green/60 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-neon-green font-mono font-bold uppercase tracking-wider flex items-center gap-1"><Battery size={10} /> VITALIDAD</span>
                 <span className={`text-base md:text-xl font-tech font-bold leading-tight ${globalStats.averageEnergy > 70 ? 'text-neon-green' : globalStats.averageEnergy > 30 ? 'text-yellow-500' : 'text-alert-red'}`}>{globalStats.averageEnergy}%</span>
            </div>
        </div>
      </div>

      <div className="absolute bottom-20 right-4 md:bottom-8 md:right-8 pointer-events-auto z-30"><Minimap entities={entities} /></div>

      {/* Manual Share Modal */}
      {isShareModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto p-4">
              <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(59,130,246,0.3)] border border-blue-500/50 relative animate-pop-in">
                  <button onClick={() => setShareModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
                  <div className="flex flex-col items-center mb-4">
                      <Share2 size={32} className="text-blue-400 mb-2" />
                      <h3 className="font-tech text-xl font-bold text-white tracking-widest uppercase text-center">COMPARTIR SISTEMA</h3>
                  </div>

                  {/* Share Image Preview Card */}
                  <div className="mb-6 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img src={SHARE_PREVIEW_URL} alt="Share Preview" className="w-full h-32 object-cover" />
                      <div className="p-3 bg-slate-800/50 text-center">
                          <h4 className="text-xs font-tech font-bold text-white mb-1 tracking-wider uppercase">BioBots: Génesis Evolutiva</h4>
                          <p className="text-[10px] text-gray-400 font-mono leading-tight">Simulador de evolución tecnológica. ¡Únete a la simulación!</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                      <button onClick={() => handleManualShare('whatsapp')} className="flex flex-col items-center gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg hover:bg-green-800/30 transition-all hover:scale-105"><MessageCircle size={24} className="text-green-400" /><span className="text-xs font-bold text-green-100">WhatsApp</span></button>
                      <button onClick={() => handleManualShare('facebook')} className="flex flex-col items-center gap-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg hover:bg-blue-800/30 transition-all hover:scale-105"><Globe size={24} className="text-blue-400" /><span className="text-xs font-bold text-blue-100">Facebook</span></button>
                      <button onClick={() => handleManualShare('twitter')} className="flex flex-col items-center gap-2 p-3 bg-sky-900/20 border border-sky-700 rounded-lg hover:bg-sky-800/30 transition-all hover:scale-105"><Send size={24} className="text-sky-400" /><span className="text-xs font-bold text-sky-100">Twitter / X</span></button>
                      <button onClick={() => handleManualShare('copy')} className="flex flex-col items-center gap-2 p-3 bg-gray-800/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all hover:scale-105"><Link size={24} className="text-gray-300" /><span className="text-xs font-bold text-gray-200">Copiar Link</span></button>
                  </div>
                  <div className="text-center text-[10px] text-neon-green font-mono animate-pulse">RECOMPENSA ACTIVA: +100 ENERGÍA</div>
              </div>
          </div>
      )}

      {/* MODAL PERFIL JUGADOR */}
      {isPlayerProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
              <div className="bg-slate-900 rounded-2xl p-6 md:p-8 w-full max-w-[420px] shadow-[0_0_40px_rgba(6,182,212,0.15)] border border-tech-cyan/50 relative overflow-y-auto max-h-[90vh]">
                  <button onClick={() => setPlayerProfileOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-alert-red transition-colors"><X size={24} /></button>
                  <div className="flex flex-col items-center mb-6">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-tech-cyan mb-4 overflow-hidden shadow-lg relative"><img src={player.avatarUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 border-t border-white/20" /></div>
                      <h2 className="text-2xl md:text-3xl font-tech font-bold text-white text-center tracking-wide">{player.name}</h2>
                      <p className="text-tech-cyan font-mono font-bold tracking-widest uppercase text-xs md:text-sm">Arquitecto del Sistema</p>
                  </div>
                  <div className="space-y-3 md:space-y-4 font-mono">
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700"><div className="flex items-center gap-3 text-gray-400"><Cpu size={18} /><span className="text-sm md:text-base">Unidades Creadas</span></div><span className="font-bold text-lg md:text-xl text-white">{player.stats.entitiesCreated}</span></div>
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700"><div className="flex items-center gap-3 text-gray-400"><User size={18} /><span className="text-sm md:text-base">Unidades Disponibles</span></div><span className="font-bold text-lg md:text-xl text-neon-green">{activeBiobotsCount}</span></div>
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700"><div className="flex items-center gap-3 text-gray-400"><HardDrive size={18} /><span className="text-sm md:text-base">Nodos Creados</span></div><span className="font-bold text-lg md:text-xl text-white">{player.stats.landsCreated}</span></div>
                      <div className="flex items-center justify-between p-3 md:p-4 bg-slate-800/50 rounded-lg border border-slate-700"><div className="flex items-center gap-3 text-gray-400"><Zap size={18} /><span className="text-sm md:text-base">Energía Total</span></div><span className="font-bold text-lg md:text-xl text-tech-cyan">{player.points}</span></div>
                      <div className="pt-4 border-t border-slate-700">
                          <h4 className="font-tech font-bold text-gray-300 mb-3 flex items-center gap-2 text-sm md:text-base"><Wallet size={18} className="text-tech-purple" /> Bolsa de Valores (10:1)</h4>
                          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between mb-3"><span className="text-xs text-gray-400 uppercase tracking-wide">Saldo Líquido</span><span className="font-mono font-bold text-tech-purple">{availableCrypto.toLocaleString()} CRIPTO</span></div>
                          <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => handleExchangeCrypto(optionHigh)} disabled={optionHigh <= 0} className="flex flex-col items-center justify-center p-2 rounded-lg border border-tech-purple/50 bg-tech-purple/10 hover:bg-tech-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"><span className="text-xs text-gray-400 mb-1">60%</span><span className="text-sm font-bold text-white mb-1">{optionHigh}</span><span className="text-[10px] text-neon-green group-hover:underline">+{optionHigh / 10}⚡</span></button>
                              <button onClick={() => handleExchangeCrypto(optionMid)} disabled={optionMid <= 0} className="flex flex-col items-center justify-center p-2 rounded-lg border border-tech-purple/50 bg-tech-purple/10 hover:bg-tech-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"><span className="text-xs text-gray-400 mb-1">30%</span><span className="text-sm font-bold text-white mb-1">{optionMid}</span><span className="text-[10px] text-neon-green group-hover:underline">+{optionMid / 10}⚡</span></button>
                              <button onClick={() => handleExchangeCrypto(optionLow)} disabled={optionLow <= 0} className="flex flex-col items-center justify-center p-2 rounded-lg border border-tech-purple/50 bg-tech-purple/10 hover:bg-tech-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"><span className="text-xs text-gray-400 mb-1">10%</span><span className="text-sm font-bold text-white mb-1">{optionLow}</span><span className="text-[10px] text-neon-green group-hover:underline">+{optionLow / 10}⚡</span></button>
                          </div>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                          <h4 className="font-tech font-bold text-gray-300 mb-3 flex items-center gap-2 text-sm md:text-base"><ShoppingBag size={18} className="text-neon-green" /> Inyección Manual</h4>
                          <div className="flex gap-2"><input type="text" placeholder="Ingresar Código" className="flex-1 bg-black/40 border border-slate-600 rounded p-2 focus:border-tech-cyan outline-none transition-colors text-sm text-white font-mono" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} /><button onClick={handleRedeemCode} className="bg-neon-green/20 border border-neon-green text-neon-green px-4 py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-neon-green hover:text-black transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]">EJECUTAR</button></div>
                          <button onClick={handleShareGame} className="w-full mt-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/50 hover:border-blue-400 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-xs md:text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all group"><Share2 size={18} className="text-blue-400 group-hover:text-white transition-colors" />COMPARTIR JUEGO (+100⚡)</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SELECCION ENTIDAD - DETALLES */}
      {((selectedEntity && !isChatOpen) || groupSelectionCount > 1) && (
        <div className="pointer-events-auto absolute left-4 md:left-24 bottom-24 md:bottom-24 w-[calc(100%-2rem)] md:w-80 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700 p-4 md:p-5 z-40">
            <button onClick={onCloseSelection} className="absolute top-2 right-2 text-gray-500 hover:text-alert-red transition-colors"><X size={18} /></button>
            {groupSelectionCount > 1 ? (
                <div className="flex flex-col">
                    <div className="flex items-center gap-4 mb-4 border-b border-slate-700 pb-2"><div className="w-12 h-12 rounded-lg border border-white/30 bg-slate-800 flex items-center justify-center"><Users size={24} className="text-white" /></div><div><h3 className="font-tech font-bold text-lg text-white tracking-wide">COMANDO GRUPAL</h3><p className="text-xs text-tech-cyan font-mono uppercase tracking-widest">{groupSelectionCount} UNIDADES</p></div></div>
                    <div className="grid grid-cols-2 gap-2 mb-4"><div className="bg-slate-800/50 p-2 rounded border border-slate-700"><span className="text-red-400 font-bold font-mono block text-xs">ALFA (M)</span><span className="text-white text-lg font-tech">{groupAlfas}</span></div><div className="bg-slate-800/50 p-2 rounded border border-slate-700"><span className="text-orange-400 font-bold font-mono block text-xs">BETA (F)</span><span className="text-white text-lg font-tech">{groupBetas}</span></div></div>
                    <div className="space-y-2">
                        {groupAlfas > 0 && <button onClick={handleBulkAttack} className="w-full bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm"><Swords size={18} />ESCUADRÓN ALFA: ATACAR</button>}
                        {groupBetas > 0 && <button onClick={handleBulkMine} className="w-full bg-orange-600/20 border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white transition-all py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm"><Pickaxe size={18} />EQUIPO BETA: MINAR</button>}
                    </div>
                </div>
            ) : (
                selectedEntity && (
                    <>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border border-tech-cyan shadow-lg bg-slate-800 overflow-hidden relative ${selectedEntity.attributes?.estado === 'muerto' ? 'grayscale opacity-50' : ''}`}>
                                {selectedEntity.type === EntityType.PERSON ? <img src={selectedEntity.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-900">{selectedEntity.type === EntityType.BLOCK ? (selectedEntity.blockAttributes?.type === BlockType.FIREWALL ? <Shield size={32} className="text-gray-400" /> : <Lock size={32} className="text-yellow-600" />) : <HardDrive size={32} className="text-tech-cyan" />}</div>}
                                {selectedEntity.attributes?.estado !== 'muerto' && <div className="absolute bottom-0 left-0 w-full h-1 bg-tech-cyan animate-pulse" />}
                            </div>
                            <div><h3 className="font-tech font-bold text-lg md:text-xl text-white tracking-wide">{selectedEntity.type === EntityType.LAND ? (selectedEntity.landAttributes?.isGhost ? 'GHOST NODE' : 'DATA NODE') : selectedEntity.type === EntityType.BLOCK ? 'STRUCTURE' : selectedEntity.attributes?.nombre}</h3><p className="text-[10px] md:text-xs text-tech-cyan font-mono uppercase tracking-widest">{selectedEntity.type === EntityType.LAND ? `ID: ${selectedEntity.id.slice(0,6)}` : selectedEntity.type === EntityType.BLOCK ? selectedEntity.blockAttributes?.type : `${selectedEntity.attributes?.sexo} • v.${selectedEntity.attributes?.edad}.0`}</p></div>
                        </div>
                        {selectedEntity.type === EntityType.PERSON && selectedEntity.attributes && (
                            <div className="space-y-2 text-xs md:text-sm text-gray-300 font-mono mb-4">
                                <div className="flex justify-between border-b border-slate-700 pb-1"><span className="text-gray-500">Módulo:</span><span className="font-semibold text-tech-purple">{selectedEntity.attributes.personalidad}</span></div>
                                <div className="flex justify-between border-b border-slate-700 pb-1"><span className="text-gray-500 flex items-center gap-1"><Dna size={12}/> Evolución:</span><span className={`font-semibold ${selectedEntity.attributes.evolutionLevel > 1 ? 'text-yellow-400' : 'text-gray-400'}`}>Nivel {selectedEntity.attributes.evolutionLevel}</span></div>
                                <div className="flex justify-between border-b border-slate-700 pb-1"><span className="text-gray-500">Batería:</span><span className={`font-semibold ${selectedEntity.attributes.energia > 50 ? 'text-neon-green' : 'text-alert-red'}`}>{Math.round(selectedEntity.attributes.energia)}%</span></div>
                                <div className="flex justify-between border-b border-slate-700 pb-1"><span className="text-gray-500">Output:</span><span className="font-semibold text-tech-cyan flex items-center gap-1"><BarChart3 size={14} /> {Math.floor(selectedEntity.attributes.individualScore)}</span></div>
                                <div className="flex justify-between border-b border-slate-700 pb-1"><span className="text-gray-500">Estado:</span><span className="font-semibold capitalize flex items-center gap-1">{selectedEntity.attributes.estado === 'muerto' ? <span className="text-pink-600 animate-pulse font-bold">FALLO CRÍTICO</span> : <span className="text-blue-400">{selectedEntity.attributes.estado}</span>}{selectedEntity.attributes.estado === 'trabajando' && timeLeft !== null && <span className="text-orange-400 font-bold ml-1 flex items-center"><Clock size={12} className="mr-1"/> {timeLeft}s</span>}</span></div>
                            </div>
                        )}
                        {selectedEntity.type === EntityType.PERSON && selectedEntity.attributes?.estado !== 'muerto' && (
                            <div className="flex flex-col gap-2">
                                <button onClick={openChat} className="w-full bg-slate-800 border border-slate-600 text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-tech-cyan/10 hover:border-tech-cyan text-xs font-mono font-bold"><MessageCircle size={16} /><span>CONSOLA</span></button>
                                {selectedEntity.attributes.sexo === Gender.FEMALE ? (
                                    <button onClick={() => handleWorkProtocol(selectedEntity.id)} className="w-full bg-orange-600/20 border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm"><Pickaxe size={18} />MINAR (-{ACTION_COST})</button>
                                ) : (
                                    <button onClick={() => handleAttackProtocol(selectedEntity.id)} className="w-full bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold font-tech tracking-wider text-sm"><Swords size={18} />ATACAR</button>
                                )}
                            </div>
                        )}
                    </>
                )
            )}
        </div>
      )}

      {/* DOCK LATERAL - COMANDOS */}
      <div className="pointer-events-auto absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 z-30"> 
          <div className="relative group">
              <button onClick={() => setActiveMenu(activeMenu === 'actions' ? null : 'actions')} className={`w-14 h-14 md:w-16 md:h-16 bg-slate-900 border-2 ${activeMenu === 'actions' ? 'border-tech-cyan shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'border-slate-600 hover:border-white'} rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105`}><Bot size={32} className={`${activeMenu === 'actions' ? 'text-tech-cyan' : 'text-gray-300'}`} /><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-tech-cyan rounded-full border-2 border-slate-900" /></button>
              {activeMenu === 'actions' && (
                  <div className="absolute left-full top-0 ml-3 bg-slate-900/95 backdrop-blur-xl p-2 rounded-xl border border-tech-cyan/30 shadow-2xl flex flex-col gap-1 animate-pop-in min-w-[180px]">
                      <button onClick={() => { setModalOpen(true); setActiveMenu(null); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"><div className="p-2 bg-tech-cyan/20 rounded text-tech-cyan"><Cpu size={20}/></div><span className="text-sm font-bold">Crear BioBot</span></button>
                      <button onClick={() => checkManaAndExecute(() => { onAction('CREATE_LAND'); setActiveMenu(null); }, GAME_CONFIG.COSTS.NEW_LAND)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"><div className="p-2 bg-neon-green/20 rounded text-neon-green"><Database size={20}/></div><span className="text-sm font-bold">Nuevo Nodo</span></button>
                  </div>
              )}
          </div>
          <div className="relative group">
              <button onClick={() => setActiveMenu(activeMenu === 'system' ? null : 'system')} className={`w-14 h-14 md:w-16 md:h-16 bg-slate-900 border-2 ${activeMenu === 'system' ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]' : 'border-slate-600 hover:border-white'} rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105`}><Settings size={32} className={`${activeMenu === 'system' ? 'text-yellow-500' : 'text-gray-300'}`} /><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-slate-900" /></button>
              {activeMenu === 'system' && (
                  <div className="absolute left-full top-0 ml-3 bg-slate-900/95 backdrop-blur-xl p-2 rounded-xl border border-yellow-500/30 shadow-2xl flex flex-col gap-1 animate-pop-in min-w-[180px]">
                      <button onClick={() => { togglePause(); setActiveMenu(null); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"><div className={`p-2 rounded ${isPaused ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>{isPaused ? <Play size={20}/> : <Pause size={20}/>}</div><span className="text-sm font-bold">{isPaused ? "Reanudar" : "Pausar"}</span></button>
                      <button onClick={handleManualSave} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"><div className="p-2 bg-blue-500/20 rounded text-blue-400"><Save size={20}/></div><span className="text-sm font-bold">Guardar</span></button>
                      <button onClick={() => { onRestart(); setActiveMenu(null); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors w-48"><div className="p-2 bg-orange-500/20 rounded text-orange-500"><RotateCcw size={20}/></div><span className="text-sm font-bold">Reiniciar</span></button>
                      <button onClick={() => { onExit(); setActiveMenu(null); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/30 text-red-400 transition-colors w-48 border border-red-900/50"><div className="p-2 bg-red-500/10 rounded text-red-500"><LogOut size={20}/></div><span className="text-sm font-bold">Salir</span></button>
                  </div>
              )}
          </div>
      </div>

      {isCreationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
            <div className="bg-slate-900 rounded-xl p-6 md:p-8 w-full max-w-sm shadow-[0_0_50px_rgba(6,182,212,0.2)] border border-tech-cyan/50">
                <h3 className="font-tech text-xl md:text-2xl font-bold mb-6 text-center text-white tracking-widest uppercase flex items-center justify-center gap-2"><Cpu size={24} className="text-tech-cyan"/> Génesis de BioBot</h3>
                <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-gray-400 mb-1 font-mono">Tipo de Unidad</label><div className="flex gap-2"><button onClick={() => setCreationGender(Gender.MALE)} className={`flex-1 py-3 rounded border transition-all text-sm font-mono ${creationGender === Gender.MALE ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-gray-500'}`}><div className="flex flex-col items-center"><span className="font-bold">ALFA (M)</span><span className="text-[10px] uppercase opacity-70">Guardián</span></div></button><button onClick={() => setCreationGender(Gender.FEMALE)} className={`flex-1 py-3 rounded border transition-all text-sm font-mono ${creationGender === Gender.FEMALE ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-slate-800 border-slate-700 text-gray-500'}`}><div className="flex flex-col items-center"><span className="font-bold">BETA (F)</span><span className="text-[10px] uppercase opacity-70">Minero</span></div></button></div></div>
                    <div><label className="block text-sm font-bold text-gray-400 mb-1 font-mono">Identificador (Opcional)</label><input type="text" className="w-full bg-black/40 border border-slate-700 rounded p-3 text-white focus:border-tech-cyan outline-none transition-colors font-mono" placeholder="Ej: Unit-734" value={creationName} onChange={(e) => setCreationName(e.target.value)} /></div>
                    <div className="pt-2 flex gap-3"><button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-lg border border-slate-600 text-gray-400 hover:text-white hover:bg-slate-800 transition-all font-bold font-mono">CANCELAR</button><button onClick={handleCreatePerson} className="flex-1 py-3 rounded-lg bg-tech-cyan text-black font-bold font-tech hover:bg-cyan-400 transition-all">INICIAR GÉNESIS (-{GAME_CONFIG.COSTS.NEW_BIOBOT}⚡)</button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}