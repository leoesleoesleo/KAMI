
import { 
    KamiLogDatabase, 
    LogEvent, 
    LogSummary, 
    EventType, 
    EventCategory, 
    EventSeverity 
} from '../types';

type LogListener = (event: LogEvent) => void;

/**
 * KAMI-LOG Advanced Event Registration System
 * Singleton Service
 */
class LoggerService {
    private db: KamiLogDatabase;
    private static instance: LoggerService;
    private listeners: LogListener[] = [];

    // Config
    private readonly MAX_SHORT_TERM = 300;
    private readonly BATCH_SIZE = 200; // Amount to move to long term

    private constructor() {
        this.db = {
            metadata: {
                version: "1.0.0",
                sessionId: this.generateSessionId(),
                createdAt: Date.now()
            },
            shortTermMemory: [],
            longTermMemory: []
        };
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    /**
     * Subscribe to real-time log events.
     * Returns an unsubscribe function.
     */
    public subscribe(listener: LogListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(event: LogEvent) {
        this.listeners.forEach(listener => listener(event));
    }

    private generateSessionId(): string {
        return 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    }

    private generateEventId(): string {
        return 'evt-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Main entry point to log an event.
     */
    public log(
        type: EventType, 
        category: EventCategory, 
        severity: EventSeverity, 
        payload: any
    ): void {
        const event: LogEvent = {
            id: this.generateEventId(),
            timestamp: Date.now(),
            type,
            category,
            severity,
            payload
        };

        this.db.shortTermMemory.push(event);
        
        // Notify UI immediately
        this.notifyListeners(event);

        // Auto-Maintenance
        if (this.db.shortTermMemory.length >= this.MAX_SHORT_TERM) {
            this.compactLogs();
        }
    }

    /**
     * Moves logs from Short Term to Long Term memory with summarization.
     */
    private compactLogs(): void {
        // Take the oldest batch
        const logsToCompact = this.db.shortTermMemory.splice(0, this.BATCH_SIZE);
        
        if (logsToCompact.length === 0) return;

        const startTime = logsToCompact[0].timestamp;
        const endTime = logsToCompact[logsToCompact.length - 1].timestamp;

        // Calculate Metrics
        const typesCount: Record<string, number> = {};
        let criticalCount = 0;

        logsToCompact.forEach(log => {
            typesCount[log.type] = (typesCount[log.type] || 0) + 1;
            if (log.severity === EventSeverity.CRITICAL) criticalCount++;
        });

        const summary: LogSummary = {
            batchId: `batch-${Date.now()}`,
            timeRange: { start: startTime, end: endTime },
            metrics: {
                eventsProcessed: logsToCompact.length,
                criticalEvents: criticalCount,
                typesCount
            }
        };

        this.db.longTermMemory.push(summary);
        
        // Add a System Alert to short term indicating compaction occurred
        this.log(
            EventType.SYSTEM_ALERT,
            EventCategory.SYSTEM,
            EventSeverity.INFO,
            { message: `Auto-compacted ${logsToCompact.length} events to Long Term Memory.` }
        );
    }

    /**
     * Returns the full JSON database for visualization.
     */
    public getDatabase(): KamiLogDatabase {
        // Return a copy with updated export time
        return {
            ...this.db,
            metadata: {
                ...this.db.metadata,
                exportTime: Date.now()
            }
        };
    }
    
    /**
     * Helper to get database as formatted JSON string
     */
    public getFormattedJSON(): string {
        return JSON.stringify(this.getDatabase(), null, 2);
    }
    
    /**
     * Get current recent logs for initial load
     */
    public getRecentLogs(): LogEvent[] {
        return [...this.db.shortTermMemory];
    }
}

export const Logger = LoggerService.getInstance();
