
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
    
    // State flags to prevent race conditions
    private isCrossfading: boolean = false;

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
     * Helper to prepare audio context if needed.
     * Tries to resume playback if suspended by browser policy.
     */
    public unlock() {
        if (this.currentTrack && this.currentTrack.src && this.currentTrack.paused) {
            const p = this.currentTrack.play();
            if (p !== undefined) {
                p.then(() => console.log("[Audio] Unlocked/Resumed successfully"))
                 .catch(e => {
                    // Ignore abort errors caused by rapid interaction
                    if (e.name !== 'AbortError') {
                        console.warn("[Audio] Unlock attempt failed:", e);
                    }
                });
            }
        }
    }

    /**
     * Main logic to play music for a specific level
     */
    public playLevel(level: number, force: boolean = false) {
        // Determine URL
        let url = MUSIC_TRACKS_BY_LEVEL[level];
        
        // Fallback logic
        if (!url) {
            const availableLevels = Object.keys(MUSIC_TRACKS_BY_LEVEL).map(Number).sort((a,b) => b-a);
            const fallbackLevel = availableLevels.find(l => l < level) || 1;
            url = MUSIC_TRACKS_BY_LEVEL[fallbackLevel];
        }

        // GUARD 1: If we are already crossfading TO this url, do nothing (let it finish)
        if (this.isCrossfading && this.nextTrack.src && this.nextTrack.src.includes(url)) {
            // Update level pointer just in case
            this.currentLevel = level;
            return;
        }

        // GUARD 2: If we are currently playing this URL (and not crossfading away from it)
        if (this.currentTrack.src && this.currentTrack.src.includes(url)) {
             this.currentLevel = level;
             
             // If we were crossfading away, cancel it and stay here
             if (this.isCrossfading) {
                 this.cancelCrossfade();
             }

             if (this.currentTrack.paused) {
                 this.currentTrack.volume = this.masterVolume;
                 this.currentTrack.play().catch(e => {
                     if (e.name !== 'AbortError') console.warn("[Audio] Resume failed:", e);
                 });
             } else {
                 // Ensure volume is restored if we were fading out
                 this.currentTrack.volume = this.masterVolume;
             }
             return;
        }

        // Update Level State
        this.currentLevel = level;
        console.log(`[Audio] Requesting Level ${level} -> ${url}`);

        // CASE 1: First Play (Cold Start)
        if (!this.currentTrack.src || this.currentTrack.src === "" || this.currentTrack.src === window.location.href) {
            this.currentTrack.src = url;
            this.currentTrack.volume = this.masterVolume;
            const p = this.currentTrack.play();
            if (p !== undefined) {
                p.then(() => console.log("[Audio] Playback started successfully"))
                 .catch(e => {
                     if (e.name !== 'AbortError') console.warn("[Audio] Playback failed:", e);
                 });
            }
            return;
        }

        // CASE 2: Track Change (Crossfade)
        this.performCrossfade(url);
    }

    private cancelCrossfade() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.isCrossfading = false;
        
        // Stop next track
        this.nextTrack.pause();
        this.nextTrack.currentTime = 0;
        
        // Restore current track volume
        this.currentTrack.volume = this.masterVolume;
    }

    private performCrossfade(newUrl: string) {
        console.log("[Audio] Starting Crossfade...");
        
        // Stop any previous fade animation
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        this.isCrossfading = true;
        
        // 1. Prepare Next Track
        // Important: Pause before changing src to avoid "interrupted" errors on pending promises from previous interactions
        this.nextTrack.pause();
        this.nextTrack.src = newUrl;
        this.nextTrack.volume = 0; // Start silent
        
        const playPromise = this.nextTrack.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Play started successfully, begin fade
                this.executeFadeAnimation();
            }).catch(e => {
                // If blocked by new load request (AbortError), it means another playLevel call happened.
                // We ignore it. If blocked by Autoplay, we log warning.
                if (e.name === 'AbortError') {
                    console.log("[Audio] Crossfade interrupted by new request");
                } else {
                    console.warn("[Audio] Crossfade play blocked:", e);
                    // Reset flag so we can try again later
                    this.isCrossfading = false;
                }
            });
        }
    }

    private executeFadeAnimation() {
        // 2. Start Crossfade Animation
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        const steps = 20; // Number of volume updates
        const stepTime = CROSSFADE_DURATION_MS / steps;
        const volStep = this.masterVolume / steps;
        let stepCount = 0;

        this.fadeInterval = setInterval(() => {
            stepCount++;
            
            // Fade Out Current
            if (this.currentTrack) {
                this.currentTrack.volume = Math.max(0, this.masterVolume - (volStep * stepCount));
            }
            
            // Fade In Next
            if (this.nextTrack) {
                this.nextTrack.volume = Math.min(this.masterVolume, volStep * stepCount);
            }

            if (stepCount >= steps) {
                this.finalizeCrossfade();
            }
        }, stepTime);
    }

    private finalizeCrossfade() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        // Stop Old Track
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
        
        // Swap Pointers
        const temp = this.currentTrack;
        this.currentTrack = this.nextTrack;
        this.nextTrack = temp;

        // Reset state
        this.currentTrack.volume = this.masterVolume;
        this.isCrossfading = false;
        
        console.log("[Audio] Crossfade complete");
    }

    public stop() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.trackA.pause();
        this.trackB.pause();
        this.trackA.currentTime = 0;
        this.trackB.currentTime = 0;
        this.currentLevel = 0;
        this.isCrossfading = false;
        // Reset srcs so next start is treated as cold start
        this.trackA.src = "";
        this.trackB.src = "";
    }
}

export const AudioManager = AudioManagerService.getInstance();
