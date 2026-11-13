/**
 * Comprehensive Game Types and Interfaces for "Emma's Jealous Dash"
 */

export type GameDifficulty = 'story' | 'medium' | 'hard' | 'pro';

export type MapThemeId =
  | 'moonlit_meadow'
  | 'shadow_woods'
  | 'forgotten_castle'
  | 'void_citadel';

export type CharacterSpeaker =
  | 'EMMA'
  | 'AYLA'
  | 'CHLOE'
  | 'ROWAN'
  | 'LEO'
  | 'NARRATOR'
  | 'WHITE_LILY'
  | 'STRANGER';

export type EmmaEmotion =
  | 'normal'
  | 'happy'
  | 'happy_closed'
  | 'worried'
  | 'sad'
  | 'sad2'
  | 'crying'
  | 'angry'
  | 'shocked'
  | 'laughing'
  | 'fear'
  | 'hurt'
  | 'screaming'
  | 'neutral'
  | 'jealous'
  | 'evil'
  | 'scared';

export interface RunnerStageConfig {
  difficulty: GameDifficulty;
  episodeId?: number;
  targetDistanceCm: number;
  enableChestHunt: boolean;
  mapTheme: MapThemeId;
}

export type GameScreen = 
  | 'MENU' 
  | 'STORY' 
  | 'RUNNER' 
  | 'MULTIPLAYER'
  | 'VAULT'
  | 'PROFILE'
  | 'CREATE_STORY'
  | 'VIDEO' 
  | 'POST_VIDEO_DIALOGUE' 
  | 'CHEST_FOUND' 
  | 'TO_BE_CONTINUED' 
  | 'GAME_OVER';

export type Lane = -1 | 0 | 1;

export type ObstacleType = 
  | 'ROCK'
  | 'SPIKE'
  | 'HURDLE'
  | 'ROLLING_BOULDER'
  | 'CHEST';

export type PowerupType = 
  | 'MAGNET'
  | 'SHIELD'
  | 'BOOST'
  | 'COIN'
  | 'GEM';

export interface TrackEntity {
  id: string;
  lane: Lane;
  z: number;
  type: ObstacleType | PowerupType;
  width?: number;
  height?: number;
  collected?: boolean;
  destroyed?: boolean;
}

export interface PlayerStats {
  score: number;
  distance: number;
  crystals: number;
  coins: number;
  chestsCollected: number; // 0 to 3
  combo: number;
  maxCombo: number;
  rageCharge: number;
  isRageActive: boolean;
  rageTimeLeft: number;
  activePowerups: {
    magnet: number;
    shield: number;
    boost: number;
    multiplier: number;
  };
}

export interface UpgradeLevels {
  magnetDuration: number;
  shieldStrength: number;
  boostDuration: number;
  rageGain: number;
  selectedSkin: 'unknown' | 'shy' | 'evil';
  unlockedSkins: string[];
}

export type JumpKeyOption = 'Space' | 'ArrowUp' | 'KeyW';
export type ParticleDetail = 'low' | 'medium' | 'high';

export interface UserSettings {
  // Audio & Sound
  bgmVolume: number;         // 0 - 100
  sfxVolume: number;         // 0 - 100
  voiceVolume: number;       // 0 - 100
  voiceEnabled: boolean;     // Voice speech toggle
  isMuted: boolean;          // Silent mode toggle

  // Gameplay & Accessibility
  instantText: boolean;      // Cutscene fast-forward / instant text
  autoAdvanceDialogue: boolean; // Auto-skip dialogue for repeat playthroughs
  jumpKey: JumpKeyOption;    // Control remapping: Space, ArrowUp, KeyW
  relaxedReaction: boolean;  // Difficulty tweak: larger jump window / forgiving collision

  // Visuals & Performance
  reduceGlitches: boolean;   // Reduce screen flashes/shakes
  isFullscreen: boolean;     // Fullscreen mode toggle
  particleDetail: ParticleDetail; // 'low' | 'medium' | 'high'
  showEmailOnProfile: boolean; // Profile privacy toggle
  themeMode: 'dark' | 'light'; // Day / Night mode
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  bgmVolume: 70,
  sfxVolume: 80,
  voiceVolume: 90,
  voiceEnabled: true,
  isMuted: false,
  instantText: false,
  autoAdvanceDialogue: false,
  jumpKey: 'Space',
  relaxedReaction: false,
  reduceGlitches: false,
  isFullscreen: false,
  particleDetail: 'high',
  showEmailOnProfile: false,
  themeMode: 'dark',
};

// Dye Colors for Emma's Outfit
export interface DyeColors {
  shirt: string;
  skirt: string;
  hair: string;
  aura: string;
}

export const DEFAULT_DYE_COLORS: DyeColors = {
  shirt: '#e11d48',
  skirt: '#475569',
  hair: '#f43f5e',
  aura: '#fb7185',
};

// User Profile Schema
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string;
  role: 'player' | 'admin' | 'creator';
  titleBadge: string;
  earnedBadges: string[];
  createdAt: string;
  lastLoginAt: string;
  playtimeSeconds: number;
  stats: {
    highScore: number;
    coins: number;
    gems: number;
    totalDistance: number;
    highestDifficultyUnlocked: GameDifficulty;
    runsPlayed: number;
    chestsOpened: number;
    season1Completed: boolean;
    completedEpisodes: number[];
  };
  wardrobe: {
    equippedHeadwear?: string;
    equippedEyewear?: string;
    equippedOutfit: string;
    equippedAura?: string;
    ownedItems: string[];
    dyeColors: DyeColors;
  };
  loginStreak: {
    days: number;
    lastClaimDate: string;
  };
  claimedPromos: string[];
  preferences: UserSettings;
}

// Multiplayer Lobby Entities
export interface LobbyPlayer {
  username: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
  isAfk: boolean;
  badge?: string;
  x?: number; // 2D position in walkable lobby
  y?: number;
  emote?: 'wave' | 'dance' | 'cheer' | 'sleep' | null;
  dyeColors?: DyeColors;
}

// Minimal Database Entity: Lobby
export interface LobbyEntity {
  room_code: string;
  host_username: string;
  players: string[]; // array of player usernames
  status: 'waiting' | 'running' | 'finished';
}

// Full Database Entity: Lobby & LobbyRoom
export interface Lobby {
  room_code: string;           // unique short code
  host_username: string;       // text
  players: LobbyPlayer[];      // array of players (each has .username)
  player_usernames?: string[]; // array of player usernames
  status: 'waiting' | 'running' | 'finished'; // status
  isPublic?: boolean;
  createdAt?: string;
  weather?: 'none' | 'rain' | 'cherry' | 'snow';
  musicTrack?: 'cozy' | 'synth' | 'action';
}

// Alias for Lobby room compatibility
export type LobbyRoom = Lobby;

// Database Entity: ChatMessage connected to Lobby
export interface ChatMessage {
  id?: string;
  room_code: string;           // room_code
  sender_username: string;     // sender_username
  message: string;             // message
  created_at: string;          // created_at
  avatar?: string;
  badge?: string;
}

// Wardrobe Item Catalog
export interface WardrobeItem {
  id: string;
  name: string;
  category: 'headwear' | 'eyewear' | 'outfit' | 'aura';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'coins' | 'gems';
  icon: string;
  description: string;
}

// Daily Quest Objective
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

// Achievement Trophy
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  badge: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// Story Snapshot Memory Card
export interface MemoryCard {
  id: string;
  episodeId: number;
  title: string;
  description: string;
  unlocked: boolean;
  filter?: 'normal' | 'retro' | 'dark' | 'neon' | 'bw';
  stickers?: string[];
  caption?: string;
}

// Bug Report & Feedback
export interface BugReportItem {
  id: string;
  userId?: string;
  type: 'bug' | 'visual_glitch' | 'audio_issue' | 'gameplay';
  title: string;
  description: string;
  deviceInfo: string;
  timestamp: string;
  status: 'submitted' | 'under_review' | 'resolved';
}

export interface FeedbackItem {
  id: string;
  userId?: string;
  rating: number;
  category: 'story' | 'gameplay' | 'sound' | 'visuals' | 'suggestion';
  message: string;
  timestamp: string;
}
