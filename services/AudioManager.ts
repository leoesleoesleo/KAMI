
import { MUSIC_TRACKS_BY_LEVEL, CROSSFADE_DURATION_MS } from '../constants';

class AudioManagerService {
    private static instance: AudioManagerService;
    
    // Double buffering for crossfade
    private trackA: HTMLAudioElement;
    private trackB: HTMLAudioElement;
    
    private currentTrack: HTMLAudioElement; // Points to either A or B
    private nextTrack: HTMLAudioElement;    // Points to either A or B
    
    private currentLevel: number = 0;
    private masterVolume: number = 0.3;
    private fadeInterval: any = null;

    private constructor() {
        this.trackA = new Audio();
        this.trackB = new Audio();
        
        // Configuration
        this.trackA.loop = true;
        this.trackB.loop = true;
        this.trackA.preload = "auto";
        this.trackB.preload = "auto";

        // Initial Pointer Assignment
        this.currentTrack = this.trackA;
        this.nextTrack = this.trackB;
    }

    public static getInstance(): AudioManagerService {
        if (!AudioManagerService.instance) {
            AudioManagerService.instance = new AudioManagerService();
        }
        return AudioManagerService.instance;
    }

    /**
     * Helper to prepare audio context if needed (Optional now)
     */
    public unlock() {
        // No-op: We rely on direct play calls from user interaction
    }

    /**
     * Main logic to play music for a specific level
     */
    public playLevel(level: number, force: boolean = false) {
        if (!force && this.currentLevel === level) return;
        
        // Determine URL
        let url = MUSIC_TRACKS_BY_LEVEL[level];
        
        // Fallback logic
        if (!url) {
            const availableLevels = Object.keys(MUSIC_TRACKS_BY_LEVEL).map(Number).sort((a,b) => b-a);
            const fallbackLevel = availableLevels.find(l => l < level) || 1;
            url = MUSIC_TRACKS_BY_LEVEL[fallbackLevel];
        }

        this.currentLevel = level;

        console.log(`[Audio] Requesting Level ${level} -> ${url}`);

        // CASE 1: First Play (Cold Start)
        if (this.currentTrack.src === "" || this.currentTrack.src === window.location.href) {
            this.currentTrack.src = url;
            this.currentTrack.volume = this.masterVolume;
            this.currentTrack.play()
                .then(() => console.log("[Audio] Playback started successfully"))
                .catch(e => console.warn("[Audio] Playback failed (Autoplay policy?):", e));
            return;
        }

        // CASE 2: Track Change (Crossfade)
        if (this.currentTrack.src !== url) {
            this.performCrossfade(url);
        }
    }

    private performCrossfade(newUrl: string) {
        console.log("[Audio] Starting Crossfade...");
        
        // 1. Prepare Next Track
        this.nextTrack.src = newUrl;
        this.nextTrack.volume = 0; // Start silent
        
        const playPromise = this.nextTrack.play();
        if (playPromise === undefined) return;
        
        playPromise.then(() => {
            // 2. Start Crossfade Animation
            if (this.fadeInterval) clearInterval(this.fadeInterval);
            
            const steps = 20; // Number of volume updates
            const stepTime = CROSSFADE_DURATION_MS / steps;
            const volStep = this.masterVolume / steps;
            let stepCount = 0;

            this.fadeInterval = setInterval(() => {
                stepCount++;
                
                // Fade Out Current
                this.currentTrack.volume = Math.max(0, this.masterVolume - (volStep * stepCount));
                
                // Fade In Next
                this.nextTrack.volume = Math.min(this.masterVolume, volStep * stepCount);

                if (stepCount >= steps) {
                    this.finalizeCrossfade();
                }
            }, stepTime);
        }).catch(e => console.error("[Audio] Crossfade next track blocked:", e));
    }

    private finalizeCrossfade() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        // Stop Old Track
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
        // Don't clear src immediately to avoid glitches, just swap logic
        
        // Swap Pointers
        const temp = this.currentTrack;
        this.currentTrack = this.nextTrack;
        this.nextTrack = temp;

        // Ensure volume is exact
        this.currentTrack.volume = this.masterVolume;
        console.log("[Audio] Crossfade complete");
    }

    public stop() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.trackA.pause();
        this.trackB.pause();
        this.trackA.currentTime = 0;
        this.trackB.currentTime = 0;
        this.currentLevel = 0;
        // Reset srcs so next start is treated as cold start
        this.trackA.src = "";
        this.trackB.src = "";
    }
}

export const AudioManager = AudioManagerService.getInstance();
