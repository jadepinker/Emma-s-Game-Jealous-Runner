import React from 'react';
import { motion } from 'motion/react';
import { X, Settings, Volume2, VolumeX, RotateCcw, ShieldAlert, Sparkles, Check, Trash2 } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { GameDifficulty } from './RunnerCanvas';

interface SettingsModalProps {
  isMuted: boolean;
  onToggleMute: () => void;
  unlockedLevels: GameDifficulty[];
  currentDifficulty: GameDifficulty;
  onSelectDifficulty: (diff: GameDifficulty) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isMuted,
  onToggleMute,
  unlockedLevels,
  currentDifficulty,
  onSelectDifficulty,
  onResetProgress,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-md w-full bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-black text-white tracking-tight">Game Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="mb-5 bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Game Audio & SFX</span>
              <span className="text-xs text-slate-400">
                {isMuted ? "Sound is muted" : "Low-latency WebAudio enabled"}
              </span>
            </div>
          </div>

          <button
            onClick={onToggleMute}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              isMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Active Difficulty Level
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(['story', 'medium', 'hard', 'pro'] as GameDifficulty[]).map((level) => {
              const isUnlocked = unlockedLevels.includes(level);
              const isSelected = currentDifficulty === level;

              return (
                <button
                  key={level}
                  disabled={!isUnlocked}
                  onClick={() => {
                    soundManager.playLaneSwitch();
                    onSelectDifficulty(level);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    !isUnlocked
                      ? 'opacity-35 bg-slate-950/40 border-white/5 cursor-not-allowed'
                      : isSelected
                      ? 'border-purple-400 bg-purple-950/60 shadow-lg shadow-purple-900/40 ring-1 ring-purple-400 cursor-pointer'
                      : 'border-white/10 bg-slate-950/60 hover:border-white/20 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {level}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {level === 'story' ? '100 cm · Normal' :
                     level === 'medium' ? '150 cm · Faster' :
                     level === 'hard' ? '200 cm · Rapid' : '250 cm · Pro'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts & Guide */}
        <div className="mb-6 bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 block mb-1">
            Keyboard & Mobile Controls
          </span>
          <div className="flex justify-between text-slate-300">
            <span>Jump over Big Rocks:</span>
            <span className="font-mono font-bold text-amber-300">SPACE / Tap</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Pause Game:</span>
            <span className="font-mono font-bold text-amber-300">ESC / Pause btn</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Fast Forward Story:</span>
            <span className="font-mono font-bold text-amber-300">Skip &gt;&gt;</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Direct to Runner:</span>
            <span className="font-mono font-bold text-amber-300">Skip &gt;&gt;&gt;</span>
          </div>
        </div>

        {/* Reset Progress Danger Zone */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm("Reset all unlocked difficulties and start fresh?")) {
                onResetProgress();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Unlocked Levels</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
