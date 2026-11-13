import React from 'react';
import { MapThemeId } from '../types/game';

export interface MapThemeMeta {
  id: MapThemeId;
  name: string;
  seasonTag: string;
  description: string;
  accentText: string;
}

export const MAP_THEMES: Record<MapThemeId, MapThemeMeta> = {
  moonlit_meadow: {
    id: 'moonlit_meadow',
    name: 'Moonlit Silver Meadow',
    seasonTag: 'Episodes 1–4',
    description: 'Luminous silver moonlight over soft twilight hills and glowing meadow petals.',
    accentText: 'text-sky-300',
  },
  shadow_woods: {
    id: 'shadow_woods',
    name: 'Shadow Woods & Whispering Ruins',
    seasonTag: 'Episode 5+ · Chest Hunt',
    description: 'Ancient crooked trees and crumbling stone arches haunted by gilded chest wisps.',
    accentText: 'text-purple-300',
  },
  forgotten_castle: {
    id: 'forgotten_castle',
    name: 'Forgotten Castle Secret Room',
    seasonTag: 'Season 2',
    description: 'Moon-washed Gothic stained glass, stone colonnades, and flickering candelabrum embers.',
    accentText: 'text-amber-300',
  },
  void_citadel: {
    id: 'void_citadel',
    name: 'Corrupted Void Citadel',
    seasonTag: 'Season 3',
    description: 'Obsidian spires suspended beneath a swirling crimson-violet dimensional rift.',
    accentText: 'text-rose-300',
  },
};

interface StorySceneBackgroundProps {
  theme: MapThemeId;
  reduceMotion?: boolean;
}

/**
 * Rich layered CSS/SVG scenic backgrounds for Story Mode cutscenes
 */
export const StorySceneBackground: React.FC<StorySceneBackgroundProps> = ({
  theme,
  reduceMotion = false,
}) => {
  if (theme === 'moonlit_meadow') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Deep Twilight Silver-Indigo Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1026] via-[#19234f] to-[#12263a]" />

        {/* Silver Full Moon & Halo */}
        <div className="absolute top-6 right-[14%] w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-slate-50 via-sky-100 to-indigo-200 shadow-[0_0_90px_rgba(186,230,253,0.7)] opacity-95" />
        <div className="absolute -top-6 right-[10%] w-52 h-52 rounded-full bg-sky-300/10 blur-3xl" />

        {/* Twinkling Starfield */}
        {[
          { top: '10%', left: '12%', delay: '0s' },
          { top: '18%', left: '28%', delay: '0.6s' },
          { top: '12%', left: '48%', delay: '1.1s' },
          { top: '24%', left: '65%', delay: '0.3s' },
          { top: '8%', left: '78%', delay: '1.7s' },
          { top: '28%', left: '20%', delay: '1.4s' },
        ].map((s, idx) => (
          <div
            key={idx}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            className={`absolute w-1.5 h-1.5 rounded-full bg-sky-100 shadow-[0_0_8px_#e0f2fe] ${
              reduceMotion ? '' : 'animate-twinkle'
            }`}
          />
        ))}

        {/* Layered Silver Meadow Hills (SVG) */}
        <svg viewBox="0 0 1440 420" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-[58%]">
          <defs>
            <linearGradient id="meadowBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#263868" />
              <stop offset="100%" stopColor="#141e3c" />
            </linearGradient>
            <linearGradient id="meadowMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0f2537" />
            </linearGradient>
            <linearGradient id="meadowFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#164e4d" />
              <stop offset="100%" stopColor="#091f24" />
            </linearGradient>
          </defs>
          <path d="M0,180 Q320,90 720,165 T1440,140 L1440,420 L0,420 Z" fill="url(#meadowBack)" opacity="0.85" />
          <path d="M0,235 Q420,150 860,230 T1440,200 L1440,420 L0,420 Z" fill="url(#meadowMid)" opacity="0.92" />
          <path d="M0,295 Q360,245 780,295 T1440,275 L1440,420 L0,420 Z" fill="url(#meadowFront)" />
        </svg>

        {/* Floating Silver Fireflies */}
        {!reduceMotion &&
          [
            { bottom: '28%', left: '18%', delay: '0s' },
            { bottom: '36%', left: '42%', delay: '1.2s' },
            { bottom: '24%', left: '72%', delay: '0.7s' },
            { bottom: '40%', left: '84%', delay: '1.9s' },
          ].map((f, idx) => (
            <div
              key={idx}
              style={{ bottom: f.bottom, left: f.left, animationDelay: f.delay }}
              className="absolute w-2 h-2 rounded-full bg-cyan-200/80 shadow-[0_0_14px_#bae6fd] animate-float-slow"
            />
          ))}
      </div>
    );
  }

  if (theme === 'shadow_woods') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Eerie Twilight Forest Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0718] via-[#1b1035] to-[#0c1220]" />

        {/* Misty Violet Moonlight Wash */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[540px] h-64 bg-purple-600/20 blur-3xl rounded-full" />

        {/* Whispering Ruins & Twisted Shadow Woods SVG */}
        <svg viewBox="0 0 1440 500" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-[78%]">
          {/* Crumbling Stone Ruins Arches in Midground */}
          <g fill="#1e1b2e" opacity="0.85">
            <rect x="260" y="210" width="28" height="190" rx="2" />
            <rect x="380" y="230" width="26" height="170" rx="2" />
            <path d="M260,210 Q333,145 406,230 L380,235 Q333,175 288,215 Z" />
            <rect x="1020" y="190" width="32" height="210" rx="2" />
            <rect x="1150" y="220" width="28" height="180" rx="2" />
            <path d="M1020,190 Q1098,130 1178,220 L1150,224 Q1098,162 1052,196 Z" />
          </g>

          {/* Gnarled Shadow Trees Left & Right */}
          <path d="M0,500 L0,120 Q85,150 115,240 Q150,180 210,165 Q165,245 140,340 L175,500 Z" fill="#090612" />
          <path d="M1440,500 L1440,105 Q1340,145 1300,235 Q1255,175 1190,155 Q1255,230 1280,340 L1240,500 Z" fill="#090612" />

          {/* Forest Ground & Mist */}
          <path d="M0,360 Q480,330 960,365 T1440,345 L1440,500 L0,500 Z" fill="#0f0b1c" />
        </svg>

        {/* Golden & Violet Chest Hunt Wisps */}
        {!reduceMotion &&
          [
            { bottom: '32%', left: '25%', color: 'bg-amber-300', shadow: 'shadow-[0_0_16px_#fbbf24]' },
            { bottom: '42%', left: '55%', color: 'bg-purple-400', shadow: 'shadow-[0_0_16px_#c084fc]' },
            { bottom: '30%', left: '78%', color: 'bg-amber-300', shadow: 'shadow-[0_0_16px_#fbbf24]' },
          ].map((w, idx) => (
            <div
              key={idx}
              style={{ bottom: w.bottom, left: w.left, animationDelay: `${idx * 0.8}s` }}
              className={`absolute w-2.5 h-2.5 rounded-full ${w.color} ${w.shadow} animate-float-slow`}
            />
          ))}
      </div>
    );
  }

  if (theme === 'forgotten_castle') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Castle Stone Chamber Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#171224] via-[#201830] to-[#0f0c18]" />

        {/* Gothic Arched Stained-Glass Windows */}
        <div className="absolute inset-x-0 top-6 flex justify-around px-8 sm:px-20 opacity-75">
          {[0, 1, 2].map((win) => (
            <div
              key={win}
              className="w-24 sm:w-36 h-48 sm:h-64 rounded-t-full border-4 border-slate-800 bg-gradient-to-b from-indigo-900/70 via-amber-500/20 to-purple-950/60 shadow-[inset_0_0_30px_rgba(251,191,36,0.2)] relative overflow-hidden"
            >
              <div className="absolute inset-y-0 left-1/2 w-1 bg-slate-900/70 -translate-x-1/2" />
              <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-900/70" />
            </div>
          ))}
        </div>

        {/* Stone Pillars & Velvet Floor */}
        <div className="absolute inset-y-0 left-4 sm:left-12 w-10 sm:w-16 bg-gradient-to-r from-slate-950 via-slate-800/80 to-slate-950 border-x border-amber-500/10" />
        <div className="absolute inset-y-0 right-4 sm:right-12 w-10 sm:w-16 bg-gradient-to-r from-slate-950 via-slate-800/80 to-slate-950 border-x border-amber-500/10" />
        <div className="absolute bottom-0 inset-x-0 h-[28%] bg-gradient-to-b from-[#1e1429] to-[#0c0812] border-t border-amber-500/25" />

        {/* Warm Candelabra Glow */}
        <div className="absolute top-[28%] left-[20%] w-32 h-32 rounded-full bg-amber-500/15 blur-2xl" />
        <div className="absolute top-[28%] right-[20%] w-32 h-32 rounded-full bg-amber-500/15 blur-2xl" />
      </div>
    );
  }

  // void_citadel: Corrupted Void Citadel (Season 3)
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Corrupted Obsidian & Crimson-Violet Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a051d] via-[#2b0828] to-[#09040d]" />

      {/* Swirling Void Rift */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-44 rounded-full bg-gradient-to-r from-rose-600/35 via-fuchsia-600/40 to-violet-700/35 blur-2xl" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border-2 border-fuchsia-400/35 shadow-[0_0_60px_rgba(244,63,94,0.45)]" />

      {/* Jagged Obsidian Citadel Spires */}
      <svg viewBox="0 0 1440 420" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-[65%]">
        <polygon points="80,420 130,110 190,420" fill="#12061c" />
        <polygon points="240,420 295,160 360,420" fill="#1b0926" />
        <polygon points="1080,420 1140,145 1210,420" fill="#1b0926" />
        <polygon points="1260,420 1315,95 1380,420" fill="#12061c" />
        <path d="M0,330 L360,310 L720,340 L1080,305 L1440,335 L1440,420 L0,420 Z" fill="#0d0414" />
      </svg>

      {/* Floating Void Rune Shards */}
      {!reduceMotion &&
        [
          { top: '30%', left: '22%', delay: '0s' },
          { top: '22%', left: '75%', delay: '0.9s' },
          { top: '42%', left: '85%', delay: '1.5s' },
        ].map((shard, idx) => (
          <div
            key={idx}
            style={{ top: shard.top, left: shard.left, animationDelay: shard.delay }}
            className="absolute w-3 h-5 rotate-12 bg-gradient-to-b from-rose-400 to-purple-600 opacity-75 shadow-[0_0_12px_#f43f5e] animate-float-slow"
          />
        ))}
    </div>
  );
};

/**
 * Shared 2D Canvas scenic background renderer for RunnerCanvas
 */
export function drawRunnerMapBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  groundHeight: number,
  mapTheme: MapThemeId,
  distance: number,
  timer: number
) {
  if (mapTheme === 'moonlit_meadow') {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#090e24');
    skyGrad.addColorStop(0.5, '#192652');
    skyGrad.addColorStop(0.9, '#1c3a57');
    skyGrad.addColorStop(1, '#102a38');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Silver Full Moon
    ctx.save();
    const moonGrad = ctx.createRadialGradient(width * 0.82, 72, 6, width * 0.82, 72, 85);
    moonGrad.addColorStop(0, '#f8fafc');
    moonGrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.7)');
    moonGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(width * 0.82, 72, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Twinkling stars
    ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 137) % width);
      const sy = 18 + ((i * 53) % (groundY * 0.45));
      const r = 1 + ((Math.sin(timer * 0.05 + i) + 1) * 0.7);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Parallax Silver Meadow Hills
    const hillOffset = (distance * 6) % 320;
    ctx.fillStyle = '#182e4a';
    for (let hx = -hillOffset - 160; hx < width + 200; hx += 320) {
      ctx.beginPath();
      ctx.arc(hx + 160, groundY + 25, 190, Math.PI, 0);
      ctx.fill();
    }

    // Silver-green meadow grass ground
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#0f766e');
    groundGrad.addColorStop(0.2, '#115e59');
    groundGrad.addColorStop(1, '#042f2e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, groundHeight);

    ctx.fillStyle = '#5eead4';
    for (let gx = 0; gx < width; gx += 22) {
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.lineTo(gx + 5, groundY - 6);
      ctx.lineTo(gx + 10, groundY);
      ctx.fill();
    }
    return;
  }

  if (mapTheme === 'shadow_woods') {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#090514');
    skyGrad.addColorStop(0.55, '#1e1038');
    skyGrad.addColorStop(1, '#120d21');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Whispering Ruins Stone Arches in Parallax
    const ruinSpacing = 290;
    const ruinOffset = (distance * 9) % ruinSpacing;
    ctx.fillStyle = 'rgba(46, 35, 74, 0.75)';
    for (let rx = -ruinOffset - 80; rx < width + 120; rx += ruinSpacing) {
      ctx.fillRect(rx, groundY - 115, 18, 115);
      ctx.fillRect(rx + 66, groundY - 95, 18, 95);
      ctx.fillRect(rx - 4, groundY - 122, 92, 12);
    }

    // Gnarled Shadow Trees
    const treeSpacing = 165;
    const treeOffset = (distance * 14) % treeSpacing;
    for (let tx = -treeOffset - 60; tx < width + 100; tx += treeSpacing) {
      ctx.fillStyle = '#1f162b';
      ctx.fillRect(tx + 22, groundY - 78, 15, 78);
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(tx + 29, groundY - 102, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#3b0764');
    groundGrad.addColorStop(0.18, '#1e1b2e');
    groundGrad.addColorStop(1, '#090514');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, groundHeight);
    return;
  }

  if (mapTheme === 'forgotten_castle') {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#130f20');
    skyGrad.addColorStop(0.6, '#231938');
    skyGrad.addColorStop(1, '#110c1c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Arched Gothic Stained Glass Windows scrolling
    const winSpacing = 220;
    const winOffset = (distance * 8) % winSpacing;
    for (let wx = -winOffset - 80; wx < width + 100; wx += winSpacing) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.16)';
      ctx.beginPath();
      ctx.arc(wx + 35, groundY - 110, 32, Math.PI, 0);
      ctx.lineTo(wx + 67, groundY - 25);
      ctx.lineTo(wx + 3, groundY - 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#4c1d95');
    groundGrad.addColorStop(0.15, '#2e1065');
    groundGrad.addColorStop(1, '#090514');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, groundHeight);
    return;
  }

  // void_citadel
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#17041a');
  skyGrad.addColorStop(0.55, '#3b0734');
  skyGrad.addColorStop(1, '#0b0310');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Swirling Crimson-Violet Void Rift
  ctx.save();
  const riftGrad = ctx.createRadialGradient(width * 0.5, 80, 10, width * 0.5, 80, 140);
  riftGrad.addColorStop(0, 'rgba(244, 63, 94, 0.55)');
  riftGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
  riftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = riftGrad;
  ctx.beginPath();
  ctx.arc(width * 0.5, 80, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Obsidian Spires
  const spireSpacing = 180;
  const spireOffset = (distance * 12) % spireSpacing;
  ctx.fillStyle = '#170720';
  for (let sx = -spireOffset - 60; sx < width + 100; sx += spireSpacing) {
    ctx.beginPath();
    ctx.moveTo(sx, groundY);
    ctx.lineTo(sx + 25, groundY - 125);
    ctx.lineTo(sx + 50, groundY);
    ctx.closePath();
    ctx.fill();
  }

  const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
  groundGrad.addColorStop(0, '#be123c');
  groundGrad.addColorStop(0.12, '#3b0764');
  groundGrad.addColorStop(1, '#09020f');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, width, groundHeight);
}
