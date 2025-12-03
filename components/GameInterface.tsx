import React, { useState, useRef, useEffect } from 'react';
import { PlayerState, GameEntity, Gender, INITIAL_POINTS, ACTION_COST, EntityType } from '../types';
import { Bot, Database, Zap, Pickaxe, X, MessageCircle, Send, User, Trophy, Activity, Clock, MapPin, ShoppingBag, CheckCircle, BarChart3, Battery, Skull, Fingerprint, Crosshair, Cpu, AlertTriangle, HardDrive, LogOut, RotateCcw } from 'lucide-react';
import { createPersonJSON } from '../services/gameService';
import { GAME_CONFIG } from '../gameConfig';
import { LiveConsole } from './LiveConsole';
import { Minimap } from './Minimap';

interface GameInterfaceProps {
  player: PlayerState;
  entities: GameEntity[]; 
  onAction: (actionType: string, payload?: any) => void;
  selectedEntity: GameEntity | null;
  onCloseSelection: () => void;
  wastedManaTrigger: number;
  isPlacingLand?: boolean;
  isPlacingPerson?: boolean;
  onBuyMana: (amount: number) => void;
  globalStats: {
      globalScore: number;
      averageEnergy: number;
  };
  onExit: () => void;
  onRestart: () => void;
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
    isPlacingLand,
    isPlacingPerson,
    onBuyMana,
    globalStats,
    onExit,
    onRestart
}) => {
  const [isCreationModalOpen, setModalOpen] = useState(false);
  const [creationGender, setCreationGender] = useState<Gender>(Gender.MALE);
  const [creationName, setCreationName] = useState('');
  
  // Toast States
  const [showManaToast, setShowManaToast] = useState(false);
  const [showWastedToast, setShowWastedToast] = useState(false);
  const [showSuccessMana, setShowSuccessMana] = useState(false);
  const [showKillToast, setShowKillToast] = useState(false);
  const [showNoBotsToast, setShowNoBotsToast] = useState(false); // NEW TOAST

  // Player Profile Modal
  const [isPlayerProfileOpen, setPlayerProfileOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  // Chat State
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Work Timer State for Selected Entity
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Reset chat when selection changes
  useEffect(() => {
    if (!selectedEntity) {
        setChatOpen(false);
        setChatMessages([]);
    }
  }, [selectedEntity]);

  useEffect(() => {
    if (wastedManaTrigger > 0) {
        setShowWastedToast(true);
        setTimeout(() => setShowWastedToast(false), 3000);
    }
  }, [wastedManaTrigger]);

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
          updateTimer(); // Immediate
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

  const handleCreatePerson = () => {
    checkManaAndExecute(() => {
        const attributes = createPersonJSON(creationGender, creationName || undefined);
        onAction('CREATE_PERSON', attributes);
        setModalOpen(false);
        setCreationName('');
    });
  };

  const handleWorkProtocol = () => {
      // Validate biobots existence AND ensure they are alive
      const activeBots = entities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto');
      
      if (activeBots.length === 0) {
          setShowNoBotsToast(true);
          setTimeout(() => setShowNoBotsToast(false), 3000);
          return; // Do NOT execute action, do NOT spend mana
      }

      checkManaAndExecute(() => onAction('CREATE_WORK'));
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

  const closeChat = (e: React.MouseEvent) => {
      e.stopPropagation();
      setChatOpen(false);
  };

  // Helper to count active bots for profile
  const activeBiobotsCount = entities.filter(e => e.type === EntityType.PERSON && e.attributes?.estado !== 'muerto').length;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20 font-sans">
      
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

      {/* Toast Notification for Success Mana Purchase */}
      {showSuccessMana && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-neon-green/20 backdrop-blur-md text-neon-green px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-neon-green w-max max-w-[90vw] whitespace-normal text-center">
            <CheckCircle size={18} className="shrink-0" />
            <span className="font-mono font-bold text-xs md:text-sm">RECARGA EXITOSA +100</span>
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

      {/* Top Bar Wrapper - Responsive */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between pointer-events-auto w-full gap-3 md:gap-0">
        
        {/* Left: Player Profile & Energy */}
        <div 
            onClick={() => setPlayerProfileOpen(true)}
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

        {/* Right: Global Stats Group */}
        <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
             {/* Global Crypto Stat */}
             <div className="bg-panel-dark backdrop-blur-md rounded-xl shadow-lg p-2 md:p-3 flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[120px] border border-tech-purple/30 h-14 md:h-16 group hover:border-tech-purple/60 transition-colors">
                 <span className="text-[9px] md:text-[10px] text-tech-purple font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                     <Trophy size={10} /> CRIPTOMONEDAS
                 </span>
                 <span className="text-base md:text-xl font-tech font-bold text-white leading-tight drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]">
                     {globalStats.globalScore.toLocaleString()}
                 </span>
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

      {/* Player Profile Modal */}
      {isPlayerProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
              <div className="bg-slate-900 rounded-2xl p-6 md:p-8 w-full max-w-[400px] shadow-[0_0_40px_rgba(6,182,212,0.15)] border border-tech-cyan/50 relative overflow-y-auto max-h-[90vh]">
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
                      
                      {/* Shop Section */}
                      <div className="pt-4 border-t border-slate-700">
                          <h4 className="font-tech font-bold text-gray-300 mb-3 flex items-center gap-2 text-sm md:text-base">
                             <ShoppingBag size={18} className="text-tech-purple" /> Inyección de Recursos
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
                                className="bg-tech-purple/20 border border-tech-purple text-tech-purple px-4 py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-tech-purple hover:text-white transition-all shadow-[0_0_10px_rgba(139,92,246,0.2)]"
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
      {selectedEntity && selectedEntity.attributes && !isChatOpen && (
        <div className="pointer-events-auto absolute left-4 md:left-24 bottom-24 md:bottom-24 w-[calc(100%-2rem)] md:w-80 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700 p-4 md:p-5 z-40">
            <button onClick={onCloseSelection} className="absolute top-2 right-2 text-gray-500 hover:text-alert-red transition-colors">
                <X size={18} />
            </button>
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border border-tech-cyan shadow-lg bg-slate-800 overflow-hidden relative ${selectedEntity.attributes.estado === 'muerto' ? 'grayscale opacity-50' : ''}`}>
                     <img src={selectedEntity.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                     {selectedEntity.attributes.estado !== 'muerto' && (
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-tech-cyan animate-pulse" />
                     )}
                </div>
                <div>
                    <h3 className="font-tech font-bold text-lg md:text-xl text-white tracking-wide">{selectedEntity.attributes.nombre}</h3>
                    <p className="text-[10px] md:text-xs text-tech-cyan font-mono uppercase tracking-widest">{selectedEntity.attributes.sexo} • v.{selectedEntity.attributes.edad}.0</p>
                </div>
            </div>
            
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

            <div className="flex gap-2">
                <button 
                    onClick={openChat}
                    disabled={selectedEntity.attributes.estado === 'muerto'}
                    className="flex-1 bg-slate-800 border border-slate-600 text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-tech-cyan/10 hover:border-tech-cyan hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm font-mono"
                >
                    <MessageCircle size={16} />
                    <span>CONSOLA</span>
                </button>

                {GAME_CONFIG.DEATH.ENABLE_MANUAL_KILL && selectedEntity.attributes.estado !== 'muerto' && (
                    <button 
                        onClick={handleKill}
                        className="w-10 bg-alert-red/10 border border-alert-red/50 text-alert-red rounded-lg flex items-center justify-center hover:bg-alert-red hover:text-white transition-all"
                        title="Terminar Proceso"
                    >
                        <Skull size={18} />
                    </button>
                )}
            </div>
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

      {/* LEFT Vertical Toolbar (HUD) - REDESIGNED */}
      <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
          <div className="flex flex-col gap-3 bg-slate-900/80 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl">
            {/* Create Person Button - Bot Icon */}
            <div className="relative group shrink-0">
                <button 
                    onClick={() => checkManaAndExecute(() => setModalOpen(true))}
                    disabled={isPlacingLand || isPlacingPerson}
                    className={`w-10 h-10 md:w-11 md:h-11 rounded-lg border flex items-center justify-center transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${isPlacingPerson ? 'bg-tech-cyan text-black border-white animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'bg-slate-800 border-tech-cyan/40 text-tech-cyan hover:bg-tech-cyan hover:text-black hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}
                    title="Génesis BioBot"
                >
                    <Bot size={20} />
                </button>
            </div>

            {/* Create Land - Database Icon */}
            <div className="relative group shrink-0">
                <button 
                    onClick={() => checkManaAndExecute(() => onAction('CREATE_LAND'))}
                    disabled={isPlacingPerson}
                    className={`w-10 h-10 md:w-11 md:h-11 rounded-lg border flex items-center justify-center transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${isPlacingLand ? 'bg-neon-green text-black border-white animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.8)]' : 'bg-slate-800 border-neon-green/40 text-neon-green hover:bg-neon-green hover:text-black hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}
                    title="Crear Nodo de Datos"
                >
                    <Database size={20} />
                </button>
            </div>

            {/* Rain (Energy Charge) - Zap Icon */}
            <div className="relative group shrink-0">
                <button 
                    onClick={() => checkManaAndExecute(() => onAction('CREATE_RAIN'))}
                    disabled={isPlacingLand || isPlacingPerson}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-slate-800 border border-blue-500/40 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    title="Carga Energética"
                >
                    <Zap size={20} />
                </button>
            </div>

            {/* Work (Mine) - Pickaxe Icon */}
            <div className="relative group shrink-0">
                <button 
                    onClick={handleWorkProtocol}
                    disabled={isPlacingLand || isPlacingPerson}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-slate-800 border border-orange-500/40 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    title="Minar Criptomonedas"
                >
                    <Pickaxe size={20} />
                </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/20 w-full my-1" />

             {/* System Controls: Restart */}
             <div className="relative group shrink-0">
                <button 
                    onClick={onRestart}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-slate-800 border border-yellow-500/30 flex items-center justify-center text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110"
                    title="Reiniciar Simulación"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

             {/* System Controls: Exit */}
             <div className="relative group shrink-0">
                <button 
                    onClick={onExit}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-slate-800 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} />
                </button>
            </div>
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
                                className={`flex-1 py-3 rounded border transition-all text-sm md:text-base font-mono ${creationGender === Gender.MALE ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-800 border-slate-700 text-gray-500 hover:border-blue-500/50'}`}
                            >
                                ALFA (M)
                            </button>
                            <button 
                                onClick={() => setCreationGender(Gender.FEMALE)}
                                className={`flex-1 py-3 rounded border transition-all text-sm md:text-base font-mono ${creationGender === Gender.FEMALE ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-slate-800 border-slate-700 text-gray-500 hover:border-pink-500/50'}`}
                            >
                                BETA (F)
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