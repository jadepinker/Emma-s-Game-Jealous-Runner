/**
 * Game Types and Interfaces
 */

export type GameScreen = 
  | 'MENU' 
  | 'STORY' 
  | 'VIDEO' 
  | 'POST_VIDEO_DIALOGUE' 
  | 'RUNNER' 
  | 'CHEST_FOUND' 
  | 'TO_BE_CONTINUED' 
  | 'GAME_OVER' 
  | 'UPGRADES';

export type Lane = -1 | 0 | 1; // Left, Center, Right

export type ObstacleType = 
  | 'HURDLE'           // Low barrier - Jump over
  | 'SPIKE_GATE'       // High spiky arch - Slide under
  | 'CANDY_TRAIN'      // Tall train blocking lane - Dodge
  | 'ROLLING_BOULDER'  // Rolling sugar boulder - Dodge or jump
  | 'LILY_BUSH'        // Low spiky vine - Jump over
  | 'CRUMBLING_GAP';   // Gap in track - Jump over

export type PowerupType = 
  | 'MAGNET'    // Attracts all crystals
  | 'SHIELD'    // Absorbs 1 hit
  | 'BOOST'     // Dark Frenzy super speed + invincibility
  | 'MULTIPLIER'; // 2x points

export interface TrackEntity {
  id: string;
  lane: Lane;
  z: number; // Distance ahead of player (units)
  type: ObstacleType | 'CRYSTAL' | 'PETAL' | PowerupType | 'CHEST';
  width?: number;
  height?: number;
  yOffset?: number; // For floating crystals or high gates
  collected?: boolean;
  destroyed?: boolean;
}

export interface PlayerStats {
  score: number;
  distance: number;
  crystals: number;
  combo: number;
  maxCombo: number;
  rageCharge: number; // 0 to 100
  isRageActive: boolean;
  rageTimeLeft: number;
  activePowerups: {
    magnet: number;     // seconds remaining
    shield: number;     // hit points remaining (0 or 1)
    boost: number;      // seconds remaining
    multiplier: number; // seconds remaining
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
