
import React, { useState, useRef, useEffect } from 'react';
import { PlayerState, GameEntity, Gender, INITIAL_POINTS, ACTION_COST } from '../types';
import { Plus, CloudRain, Sprout, Hammer, X, Zap, MessageCircle, Send, User, Trophy, Activity, Clock, MapPin, ShoppingBag, CheckCircle, BarChart3, Battery, Skull } from 'lucide-react';
import { createPersonJSON } from '../services/gameService';
import { GAME_CONFIG } from '../gameConfig';
import { LiveConsole } from './LiveConsole';

interface GameInterfaceProps {
  player: PlayerState;
  entities: GameEntity[]; 
  onAction: (actionType: string, payload?: any) => void;
  selectedEntity: GameEntity | null;
  onCloseSelection: () => void;
  wastedManaTrigger: number;
  isPlacingLand?: boolean;
  onBuyMana: (amount: number) => void;
  globalStats: {
      globalScore: number;
      averageEnergy: number;
  };
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
    onBuyMana,
    globalStats
}) => {
  const [isCreationModalOpen, setModalOpen] = useState(false);
  const [creationGender, setCreationGender] = useState<Gender>(Gender.MALE);
  const [creationName, setCreationName] = useState('');
  
  // Toast States
  const [showManaToast, setShowManaToast] = useState(false);
  const [showWastedToast, setShowWastedToast] = useState(false);
  const [showSuccessMana, setShowSuccessMana] = useState(false);
  const [showKillToast, setShowKillToast] = useState(false);

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

  // Reset chat when selection changes (but not when just toggling views)
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

  const handleRedeemCode = () => {
      if (redeemCode === '1866') {
          onBuyMana(100);
          setRedeemCode('');
          setPlayerProfileOpen(false);
          setShowSuccessMana(true);
          setTimeout(() => setShowSuccessMana(false), 3000);
      } else {
          alert("Código inválido");
      }
  };

  const openChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (selectedEntity?.attributes?.estado === 'muerto') return;
    
    setChatOpen(true);
    
    if (chatMessages.length === 0 && selectedEntity) {
        const greeting = selectedEntity.attributes?.sexo === Gender.MALE 
            ? "Sistemas en línea. Esperando instrucciones, Creador."
            : "Conexión establecida. ¿En qué puedo servirte hoy?";
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
        let reply = "Procesando...";
        if (selectedEntity) {
            const personality = selectedEntity.attributes?.personalidad || 'Neutral';
            if (userText.toLowerCase().includes('hola')) {
                reply = `Saludos. Mi estado actual es ${selectedEntity.attributes?.estado}.`;
            } else if (userText.toLowerCase().includes('trabaja')) {
                reply = "Entendido. Buscaré una tarea productiva de inmediato.";
            } else {
                if (personality === 'Lógico') reply = "Análisis completado. Los parámetros son aceptables.";
                else if (personality === 'Curioso') reply = "¿Es esa la voluntad del cosmos? Interesante...";
                else if (personality === 'Protector') reply = "Mantendré la seguridad del perímetro.";
                else reply = "Recibido. Transmisión guardada en mi memoria central.";
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
        
        // Close modal immediately to show result on canvas
        onCloseSelection();
    }
  };

  const closeChat = (e: React.MouseEvent) => {
      e.stopPropagation();
      setChatOpen(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20">
      
      {/* Placement Mode Toast */}
      {isPlacingLand && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-divine-gold text-modern-dark px-8 py-4 rounded-full shadow-2xl animate-pulse flex items-center gap-3 z-[60] pointer-events-auto border-2 border-white/50">
            <MapPin size={24} className="animate-bounce" />
            <span className="font-serif font-bold text-lg">Haz CLICK en el mapa para crear Tierra</span>
        </div>
      )}

      {/* Toast Notification for Mana */}
      {showManaToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto">
            <X size={20} />
            <span className="font-bold">¡No tienes suficiente Maná!</span>
        </div>
      )}

      {/* Toast Notification for Success Mana Purchase */}
      {showSuccessMana && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border-2 border-white">
            <CheckCircle size={20} />
            <span className="font-bold">¡Ofrenda Recibida! +100 Maná</span>
        </div>
      )}

      {/* Toast Notification for Wasted Mana */}
      {showWastedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border-2 border-red-800">
            <Activity size={20} />
            <span className="font-bold">¡MANÁ DESPERDICIADO! No hay tierra fértil.</span>
        </div>
      )}

      {/* Toast Notification for Kill */}
      {showKillToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-red-500 px-6 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 z-[60] pointer-events-auto border border-red-500">
            <Skull size={20} />
            <span className="font-bold">Unidad Terminada (Congelada)</span>
        </div>
      )}

      {/* Top Bar Wrapper */}
      <div className="flex items-start justify-between pointer-events-auto w-full">
        {/* Left: Player Profile */}
        <div 
            onClick={() => setPlayerProfileOpen(true)}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-3 flex items-center gap-4 border border-divine-gold/30 cursor-pointer hover:bg-white transition-colors"
        >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-divine-gold">
                <img src={player.avatarUrl} alt="God Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
                <h2 className="font-serif font-bold text-modern-dark">{player.name}</h2>
                <div className="flex items-center gap-1 text-divine-gold font-bold">
                    <Zap size={16} fill="currentColor" />
                    <span>{player.points} Maná</span>
                </div>
            </div>
        </div>

        {/* Right: Global Stats Group */}
        <div className="flex gap-3">
             {/* Global Production Stat */}
             <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-3 flex flex-col items-center justify-center min-w-[120px] border border-divine-gold/30 h-16">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                     <Trophy size={12} className="text-divine-gold" /> Producción
                 </span>
                 <span className="text-xl font-serif font-bold text-modern-dark">
                     {globalStats.globalScore.toLocaleString()}
                 </span>
            </div>

            {/* Average Energy Stat */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-3 flex flex-col items-center justify-center min-w-[120px] border border-divine-gold/30 h-16">
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                     <Battery size={12} className={globalStats.averageEnergy > 50 ? "text-green-500" : "text-red-500"} /> Energía Vital
                 </span>
                 <span className={`text-xl font-serif font-bold ${globalStats.averageEnergy > 70 ? 'text-green-600' : globalStats.averageEnergy > 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                     {globalStats.averageEnergy}%
                 </span>
            </div>
        </div>
      </div>

      {/* Player Profile Modal */}
      {isPlayerProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
              <div className="bg-white rounded-3xl p-8 w-[400px] shadow-2xl border-2 border-divine-gold relative overflow-y-auto max-h-[90vh]">
                  <button onClick={() => setPlayerProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                      <X size={24} />
                  </button>
                  <div className="flex flex-col items-center mb-6">
                      <div className="w-24 h-24 rounded-full border-4 border-divine-gold mb-4 overflow-hidden shadow-lg">
                          <img src={player.avatarUrl} className="w-full h-full object-cover" />
                      </div>
                      <h2 className="text-3xl font-serif font-bold text-modern-dark">{player.name}</h2>
                      <p className="text-divine-gold font-bold tracking-widest uppercase text-sm">Deidad Suprema</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3 text-gray-600">
                              <User size={20} />
                              <span>Bio-Bots Creados</span>
                          </div>
                          <span className="font-bold text-xl">{player.stats.entitiesCreated}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3 text-gray-600">
                              <Sprout size={20} />
                              <span>Tierras Creadas</span>
                          </div>
                          <span className="font-bold text-xl">{player.stats.landsCreated}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3 text-gray-600">
                              <Zap size={20} />
                              <span>Maná Consumido</span>
                          </div>
                          <span className="font-bold text-xl text-divine-gold">{player.stats.manaSpent}</span>
                      </div>
                      
                      {/* Shop Section */}
                      <div className="pt-4 border-t border-gray-100">
                          <h4 className="font-serif font-bold text-gray-800 mb-2 flex items-center gap-2">
                             <ShoppingBag size={18} /> Ofrendas & Códigos
                          </h4>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Código de Regalo" 
                                className="flex-1 border border-gray-300 rounded p-2 focus:border-divine-gold outline-none transition-colors"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value)}
                              />
                              <button 
                                onClick={handleRedeemCode}
                                className="bg-divine-gold text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-600 transition-colors shadow-md"
                              >
                                  Canjear
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Selected Entity Modal (Bottom Left) */}
      {selectedEntity && selectedEntity.attributes && !isChatOpen && (
        <div className="pointer-events-auto absolute left-6 bottom-52 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-5 animate-[float_4s_ease-in-out_infinite] z-40">
            <button onClick={onCloseSelection} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <X size={18} />
            </button>
            <div className="flex items-center gap-4 mb-4">
                <img src={selectedEntity.avatarUrl} alt="Avatar" className={`w-16 h-16 rounded-full border-2 border-divine-gold shadow-md bg-gray-100 ${selectedEntity.attributes.estado === 'muerto' ? 'grayscale' : ''}`} />
                <div>
                    <h3 className="font-serif font-bold text-xl text-modern-dark">{selectedEntity.attributes.nombre}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{selectedEntity.attributes.sexo} • Ciclo {selectedEntity.attributes.edad}</p>
                </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-700 font-sans mb-4">
                <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>Clase:</span>
                    <span className="font-semibold">{selectedEntity.attributes.personalidad}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>Energía:</span>
                    <span className={`font-semibold ${selectedEntity.attributes.energia > 50 ? 'text-green-600' : 'text-red-600'}`}>{Math.round(selectedEntity.attributes.energia)}%</span>
                </div>
                {/* Individual Score Display */}
                <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>Puntos:</span>
                    <span className="font-semibold text-divine-gold flex items-center gap-1">
                        <BarChart3 size={14} /> {Math.floor(selectedEntity.attributes.individualScore)}
                    </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>Actividad:</span>
                    <span className="font-semibold capitalize flex items-center gap-1">
                        {/* Status Check for Frozen State */}
                        {selectedEntity.attributes.estado === 'muerto' ? (
                            <span className="text-pink-600 animate-pulse font-bold">Muriendo</span>
                        ) : (
                            <span className="text-blue-600">{selectedEntity.attributes.estado}</span>
                        )}

                        {selectedEntity.attributes.estado === 'trabajando' && timeLeft !== null && (
                            <span className="text-red-500 font-bold ml-1 flex items-center">
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
                    className="flex-1 bg-modern-dark text-ethereal-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                </button>

                {GAME_CONFIG.DEATH.ENABLE_MANUAL_KILL && selectedEntity.attributes.estado !== 'muerto' && (
                    <button 
                        onClick={handleKill}
                        className="w-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                        title="Matar Bio-Bot"
                    >
                        <Skull size={18} />
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && selectedEntity && (
        <div className="pointer-events-auto absolute left-6 bottom-52 w-80 h-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-divine-gold/50 flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="p-3 bg-modern-dark text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden">
                        <img src={selectedEntity.avatarUrl} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-serif font-bold">{selectedEntity.attributes?.nombre}</span>
                </div>
                <button onClick={closeChat}><X size={18} /></button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-divine-gold text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-white flex gap-2">
                <input 
                    type="text" 
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-gray-100 rounded-full px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-divine-gold"
                />
                <button 
                    onClick={handleSendMessage}
                    className="bg-modern-dark text-divine-gold p-2 rounded-full hover:bg-black transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
      )}

      {/* Bottom Bar: Actions */}
      <div className="pointer-events-auto flex justify-center gap-4 pb-4 absolute bottom-[200px] left-0 right-0 z-30 pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
            {/* Create Person Button */}
            <div className="relative group">
                <button 
                    onClick={() => checkManaAndExecute(() => setModalOpen(true))}
                    disabled={isPlacingLand}
                    className="w-16 h-16 rounded-full bg-ethereal-white border-2 border-divine-gold shadow-lg flex items-center justify-center text-divine-gold hover:bg-divine-gold hover:text-white transition-all transform hover:-translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={32} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Crear Especie (-{ACTION_COST})
                </span>
            </div>

            {/* Create Land */}
            <div className="relative group">
                <button 
                    onClick={() => checkManaAndExecute(() => onAction('CREATE_LAND'))}
                    className={`w-16 h-16 rounded-full border-2 shadow-lg flex items-center justify-center transition-all transform hover:-translate-y-2 ${isPlacingLand ? 'bg-green-600 text-white border-green-700 animate-pulse' : 'bg-ethereal-white border-green-500 text-green-600 hover:bg-green-500 hover:text-white'}`}
                >
                    <Sprout size={32} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Tierra Fértil (-{ACTION_COST})
                </span>
            </div>

            {/* Rain (Watering) */}
            <div className="relative group">
                <button 
                    onClick={() => checkManaAndExecute(() => onAction('CREATE_RAIN'))}
                    disabled={isPlacingLand}
                    className="w-16 h-16 rounded-full bg-ethereal-white border-2 border-blue-400 shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-400 hover:text-white transition-all transform hover:-translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CloudRain size={32} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Regar Cultivos (-{ACTION_COST})
                </span>
            </div>

            {/* Work */}
            <div className="relative group">
                <button 
                    onClick={() => checkManaAndExecute(() => onAction('CREATE_WORK'))}
                    disabled={isPlacingLand}
                    className="w-16 h-16 rounded-full bg-ethereal-white border-2 border-orange-400 shadow-lg flex items-center justify-center text-orange-500 hover:bg-orange-400 hover:text-white transition-all transform hover:-translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Hammer size={32} />
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Orden de Trabajo (-{ACTION_COST})
                </span>
            </div>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
            <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl border-t-4 border-divine-gold">
                <h3 className="font-serif text-2xl font-bold mb-6 text-center text-modern-dark">Génesis de Especie</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1">Tipo de Bio-Forma</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCreationGender(Gender.MALE)}
                                className={`flex-1 py-3 rounded-lg border transition-all ${creationGender === Gender.MALE ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-gray-200 hover:border-blue-400'}`}
                            >
                                Macho (Alpha)
                            </button>
                            <button 
                                onClick={() => setCreationGender(Gender.FEMALE)}
                                className={`flex-1 py-3 rounded-lg border transition-all ${creationGender === Gender.FEMALE ? 'bg-pink-600 border-pink-600 text-white shadow-md' : 'border-gray-200 hover:border-pink-400'}`}
                            >
                                Hembra (Beta)
                            </button>
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-bold text-gray-500 mb-1">Designación (Opcional)</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded p-2 focus:border-divine-gold outline-none"
                            placeholder="Ej: Unit-734"
                            value={creationName}
                            onChange={(e) => setCreationName(e.target.value)}
                         />
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCreatePerson}
                            className="flex-1 py-3 bg-divine-gold text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            Crear (-{ACTION_COST} Maná)
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* LIVE CONSOLE INTEGRATION */}
      <div className="pointer-events-auto relative z-50">
          <LiveConsole />
      </div>

    </div>
  );
};
