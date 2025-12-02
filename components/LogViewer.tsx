
import React, { useEffect, useState } from 'react';
import { Logger } from '../services/LoggerService';
import { X, RefreshCcw, Download } from 'lucide-react';

interface LogViewerProps {
    onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
    const [logData, setLogData] = useState<string>('Loading...');

    const refreshLogs = () => {
        setLogData(Logger.getFormattedJSON());
    };

    useEffect(() => {
        refreshLogs();
    }, []);

    const handleDownload = () => {
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kami-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0D1117] w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col border border-gray-800 font-mono text-sm">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#161B22] rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-4 text-green-400 font-bold tracking-wider">KAMI-LOG SYSTEM v1.0</span>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={refreshLogs} 
                            className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                            title="Refrescar"
                        >
                            <RefreshCcw size={18} />
                        </button>
                        <button 
                            onClick={handleDownload} 
                            className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                            title="Descargar JSON"
                        >
                            <Download size={18} />
                        </button>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-colors"
                            title="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* JSON Content */}
                <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    <pre className="text-gray-300 leading-relaxed">
                        <code dangerouslySetInnerHTML={{ 
                            __html: syntaxHighlight(logData) 
                        }} />
                    </pre>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-800 bg-[#161B22] text-xs text-gray-500 flex justify-between rounded-b-xl">
                    <span>STATUS: ACTIVE RECORDING</span>
                    <span>BUFFER: {JSON.parse(logData).shortTermMemory?.length || 0} / 300 EVENTS</span>
                </div>
            </div>
        </div>
    );
};

// Helper for Syntax Highlighting
const syntaxHighlight = (json: string) => {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-purple-400'; // number
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-blue-400 font-bold'; // key
            } else {
                cls = 'text-green-400'; // string
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-orange-400'; // boolean
        } else if (/null/.test(match)) {
            cls = 'text-gray-500'; // null
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};
