import React, { useRef, useEffect, useState, useCallback } from 'react';
import { soundManager } from '../audio/soundManager';
import { PlayerStats, UpgradeLevels } from '../types/game';
import { Sparkles, RotateCcw, Volume2, VolumeX, Pause, Play, Home, Sun, Cloud } from 'lucide-react';
import strangerRunImg from '../assets/stranger/stranger_run.png';
import strangerJumpImg from '../assets/stranger/stranger_jump.png';

export type GameDifficulty = 'story' | 'medium' | 'hard' | 'pro';

interface RunnerCanvasProps {
  difficulty?: GameDifficulty;
  upgrades: UpgradeLevels;
  onGameOver: (stats: PlayerStats) => void;
  onChestFound: () => void;
  onStatsUpdate: (stats: PlayerStats) => void;
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
  type: 'sparkle' | 'star' | 'dust' | 'gold' | 'petal';
}

interface RockObstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  cleared: boolean;
}

export const RunnerCanvas: React.FC<RunnerCanvasProps> = ({
  difficulty = 'story',
  upgrades,
  onGameOver,
  onChestFound,
  onStatsUpdate,
  onOpenStory,
  onReturnMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Target distance in cm based on difficulty
  const targetDistanceCm = 
    difficulty === 'pro' ? 250 :
    difficulty === 'hard' ? 200 :
    difficulty === 'medium' ? 150 : 100;

  // Base speed + 60% faster requested by user ("add more faster speed in runner game like 60%")
  const speedMultiplier = 
    (difficulty === 'pro' ? 1.4 :
     difficulty === 'hard' ? 1.25 :
     difficulty === 'medium' ? 1.15 : 1.0) * 1.6; // 60% faster

  // Game State Refs
  const isRunningRef = useRef(true);
  const isPausedRef = useRef(false);
  const distanceRef = useRef(0); // in cm
  const scoreRef = useRef(0);
  const rocksRef = useRef<RockObstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextRockDistRef = useRef(14); // distance in cm when next rock spawns

  // Loaded Character Sprites
  const runSpriteRef = useRef<HTMLImageElement | null>(null);
  const jumpSpriteRef = useRef<HTMLImageElement | null>(null);

  // Player Physics & State
  const playerRef = useRef({
    x: 100,
    y: 0,
    vy: 0,
    isGrounded: true,
    isJumping: false,
    width: 75,
    height: 90,
    runFrame: 0,
    stumbleTimer: 0
  });

  // Chest Interaction State
  const [chestFoundMode, setChestFoundMode] = useState(false);
  const [chestClicks, setChestClicks] = useState(0);
  const chestClickRef = useRef(0);
  const chestAnimRef = useRef(0);

  // UI state for distance & pause
  const [currentDistanceCm, setCurrentDistanceCm] = useState(0);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isPaused, setIsPaused] = useState(false);
  const [jumpHintVisible, setJumpHintVisible] = useState(true);

  // Preload Stranger Run and Jump sprites
  useEffect(() => {
    const runImg = new Image();
    runImg.src = strangerRunImg;
    runSpriteRef.current = runImg;

    const jumpImg = new Image();
    jumpImg.src = strangerJumpImg;
    jumpSpriteRef.current = jumpImg;
  }, []);

  // Jump trigger function
  const triggerJump = useCallback(() => {
    if (isPausedRef.current) return;

    if (chestFoundMode) {
      handleChestClick();
      return;
    }

    const p = playerRef.current;
    if (p.isGrounded && p.stumbleTimer <= 0) {
      // Faster, crisp jump velocity
      p.vy = -16.5;
      p.isGrounded = false;
      p.isJumping = true;
      soundManager.playJump();
      setJumpHintVisible(false);

      // Cute jump takeoff sparkles
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x: p.x + p.width / 2 + (Math.random() - 0.5) * 25,
          y: p.y + p.height - 5,
          vx: (Math.random() - 0.5) * 5,
          vy: -Math.random() * 4,
          color: Math.random() > 0.5 ? '#f472b6' : '#38bdf8',
          size: Math.random() * 4 + 3,
          alpha: 1,
          life: 0,
          maxLife: 25,
          type: 'sparkle'
        });
      }
    }
  }, [chestFoundMode]);

  // Handle chest click
  const handleChestClick = () => {
    if (chestClickRef.current >= 5) return;

    const nextClicks = chestClickRef.current + 1;
    chestClickRef.current = nextClicks;
    setChestClicks(nextClicks);
    chestAnimRef.current = 15; // shake frames

    soundManager.playChestHit(nextClicks);

    // Cute girl celebration jump on each click
    const p = playerRef.current;
    p.vy = -11;
    p.isGrounded = false;
    p.isJumping = true;

    // Burst golden morning particles
    const canvas = canvasRef.current;
    const chestX = canvas ? canvas.width * 0.58 : 400;
    const chestY = canvas ? canvas.height * 0.72 : 300;

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      particlesRef.current.push({
        x: chestX + 40,
        y: chestY + 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        color: ['#f59e0b', '#fbbf24', '#fef08a', '#ec4899', '#ffffff'][Math.floor(Math.random() * 5)],
        size: Math.random() * 6 + 4,
        alpha: 1,
        life: 0,
        maxLife: 45,
        type: 'gold'
      });
    }

    if (nextClicks >= 5) {
      setTimeout(() => {
        onChestFound();
      }, 700);
    }
  };

  // Pause & Resume Game
  const togglePause = useCallback(() => {
    if (chestFoundMode) return;
    const nextState = !isPausedRef.current;
    isPausedRef.current = nextState;
    setIsPaused(nextState);
    if (nextState) {
      soundManager.playLaneSwitch();
    } else {
      soundManager.playPowerup();
    }
  }, [chestFoundMode]);

  // Keyboard controls: Space to jump, ESC to pause ("if you click esc key or in a mobile it will hit the 'paused game [menu] [back to game]'")
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        triggerJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerJump, togglePause]);

  // Restart function
  const restartRunner = () => {
    distanceRef.current = 0;
    scoreRef.current = 0;
    rocksRef.current = [];
    particlesRef.current = [];
    nextRockDistRef.current = 14;
    chestClickRef.current = 0;
    setChestClicks(0);
    setChestFoundMode(false);
    isRunningRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    playerRef.current.stumbleTimer = 0;
    playerRef.current.vy = 0;
    playerRef.current.isGrounded = true;
    soundManager.playPowerup();
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Main 2D Game Loop with 60% Faster Speed and Morning Sun & Sky Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      playerRef.current.x = Math.max(60, canvas.width * 0.18);
    };

    resize();
    window.addEventListener('resize', resize);

    // Morning Cloud positions for peaceful drifting
    const clouds = [
      { x: 50, y: 70, scale: 1.2, speed: 12 },
      { x: 300, y: 120, scale: 0.9, speed: 8 },
      { x: 600, y: 60, scale: 1.4, speed: 15 },
      { x: 900, y: 140, scale: 0.8, speed: 10 },
      { x: 1200, y: 90, scale: 1.1, speed: 14 }
    ];

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const width = canvas.width;
      const height = canvas.height;
      const groundY = height * 0.76;
      const p = playerRef.current;

      // 1. UPDATE GAME STATE (when unpaused)
      if (isRunningRef.current && !chestFoundMode && !isPausedRef.current) {
        // Runner speed: 60% faster! (e.g. 20 cm/sec base * speedMultiplier)
        const speedCmPerSec = 20 * speedMultiplier;
        distanceRef.current += speedCmPerSec * dt;
        scoreRef.current += Math.floor(dt * 160);

        const currentDist = Math.min(targetDistanceCm, Math.floor(distanceRef.current));
        setCurrentDistanceCm(currentDist);

        // Spawn Big Rock Obstacles
        if (distanceRef.current >= nextRockDistRef.current && distanceRef.current < (targetDistanceCm - 8)) {
          rocksRef.current.push({
            id: Date.now() + Math.random(),
            x: width + 60,
            width: 75,
            height: 70,
            cleared: false
          });
          // Next rock interval
          nextRockDistRef.current = distanceRef.current + Math.random() * 8 + 22;
        }

        // Reached target distance (e.g. 100cm)
        if (distanceRef.current >= targetDistanceCm) {
          distanceRef.current = targetDistanceCm;
          setCurrentDistanceCm(targetDistanceCm);
          setChestFoundMode(true);
          soundManager.playPowerup();
        }
      }

      // Physics for Player (when unpaused)
      if (!isPausedRef.current) {
        if (p.isGrounded) {
          p.y = groundY - p.height;
          p.vy = 0;
          p.isJumping = false;
          p.runFrame += dt * 15 * speedMultiplier; // snappy running frame rate
        } else {
          // Gravitational acceleration
          p.vy += 38 * dt;
          p.y += p.vy;

          // Sparkling jump particles
          if (Math.random() < 0.5) {
            particlesRef.current.push({
              x: p.x + p.width / 2 + (Math.random() - 0.5) * 20,
              y: p.y + p.height - 10,
              vx: -4 + (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: ['#ffffff', '#f472b6', '#38bdf8', '#fbbf24'][Math.floor(Math.random() * 4)],
              size: Math.random() * 4 + 2,
              alpha: 0.9,
              life: 0,
              maxLife: 20,
              type: 'sparkle'
            });
          }

          // Land on ground
          if (p.y >= groundY - p.height) {
            p.y = groundY - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.isJumping = false;
          }
        }

        if (p.stumbleTimer > 0) {
          p.stumbleTimer -= dt;
        }

        // Move Rocks (60% faster scroll speed!)
        const scrollSpeedPx = width * 0.65 * speedMultiplier;
        for (let i = rocksRef.current.length - 1; i >= 0; i--) {
          const rock = rocksRef.current[i];
          if (!chestFoundMode) {
            rock.x -= scrollSpeedPx * dt;
          }

          // Collision check
          const rockBox = {
            x: rock.x + 12,
            y: groundY - rock.height + 12,
            w: rock.width - 24,
            h: rock.height - 12
          };

          const playerBox = {
            x: p.x + 15,
            y: p.y + 10,
            w: p.width - 30,
            h: p.height - 15
          };

          const isColliding =
            playerBox.x < rockBox.x + rockBox.w &&
            playerBox.x + playerBox.w > rockBox.x &&
            playerBox.y < rockBox.y + rockBox.h &&
            playerBox.y + playerBox.h > rockBox.y;

          if (isColliding && !rock.cleared && p.stumbleTimer <= 0) {
            p.stumbleTimer = 0.8;
            soundManager.playRockHit();
            p.vy = -7;
            p.isGrounded = false;
            rock.cleared = true;

            for (let k = 0; k < 12; k++) {
              particlesRef.current.push({
                x: playerBox.x + playerBox.w / 2,
                y: groundY - 10,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                color: '#78716c',
                size: Math.random() * 5 + 3,
                alpha: 1,
                life: 0,
                maxLife: 25,
                type: 'dust'
              });
            }
          }

          if (rock.x + rock.width < -80) {
            rocksRef.current.splice(i, 1);
          }
        }

        // Update Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const part = particlesRef.current[i];
          part.x += part.vx;
          part.y += part.vy;
          part.life++;
          part.alpha = 1 - part.life / part.maxLife;
          if (part.life >= part.maxLife) {
            particlesRef.current.splice(i, 1);
          }
        }

        if (chestAnimRef.current > 0) {
          chestAnimRef.current--;
        }
      }

      // 2. DRAW MORNING BACKGROUND requested by user: "sun, sky and could like morning"
      // Morning Sky Gradient (Bright Sky Blue to Soft Sunrise Warmth)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#38bdf8');    // Clear morning sky blue
      skyGrad.addColorStop(0.4, '#7dd3fc');  // Soft cyan
      skyGrad.addColorStop(0.75, '#bae6fd'); // Morning mist
      skyGrad.addColorStop(1, '#fed7aa');    // Warm golden sunrise glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, groundY);

      // Radiant Morning Sun
      const sunX = width * 0.78;
      const sunY = height * 0.22;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 110);
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.3, 'rgba(253, 224, 71, 0.85)');
      sunGlow.addColorStop(0.7, 'rgba(251, 146, 60, 0.35)');
      sunGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
      ctx.fill();

      // Morning Sun Inner Core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
      ctx.fill();

      // Drifting Morning Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      for (const cloud of clouds) {
        if (!isPausedRef.current) {
          cloud.x -= cloud.speed * dt;
          if (cloud.x < -200) cloud.x = width + 200;
        }

        const cx = cloud.x;
        const cy = cloud.y;
        const s = cloud.scale;

        ctx.beginPath();
        ctx.arc(cx, cy, 25 * s, 0, Math.PI * 2);
        ctx.arc(cx + 25 * s, cy - 10 * s, 32 * s, 0, Math.PI * 2);
        ctx.arc(cx + 60 * s, cy - 5 * s, 28 * s, 0, Math.PI * 2);
        ctx.arc(cx + 85 * s, cy, 22 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant Rolling Green Hills (slow parallax)
      const hillOffset = (distanceRef.current * 18) % width;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let hx = -width; hx < width * 2; hx += 160) {
        const px = hx - hillOffset;
        ctx.quadraticCurveTo(px + 80, groundY - 80, px + 160, groundY);
      }
      ctx.lineTo(width, groundY);
      ctx.closePath();
      ctx.fill();

      // Midground Morning Trees & Green Groves
      const midOffset = (distanceRef.current * 40) % width;
      ctx.fillStyle = '#16a34a';
      for (let tx = -width; tx < width * 2; tx += 200) {
        const px = tx - midOffset;
        // Tree trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 35, groundY - 50, 10, 50);
        // Foliage
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px + 40, groundY - 65, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground (Fresh Morning Meadow Path)
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#15803d'); // Rich grass green top
      groundGrad.addColorStop(0.12, '#854d0e'); // Warm soil earth
      groundGrad.addColorStop(0.4, '#713f12');
      groundGrad.addColorStop(1, '#3e240a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Lush green grass edge with highlights
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Morning Dew Drops & Little Meadow Flowers
      const groundScroll = (distanceRef.current * 65) % 80;
      for (let gx = -80; gx < width + 80; gx += 60) {
        // Morning flower petal
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(gx - groundScroll + 20, groundY + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        // Dew sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx - groundScroll + 45, groundY + 18, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. DRAW BIG ROCKS (Obstacles)
      for (const rock of rocksRef.current) {
        const rx = rock.x;
        const ry = groundY - rock.height;

        ctx.save();
        // Rock shadow on grass
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(rx + rock.width / 2, groundY + 5, rock.width * 0.55, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Big Rock Boulder
        const rockGrad = ctx.createLinearGradient(rx, ry, rx + rock.width, ry + rock.height);
        rockGrad.addColorStop(0, '#78716c');
        rockGrad.addColorStop(0.5, '#57534e');
        rockGrad.addColorStop(1, '#292524');
        ctx.fillStyle = rockGrad;
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(rx + 15, ry + rock.height);
        ctx.lineTo(rx + 6, ry + 28);
        ctx.lineTo(rx + 28, ry + 6);
        ctx.lineTo(rx + rock.width - 22, ry + 3);
        ctx.lineTo(rx + rock.width - 6, ry + 30);
        ctx.lineTo(rx + rock.width - 12, ry + rock.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Craggy Highlights & Moss
        ctx.fillStyle = '#4ade80'; // morning moss
        ctx.beginPath();
        ctx.ellipse(rx + 28, ry + 20, 10, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. DRAW CHEST (at target distance)
      if (chestFoundMode) {
        const chestX = width * 0.58;
        const chestY = groundY - 75;
        const shakeX = chestAnimRef.current > 0 ? (Math.random() - 0.5) * 8 : 0;
        const shakeY = chestAnimRef.current > 0 ? (Math.random() - 0.5) * 4 : 0;

        ctx.save();
        ctx.translate(chestX + shakeX, chestY + shakeY);

        // Radiant Morning Golden Aura
        const chestAura = ctx.createRadialGradient(42, 38, 10, 42, 38, 95);
        chestAura.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
        chestAura.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
        chestAura.addColorStop(1, 'transparent');
        ctx.fillStyle = chestAura;
        ctx.beginPath();
        ctx.arc(42, 38, 95, 0, Math.PI * 2);
        ctx.fill();

        // Chest Body
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(0, 26, 85, 48, 8);
        ctx.fill();
        ctx.stroke();

        // Chest Lid (opens progressively based on clicks)
        const lidLift = chestClicks * 4.5;
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(42, 26 - lidLift, 42, 20, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gold Straps
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(20, 26, 12, 48);
        ctx.fillRect(55, 26, 12, 48);

        // Ruby Keyhole Lock
        ctx.fillStyle = chestClicks >= 3 ? '#10b981' : '#e11d48';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(42, 40, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // 5. DRAW USER ART STRANGER (Running sprite vs Jumping sprite)
      ctx.save();
      ctx.translate(p.x, p.y);

      // Stumble red flash
      if (p.stumbleTimer > 0 && Math.floor(now / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Shadow on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(p.width / 2, p.height + 4, p.width * 0.4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const isJumping = !p.isGrounded;
      const activeSprite = isJumping ? jumpSpriteRef.current : runSpriteRef.current;

      // Draw User's Sprite Image
      if (activeSprite && activeSprite.complete && activeSprite.naturalWidth > 0) {
        // Slight bobbing when running
        const runBob = isJumping ? 0 : Math.sin(p.runFrame * 2) * 3;
        ctx.drawImage(activeSprite, 0, runBob, p.width, p.height);
      } else {
        // Fallback drawing if image still loading
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(10, 10, p.width - 20, p.height - 20);
      }

      ctx.restore();

      // 6. DRAW PARTICLES
      for (const part of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [chestFoundMode, speedMultiplier, targetDistanceCm]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none cursor-pointer"
      onClick={triggerJump}
    >
      {/* 2D Morning Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-20 font-sans">
        {/* Left: Pause, Restart, and Mute */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Pause Button for mobile & mouse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Pause game (ESC)"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              restartRunner();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute();
            }}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Center: Distance Progress (e.g. 54 / 100 cm) */}
        <div className="flex flex-col items-center bg-slate-900/90 border border-amber-400/50 rounded-2xl px-5 py-2 backdrop-blur-md shadow-2xl">
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-pink-300">
              {currentDistanceCm}
            </span>
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              / {targetDistanceCm} cm
            </span>
          </div>

          <div className="w-36 sm:w-44 h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400 transition-all duration-150 rounded-full"
              style={{ width: `${Math.min(100, (currentDistanceCm / targetDistanceCm) * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Level & Character Info */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-white/20 rounded-2xl px-3 py-1.5 backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black text-amber-300 tracking-wider uppercase">
              {difficulty.toUpperCase()} MODE
            </span>
          </div>

          {onOpenStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStory();
              }}
              className="px-3 py-2 bg-purple-900/90 hover:bg-purple-800 text-purple-200 hover:text-white rounded-xl text-xs font-bold border border-purple-400/40 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            >
              Story Mode
            </button>
          )}
        </div>
      </div>

      {/* Floating Jump Guide */}
      {jumpHintVisible && !chestFoundMode && !isPaused && (
        <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/95 border border-amber-400/60 text-white text-xs sm:text-sm font-black shadow-2xl animate-bounce">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>CLICK OR PRESS SPACE TO JUMP OVER THE BIG ROCKS!</span>
          </div>
        </div>
      )}

      {/* PAUSE MENU MODAL requested by user:
          "and if you click esc key or in a mobile it will hit the 'paused game [menu] [back to game]'" */}
      {isPaused && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none"
        >
          <div className="max-w-sm w-full bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            {/* Pause Header */}
            <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-2xl text-purple-300 mb-4 shadow-lg shadow-purple-900/50">
              ⏸️
            </div>

            <h2 className="text-3xl font-black text-white tracking-wider uppercase mb-2">
              PAUSED GAME
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mb-6">
              Take a breath! Your distance progress ({currentDistanceCm} cm) is safe.
            </p>

            <div className="w-full flex flex-col gap-2.5">
              {/* Back to Game */}
              <button
                onClick={togglePause}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>BACK TO GAME</span>
              </button>

              {/* Restart Level */}
              <button
                onClick={() => {
                  restartRunner();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Level</span>
              </button>

              {/* Menu */}
              {onReturnMenu && (
                <button
                  onClick={onReturnMenu}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Menu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chest Click Overlay when target distance reached */}
      {chestFoundMode && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 pointer-events-none">
          <div className="mt-20 flex flex-col items-center bg-slate-900/95 border-2 border-amber-400/90 rounded-3xl p-5 shadow-2xl text-center max-w-md pointer-events-auto">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{targetDistanceCm} cm Goal Reached!</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
              YOU FOUND THE CHEST!
            </h3>

            <p className="text-slate-300 text-xs sm:text-sm mb-4">
              Click the glowing chest <span className="text-amber-400 font-bold">5 times</span> to open and collect!
            </p>

            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                    chestClicks >= star
                      ? 'bg-amber-400 border-amber-300 text-slate-950 scale-110 shadow-lg shadow-amber-400/50'
                      : 'bg-slate-800 border-white/10 text-white/40'
                  }`}
                >
                  {chestClicks >= star ? '⭐' : star}
                </div>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleChestClick();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/40 active:scale-95 transition-all cursor-pointer"
            >
              {chestClicks >= 5 ? "CHEST COLLECTED!" : `CLICK CHEST (${chestClicks}/5)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
