import { GameState } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';
import { Logger } from './LoggerService';
import { EventType, EventCategory, EventSeverity } from '../types';

export class StorageService {
    
    /**
     * Saves the current game state to local storage
     */
    static saveGame(state: GameState): boolean {
        try {
            // We serialize the entire state
            const serializedState = JSON.stringify(state);
            localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
            return true;
        } catch (error) {
            console.error("Failed to save game:", error);
            Logger.log(
                EventType.SYSTEM_ALERT, 
                EventCategory.SYSTEM, 
                EventSeverity.CRITICAL, 
                { message: 'Auto-save Failed', error: String(error) }
            );
            return false;
        }
    }

    /**
     * Loads the game state from local storage
     */
    static loadGame(): GameState | null {
        try {
            const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!serializedState) return null;

            const state = JSON.parse(serializedState) as GameState;
            
            // Basic validation to ensure it's a valid state object
            if (!state.player || !state.entities) {
                throw new Error("Invalid save file structure");
            }

            return state;
        } catch (error) {
            console.error("Failed to load game:", error);
            return null;
        }
    }

    /**
     * Checks if a save file exists
     */
    static hasSaveGame(): boolean {
        return !!localStorage.getItem(LOCAL_STORAGE_KEY);
    }

    /**
     * Clears the save file (optional, e.g., on game over or manual reset)
     */
    static clearSave(): void {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
}