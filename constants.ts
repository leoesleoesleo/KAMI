

export const MUSIC_TRACKS_BY_LEVEL: Record<number, string> = {
  // Level 1: Epic/Origin (Cinematic) - User specific request
  1: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=music-for-video-epic-cinematic-dramatic-adventure-background-111737.mp3",
  
  // Level 2: Biotech/Nature (Ambient/Techno) - Stable Test Source
  2: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  
  // Level 3: Ascension/Space (Ethereal) - Stable Test Source
  3: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
};

export const WATER_SOUND_URL = "https://cdn.pixabay.com/download/audio/2022/03/10/audio_5a26514785.mp3?filename=sci-fi-charge-up-37395.mp3";

export const MUSIC_PLAYLIST = Object.values(MUSIC_TRACKS_BY_LEVEL);

// --- ADVANCED MUSIC SYSTEM CONFIGURATION ---

export const CROSSFADE_DURATION_MS = 1200; // 1.2 Seconds


// Modern Developer / System Architect Avatars (Style: Notionists - Stable & Techy)
export const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Alexander&backgroundColor=e5e7eb",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Robert&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Jade&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aneka&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Maria&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Chris&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Brian&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Sophia&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/notionists/svg?seed=DataOps&backgroundColor=e5e7eb"
];

// High-Tech Digital Landscape / Circuit Board City
export const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop";

export const WORLD_SIZE = 8000;

// System Configuration
export const AUTOSAVE_INTERVAL_MS = 300000; // 5 Minutes
export const LOCAL_STORAGE_KEY = 'biobots_genesis_save_v1';

// --- META INFO ---
export const GAME_VERSION = "v1.0";
// URL local para la imagen compartida (Ahora en carpeta imagenes)
export const DEDICATION_IMAGE_URL = "https://leoesleoesleo.github.io/imagenes/leo_santi.jpg";