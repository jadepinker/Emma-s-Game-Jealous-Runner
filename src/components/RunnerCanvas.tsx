import React, { useRef, useEffect, useState, useCallback } from 'react';
import { soundManager } from '../audio/soundManager';
import { PlayerStats, UpgradeLevels, UserSettings, GameDifficulty, MapThemeId } from '../types/game';

export type { GameDifficulty };
import { Pause, Smartphone } from 'lucide-react';
import strangerRunImg from '../assets/stranger/stranger_run.png';
import strangerJumpImg from '../assets/stranger/stranger_jump.png';
import { authService } from '../utils/authService';

interface RunnerCanvasProps {
  difficulty?: GameDifficulty;
  episodeId?: number;
  targetDistanceCm?: number;
  enableChestHunt?: boolean;
  mapTheme?: MapThemeId;
  settings?: UserSettings;
  upgrades?: UpgradeLevels;
  onGameOver: (stats: PlayerStats) => void;
  onChestFound: () => void;
  onAllChestsCollected?: () => void;
  onStatsUpdate?: (stats: PlayerStats) => void;
  onOpenStory?: () => void;
  onReturnMenu?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'star' | 'dust' | 'gold' | 'petal' | 'confetti';
}

interface RockObstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  cleared: boolean;
  isSpike?: boolean;
}

interface FloatingChestEntity {
  id: number;
  x: number;
  cmDistance: number;
  collected: boolean;
}

export const RunnerCanvas: React.FC<RunnerCanvasProps> = ({
  difficulty = 'story',
  episodeId,
  targetDistanceCm: propTargetDistanceCm,
  enableChestHunt: propEnableChestHunt,
  settings,
  onGameOver,
  onChestFound,
  onAllChestsCollected,
  onReturnMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Target distance in cm: Episode 1 = 50cm, Episode 2 = 100cm, (+50cm/episode), or by difficulty
  const targetDistanceCm =
    propTargetDistanceCm ??
    (episodeId ? episodeId * 50 : undefined) ??
    (difficulty === 'pro' ? 250 :
     difficulty === 'hard' ? 200 :
     difficulty === 'medium' ? 150 : 100);

  // Starting in Episode 5, activate the 3-Chest Hunt mechanic!
  const isChestHuntEnabled =
    propEnableChestHunt !== undefined
      ? propEnableChestHunt
      : episodeId !== undefined
      ? episodeId >= 5
      : true;

  // Calibrated Speed: Calm, readable base pace so players have generous reaction time
  const baseSpeed = 2.5;
  const speedMultiplier =
    difficulty === 'pro' ? 1.28 :
    difficulty === 'hard' ? 1.18 :
    difficulty === 'medium' ? 1.08 : 1.0;

  // 3-Chest Hunt Mechanic state: spaced proportionally across targetDistanceCm
  const [chestsCollectedCount, setChestsCollectedCount] = useState<number>(0);
  const chestsRef = useRef<FloatingChestEntity[]>([
    { id: 1, x: 0, cmDistance: Math.max(15, Math.round(targetDistanceCm * 0.3)), collected: false },
    { id: 2, x: 0, cmDistance: Math.max(30, Math.round(targetDistanceCm * 0.65)), collected: false },
    { id: 3, x: 0, cmDistance: Math.max(45, Math.round(targetDistanceCm * 0.94)), collected: false },
  ]);

  // Portrait Orientation warning state
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // Game State Refs
  const isRunningRef = useRef(true);
  const isPausedRef = useRef(false);
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const coinsCollectedRef = useRef(0);
  const rocksRef = useRef<RockObstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextRockDistRef = useRef(12);
  const runTimerRef = useRef(0);

  // Loaded Sprites
  const runSpriteRef = useRef<HTMLImageElement | null>(null);
  const jumpSpriteRef = useRef<HTMLImageElement | null>(null);

  // Physics: Floaty, responsive high jump for clear obstacle clearance
  const playerRef = useRef({
    x: 110,
    y: 0,
    vy: 0,
    isGrounded: true,
    isJumping: false,
    width: 72,
    height: 86,
    runFrame: 0,
    stumbleTimer: 0
  });

  const [currentDistanceCm, setCurrentDistanceCm] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [jumpHintVisible, setJumpHintVisible] = useState(true);

  // Detect Mobile Portrait Orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isMobileScreen = window.innerWidth <= 840;
        const isVertical = window.innerHeight > window.innerWidth;
        setIsPortrait(isMobileScreen && isVertical);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Load Sprites
  useEffect(() => {
    const runImg = new Image();
    runImg.src = strangerRunImg;
    runImg.onload = () => { runSpriteRef.current = runImg; };

    const jumpImg = new Image();
    jumpImg.src = strangerJumpImg;
    jumpImg.onload = () => { jumpSpriteRef.current = jumpImg; };

    soundManager.startMusic();
    return () => {
      soundManager.stopMusic();
    };
  }, []);

  // High, floaty Jump Action for generous airtime and obstacle clearance
  const triggerJump = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current) return;
    const p = playerRef.current;
    if (p.isGrounded) {
      // Strong upward jump velocity paired with lighter gravity
      p.vy = -13.6;
      p.isGrounded = false;
      p.isJumping = true;
      soundManager.playJump();
      setJumpHintVisible(false);

      // Sparkle dust trail
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x: p.x + 35,
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 4 - 2,
          vy: Math.random() * -3,
          color: ['#f43f5e', '#fb7185', '#fef08a', '#ffffff'][Math.floor(Math.random() * 4)],
          size: Math.random() * 4 + 2,
          alpha: 1,
          life: 0,
          maxLife: 22,
          type: 'sparkle'
        });
      }
    }
  }, []);

  // Pause toggle
  const togglePause = useCallback(() => {
    const nextState = !isPausedRef.current;
    isPausedRef.current = nextState;
    setIsPaused(nextState);
    if (nextState) soundManager.playLaneSwitch();
    else soundManager.playPowerup();
  }, []);

  // Key controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }

      const activeJumpKey = settings?.jumpKey || 'Space';
      const isJumpKey = 
        e.code === activeJumpKey ||
        e.code === 'Space' || 
        (activeJumpKey === 'ArrowUp' && e.code === 'ArrowUp') ||
        (activeJumpKey === 'KeyW' && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W'));

      if (isJumpKey) {
        e.preventDefault();
        triggerJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerJump, togglePause, settings?.jumpKey]);

  // Restart function
  const restartRunner = () => {
    distanceRef.current = 0;
    scoreRef.current = 0;
    coinsCollectedRef.current = 0;
    setCurrentCoins(0);
    setChestsCollectedCount(0);
    chestsRef.current.forEach(c => c.collected = false);
    rocksRef.current = [];
    particlesRef.current = [];
    nextRockDistRef.current = 12;
    isRunningRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    playerRef.current.stumbleTimer = 0;
    playerRef.current.vy = 0;
    playerRef.current.isGrounded = true;
    soundManager.playPowerup();
  };

  // Main 2D Loop with Rock Obstacles, 3-Chest Hunt, Classic Trees, and Clean Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const groundHeight = 85;
    let lastFrameTime = performance.now();

    const gameLoop = (now: number) => {
      const rawDt = (now - lastFrameTime) / 16.667;
      lastFrameTime = now;
      const dt = Math.min(2.5, Math.max(0.25, rawDt));

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const groundY = height - groundHeight;

      if (isRunningRef.current && !isPausedRef.current) {
        runTimerRef.current += dt;

        // Advance distance (steady readable progression normalized across refresh rates)
        const distanceDelta = speedMultiplier * baseSpeed * 0.032 * dt;
        distanceRef.current += distanceDelta;
        scoreRef.current += Math.round(distanceDelta * 10);
        setCurrentDistanceCm(Math.floor(distanceRef.current));

        // Physics: Lighter gravity (0.42) + strong jump (-13.6) for floaty airtime
        const p = playerRef.current;
        p.vy += 0.42 * dt;
        p.y += p.vy * dt;

        if (p.y >= groundY - p.height) {
          p.y = groundY - p.height;
          p.vy = 0;
          p.isGrounded = true;
          p.isJumping = false;
        }

        // Spawn Rock Obstacles with generous spacing and comfortable reaction window
        if (distanceRef.current >= nextRockDistRef.current) {
          const rockW = 52;
          const rockH = 44;

          rocksRef.current.push({
            id: Date.now() + Math.random(),
            x: width + 20,
            width: rockW,
            height: rockH,
            cleared: false,
            isSpike: false,
          });

          const distInterval = distanceRef.current < 16 ? 12 : 11 + Math.random() * 6;
          nextRockDistRef.current = distanceRef.current + distInterval;
        }

        // Move rocks at controlled, readable horizontal speed
        const moveSpeed = speedMultiplier * baseSpeed * 1.45 * dt;
        rocksRef.current.forEach(rock => {
          rock.x -= moveSpeed;

          // Check if cleared
          if (!rock.cleared && rock.x + rock.width < p.x) {
            rock.cleared = true;
            authService.progressQuest('quest_jump_rocks', 1);
          }
        });
        rocksRef.current = rocksRef.current.filter(r => r.x + r.width > -50);

        // Check 3-Chest Spawns along the track (Active starting Episode 5+ or Arcade Chest Hunt)
        if (isChestHuntEnabled) {
          chestsRef.current.forEach(ch => {
            if (!ch.collected && distanceRef.current >= ch.cmDistance) {
              ch.collected = true;
              const newCount = chestsRef.current.filter(c => c.collected).length;
              setChestsCollectedCount(newCount);
              coinsCollectedRef.current += 100;
              setCurrentCoins(coinsCollectedRef.current);
              authService.addCoins(100);
              soundManager.playPowerup();

              // Burst celebration particles
              for (let i = 0; i < 20; i++) {
                particlesRef.current.push({
                  x: p.x + 35,
                  y: groundY - 30,
                  vx: (Math.random() - 0.5) * 6,
                  vy: Math.random() * -6 - 2,
                  color: ['#f59e0b', '#fbbf24', '#fef08a', '#ec4899', '#ffffff'][Math.floor(Math.random() * 5)],
                  size: Math.random() * 5 + 3,
                  alpha: 1,
                  life: 0,
                  maxLife: 35,
                  type: 'gold'
                });
              }

              if (newCount >= 3) {
                soundManager.playVictoryFanfare();
                if (onAllChestsCollected) onAllChestsCollected();
              }
            }
          });
        }

        // Rock Collision Detection with Fair Hitbox
        const hitboxMargin = settings?.relaxedReaction ? 14 : 7;
        const playerBox = {
          left: p.x + hitboxMargin,
          right: p.x + p.width - hitboxMargin,
          top: p.y + hitboxMargin,
          bottom: p.y + p.height - hitboxMargin
        };

        for (const rock of rocksRef.current) {
          const rockBox = {
            left: rock.x + 5,
            right: rock.x + rock.width - 5,
            top: groundY - rock.height + 5,
            bottom: groundY
          };

          const isColliding = 
            playerBox.right > rockBox.left &&
            playerBox.left < rockBox.right &&
            playerBox.bottom > rockBox.top &&
            playerBox.top < rockBox.bottom;

          if (isColliding) {
            soundManager.playCrash();
            isRunningRef.current = false;
            onGameOver({
              score: scoreRef.current,
              distance: Math.floor(distanceRef.current),
              crystals: Math.floor(scoreRef.current / 10),
              coins: coinsCollectedRef.current,
              chestsCollected: chestsRef.current.filter(c => c.collected).length,
              combo: 1,
              maxCombo: 1,
              rageCharge: 0,
              isRageActive: false,
              rageTimeLeft: 0,
              activePowerups: { magnet: 0, shield: 0, boost: 0, multiplier: 0 }
            });
            return;
          }
        }

        // Target distance reached!
        if (distanceRef.current >= targetDistanceCm) {
          isRunningRef.current = false;
          onChestFound();
          return;
        }
      }

      // ----------------- RENDER MORNING NORMAL SCENERY & ENTITIES -----------------
      ctx.clearRect(0, 0, width, height);

      // Morning Normal Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.5, '#bae6fd');
      skyGrad.addColorStop(0.85, '#fef08a');
      skyGrad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Morning Glowing Sun
      ctx.save();
      const sunGrad = ctx.createRadialGradient(width * 0.85, 75, 5, width * 0.85, 75, 90);
      sunGrad.addColorStop(0, '#fef08a');
      sunGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.65)');
      sunGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width * 0.85, 75, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fluffy Morning Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const cloudOffset = (runTimerRef.current * 0.45) % (width + 200);
      [
        { x: (width * 0.2 - cloudOffset + width + 200) % (width + 200) - 100, y: 55, r: 24 },
        { x: (width * 0.65 - cloudOffset * 0.7 + width + 200) % (width + 200) - 100, y: 90, r: 30 }
      ].forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.arc(c.x + c.r * 0.7, c.y - c.r * 0.3, c.r * 0.8, 0, Math.PI * 2);
        ctx.arc(c.x + c.r * 1.4, c.y, c.r * 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      // Classic Green Forest Trees in Background
      const treeSpacing = 160;
      const treeOffset = (distanceRef.current * 14) % treeSpacing;
      for (let tx = -treeOffset - 60; tx < width + 100; tx += treeSpacing) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx + 22, groundY - 70, 14, 70);

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(tx + 29, groundY - 145);
        ctx.lineTo(tx + 2, groundY - 80);
        ctx.lineTo(tx + 56, groundY - 80);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(tx + 29, groundY - 120);
        ctx.lineTo(tx + 8, groundY - 65);
        ctx.lineTo(tx + 50, groundY - 65);
        ctx.closePath();
        ctx.fill();
      }

      // Ground Path
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#15803d');
      groundGrad.addColorStop(0.12, '#166534');
      groundGrad.addColorStop(0.2, '#78350f');
      groundGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, groundHeight);

      // Grass edge blade accents
      ctx.fillStyle = '#4ade80';
      for (let gx = 0; gx < width; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx + 6, groundY - 5);
        ctx.lineTo(gx + 12, groundY);
        ctx.fill();
      }

      // Draw Rock Obstacles (Natural Organic Shapes)
      rocksRef.current.forEach(rock => {
        const ry = groundY - rock.height;

        if (rock.isSpike) {
          // Sharp Spikes
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(rock.x + rock.width / 2, ry);
          ctx.lineTo(rock.x, groundY);
          ctx.lineTo(rock.x + rock.width, groundY);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Medium-sized organic boulder
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.ellipse(
            rock.x + rock.width / 2, 
            ry + rock.height / 2 + 4, 
            rock.width / 2, 
            rock.height / 2, 
            0, 0, Math.PI * 2
          );
          ctx.fill();

          // Highlight texture
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(rock.x + rock.width * 0.35, ry + rock.height * 0.35, rock.width * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Player Character Sprite
      const p = playerRef.current;
      const sprite = (p.isJumping || !p.isGrounded) ? jumpSpriteRef.current : runSpriteRef.current;

      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, p.x, p.y, p.width, p.height);
      } else {
        // Fallback smooth avatar
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 16);
        ctx.fill();
      }

      // Draw Particles
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life += dt;
        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      particlesRef.current = particlesRef.current.filter(pt => pt.life < pt.maxLife);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [baseSpeed, speedMultiplier, targetDistanceCm, isChestHuntEnabled, onGameOver, onChestFound, onAllChestsCollected, settings?.relaxedReaction]);

  return (
    <div className="relative w-full h-full flex flex-col font-sans select-none overflow-hidden overflow-x-hidden bg-slate-950">
      {/* MANDATORY LANDSCAPE ORIENTATION WARNING FOR PHONES/TABLETS */}
      {isPortrait && (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-center animate-fadeIn">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-950/90 border-2 border-purple-400 flex items-center justify-center mb-3 md:mb-4 text-purple-300 animate-bounce shadow-2xl">
            <Smartphone className="w-6 h-6 md:w-7 md:h-7 rotate-90" />
          </div>
          <h2 className="text-lg md:text-2xl font-black text-white mb-1.5 md:mb-2">
            Rotate to Landscape Mode 🔄
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-xs leading-relaxed font-medium mb-4">
            Please rotate your device horizontally to Landscape Mode for the intended wide 2D sprint view!
          </p>
          <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
            Emma's Jealous Runner
          </span>
        </div>
      )}

      {/* TOP RUNNER HUD */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-2 md:p-5 pointer-events-none">
        {/* Left: Distance & Coins */}
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
          <div className="px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-xl md:rounded-2xl bg-slate-900/90 border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 md:gap-2">
            <span className="text-[10px] md:text-xs uppercase font-extrabold text-amber-400">Dist:</span>
            <span className="font-mono font-black text-xs md:text-base text-white tabular-nums">
              {currentDistanceCm} <span className="text-[10px] md:text-xs text-slate-400">/ {targetDistanceCm} cm</span>
            </span>
          </div>

          <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl md:rounded-2xl bg-amber-950/80 border border-amber-400/40 text-amber-300 font-mono font-bold text-[11px] md:text-xs flex items-center gap-1 shadow-xl backdrop-blur-md">
            <span>🪙 {currentCoins}</span>
          </div>
        </div>

        {/* CENTER: MAP GOAL OR 3-CHEST HUNT TRACKER (Ep 5+) */}
        {isChestHuntEnabled ? (
          <div className="flex flex-col items-center pointer-events-auto">
            <div className="px-2.5 py-1 md:px-4 md:py-1.5 rounded-xl md:rounded-2xl bg-slate-950/90 border border-amber-400/50 shadow-2xl backdrop-blur-md flex items-center gap-1.5 md:gap-2.5">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-amber-300">
                Chests:
              </span>
              <div className="flex items-center gap-1 md:gap-2">
                {[1, 2, 3].map((chestNum) => {
                  const isCollected = chestNum <= chestsCollectedCount;
                  return (
                    <div
                      key={chestNum}
                      className={`text-sm md:text-xl transition-all transform ${
                        isCollected 
                          ? 'scale-125 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-bounce' 
                          : 'opacity-35 grayscale'
                      }`}
                    >
                      📦
                    </div>
                  );
                })}
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-900 bg-white/75 px-2 py-0.5 rounded-full mt-0.5">
              {chestsCollectedCount === 3 
                ? 'ALL 3 CHESTS COLLECTED!' 
                : `${3 - chestsCollectedCount} chests left`}
            </span>
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center pointer-events-auto">
            <div className="px-4 py-1.5 rounded-2xl bg-white/90 border border-sky-200 shadow-lg text-xs font-bold text-slate-900">
              Morning Trail · Goal {targetDistanceCm} cm
            </div>
          </div>
        )}

        {/* Right: Pause Control */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={togglePause}
            className="p-1.5 md:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white shadow-xl cursor-pointer"
            title="Pause Game (ESC)"
          >
            <Pause className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>

      {/* Floating Jump Guide */}
      {jumpHintVisible && !isPaused && (
        <div className="absolute bottom-20 md:bottom-24 inset-x-0 flex justify-center pointer-events-none z-20 px-4">
          <div className="px-3 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl bg-slate-900/90 border border-amber-400/60 text-white text-[10px] md:text-xs font-black shadow-2xl animate-bounce flex items-center gap-2 text-center">
            <span>TAP OR PRESS {settings?.jumpKey === 'KeyW' ? 'W' : settings?.jumpKey === 'ArrowUp' ? 'UP ARROW' : 'SPACEBAR'} TO JUMP!</span>
          </div>
        </div>
      )}

      {/* CANVAS ELEMENT FOR 2D ARCADE RUNNER */}
      <canvas
        ref={canvasRef}
        onClick={triggerJump}
        className="w-full h-full cursor-pointer touch-none"
      />

      {/* COMPACT MOBILE TOUCH JUMP BUTTON (w-14 h-14, bottom-right corner, semi-transparent) */}
      {!isPaused && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            triggerJump();
          }}
          onClick={(e) => e.stopPropagation()}
          className="md:hidden absolute bottom-4 right-4 z-30 w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/35 text-white font-black text-[10px] uppercase tracking-wider shadow-lg flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer touch-none"
          aria-label="Jump"
        >
          <span className="text-sm leading-none">▲</span>
          <span>JUMP</span>
        </button>
      )}

      {/* PAUSED MODAL [MENU] [BACK TO GAME] [RESTART] */}
      {isPaused && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4"
        >
          <div className="max-w-xs md:max-w-sm w-full max-h-[85vh] overflow-y-auto bg-slate-900 border-2 border-purple-500/50 rounded-2xl md:rounded-3xl p-4 md:p-8 text-center space-y-3 md:space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-xl md:text-2xl mx-auto">
              ⏸️
            </div>
            <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wider">
              PAUSED GAME
            </h2>
            <p className="text-[11px] md:text-xs text-slate-400">
              Current progress: {currentDistanceCm} / {targetDistanceCm} cm
              {isChestHuntEnabled ? ` · ${chestsCollectedCount}/3 Chests` : ''}
            </p>

            <div className="space-y-2 pt-1 md:pt-2">
              <button
                onClick={togglePause}
                className="w-full py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer"
              >
                Back to Game
              </button>
              <button
                onClick={restartRunner}
                className="w-full py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Restart Run
              </button>
              {onReturnMenu && (
                <button
                  onClick={onReturnMenu}
                  className="w-full py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl cursor-pointer"
                >
                  Return to Menu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
