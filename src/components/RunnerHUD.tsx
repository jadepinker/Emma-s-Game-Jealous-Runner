import React from 'react';
import { Volume2, VolumeX, Pause, Zap, Shield, Sparkles } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface RunnerHUDProps {
  stats: PlayerStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onActivateRage: () => void;
  onRestart: () => void;
  onOpenStory: () => void;
}

export const RunnerHUD: React.FC<RunnerHUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onActivateRage,
  onRestart,
  onOpenStory,
}) => {
  const isRageReady = stats.rageCharge >= 100 && !stats.isRageActive;

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none z-10 font-sans">
      {/* Top Bar - Left, Center, and Right zones */}
      <div className="flex items-start justify-between gap-3 w-full">
        {/* Top-Left: Play / Story / Restart Controls (Directly matching user prompt requirement) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-900/40 border border-purple-400/50 flex items-center gap-2 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="Restart the run"
          >
            <span>RESTART</span>
          </button>

          <button
            onClick={onOpenStory}
            className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/10 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="Watch the Story Cutscene"
          >
            <span>Story Mode</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Top-Center: Score & Distance display */}
        <div className="flex flex-col items-center bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums">
              {stats.score.toLocaleString()}
            </span>
            <span className="text-[10px] text-white/50 uppercase font-bold">PTS</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-mono tabular-nums">{stats.distance}m</span>
            <span>·</span>
            <span className="text-amber-400 font-mono tabular-nums font-semibold">
              💎 {stats.crystals}
            </span>
          </div>

          {/* 100m Quest Target Indicator */}
          <div className="w-full mt-1.5 pt-1.5 border-t border-white/10 flex flex-col items-center">
            <div className="flex items-center justify-between w-full text-[10px] text-amber-300 font-bold">
              <span>FIND CHEST (100m)</span>
              <span className="font-mono">{Math.min(100, stats.distance)}/100m</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-200"
                style={{ width: `${Math.min(100, (stats.distance / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Right: Combo & Active Powerups */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Combo Multiplier */}
          {stats.combo > 1 && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-amber-500/30 animate-pulse">
              {stats.combo}x COMBO
            </div>
          )}

          {/* Active Powerup Timers */}
          <div className="flex flex-col gap-1 items-end">
            {stats.activePowerups.shield > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                <Shield className="w-3 h-3" />
                <span>SHIELD ACTIVE</span>
              </div>
            )}
            {stats.activePowerups.magnet > 0 && (
              <div className="flex items-center gap-1.5 bg-sky-950/90 border border-sky-500/40 text-sky-300 text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                <span>🧲 {Math.ceil(stats.activePowerups.magnet)}s</span>
              </div>
            )}
            {stats.activePowerups.multiplier > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/40 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                <span>✖️2 {Math.ceil(stats.activePowerups.multiplier)}s</span>
              </div>
            )}
            {stats.activePowerups.boost > 0 && (
              <div className="flex items-center gap-1.5 bg-fuchsia-950/90 border border-fuchsia-500/40 text-fuchsia-300 text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md animate-bounce">
                <span>⚡ BOOST {Math.ceil(stats.activePowerups.boost)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Area: Dark Rage Ultimate Activation Meter */}
      <div className="flex flex-col items-center max-w-sm mx-auto w-full mb-1 sm:mb-2 pointer-events-auto">
        {stats.isRageActive ? (
          <div className="w-full bg-fuchsia-950/90 border-2 border-fuchsia-400 rounded-xl p-2.5 flex items-center justify-between shadow-[0_0_30px_rgba(217,70,239,0.5)] animate-pulse">
            <div className="flex items-center gap-2 text-fuchsia-300 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-fuchsia-300" />
              <span>DARK FRENZY ACTIVE!</span>
            </div>
            <span className="font-mono font-bold text-white text-sm">
              {stats.rageTimeLeft.toFixed(1)}s
            </span>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Emma's Dark Surge</span>
              </span>
              <span className="text-white/60 font-mono font-bold">
                {Math.floor(stats.rageCharge)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isRageReady
                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 animate-pulse'
                    : 'bg-purple-600'
                }`}
                style={{ width: `${Math.min(100, stats.rageCharge)}%` }}
              />
            </div>

            {/* Activation Button */}
            {isRageReady && (
              <button
                onClick={onActivateRage}
                className="w-full mt-1 py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-lg shadow-fuchsia-900/50 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer animate-bounce"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>UNLEASH DARK FRENZY (PRESS E / TAP)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
