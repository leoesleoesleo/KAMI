
import React, { useEffect, useState, useRef } from 'react';
import { Logger } from '../services/LoggerService';
import { LogEvent, EventSeverity } from '../types';
import { ChevronDown, ChevronRight, Terminal, Minimize2, Maximize2 } from 'lucide-react';

export const LiveConsole: React.FC = () => {
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [isCollapsed, setIsCollapsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load initial logs
        setLogs(Logger.getRecentLogs());

        // Subscribe to new logs
        const unsubscribe = Logger.subscribe((newEvent) => {
            setLogs(prev => [...prev, newEvent]);
        });

        return () => unsubscribe();
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current && !isCollapsed) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isCollapsed]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getSeverityColor = (severity: EventSeverity) => {
        switch (severity) {
            case EventSeverity.CRITICAL: return 'text-red-500 font-bold';
            case EventSeverity.WARNING: return 'text-yellow-500';
            case EventSeverity.INFO: return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-black/90 border-t border-divine-gold/30 font-mono text-xs z-[40] transition-all duration-300 flex flex-col ${isCollapsed ? 'h-8' : 'h-48'}`}>
            
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a1a] border-b border-gray-800 select-none cursor-pointer hover:bg-[#252525]" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2 text-divine-gold">
                    <Terminal size={14} />
                    <span className="font-bold tracking-wider">KAMI-LOG LIVE STREAM</span>
                    <span className="text-gray-500 ml-2">({logs.length} events)</span>
                </div>
                <div className="text-gray-400">
                    {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </div>
            </div>

            {/* Content Area */}
            {!isCollapsed && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {logs.length === 0 && (
                        <div className="text-gray-600 italic px-2">Esperando eventos del sistema...</div>
                    )}
                    
                    {logs.map((log) => {
                        const isExpanded = expandedIds.has(log.id);
                        return (
                            <div key={log.id} className="group">
                                {/* Log Line */}
                                <div 
                                    className="flex items-start gap-2 hover:bg-white/5 p-1 rounded cursor-pointer"
                                    onClick={() => toggleExpand(log.id)}
                                >
                                    <span className="text-gray-500 min-w-[60px]">{formatTime(log.timestamp)}</span>
                                    
                                    <span className={`min-w-[70px] ${getSeverityColor(log.severity)}`}>
                                        [{log.severity}]
                                    </span>
                                    
                                    <span className="text-purple-400 min-w-[140px] truncate font-semibold">
                                        {log.type}
                                    </span>

                                    <div className="flex-1 text-gray-300 truncate opacity-90">
                                        {/* Brief Preview of Payload */}
                                        {JSON.stringify(log.payload).substring(0, 80)}
                                        {JSON.stringify(log.payload).length > 80 ? '...' : ''}
                                    </div>

                                    <div className="text-gray-600">
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                </div>

                                {/* Expanded JSON Detail */}
                                {isExpanded && (
                                    <div className="pl-24 pr-4 py-2 text-gray-400">
                                        <pre className="text-[10px] bg-[#111] p-2 rounded border border-gray-800 overflow-x-auto">
                                            {JSON.stringify(log.payload, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
