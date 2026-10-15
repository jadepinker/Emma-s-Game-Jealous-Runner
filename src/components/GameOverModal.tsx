import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ShoppingBag, BookOpen, Trophy, Sparkles } from 'lucide-react';
import { PlayerStats } from '../types/game';
import emmaEvilImg from '../assets/story/emma_evil_after.png';

interface GameOverModalProps {
  stats: PlayerStats;
  highScore: number;
  totalCrystals: number;
  onRestart: () => void;
  onOpenShop: () => void;
  onOpenStory: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  totalCrystals,
  onRestart,
  onOpenShop,
  onOpenStory,
}) => {
  const isNewHighScore = stats.score >= highScore && stats.score > 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center"
      >
        {/* Evil Emma Avatar Banner */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 shadow-xl shadow-purple-900/50">
            <img
              src={emmaEvilImg}
              alt="Evil Emma"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-1 bg-purple-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-300 text-white shadow-md">
            Evil Emma
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          {isNewHighScore ? "NEW HIGH SCORE!" : "RUN CONCLUDED!"}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          “You think this stops me?! I'll be faster next time!”
        </p>

        {/* Score Display Card */}
        <div className="w-full bg-slate-950/70 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Final Score
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-purple-300 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance</span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">{stats.distance}m</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shards</span>
              <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">+{stats.crystals}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Combo</span>
              <span className="text-sm font-bold font-mono text-fuchsia-400 tabular-nums">{stats.maxCombo}x</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Best Score:</span>
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {Math.max(highScore, stats.score).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenShop}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Upgrades</span>
            </button>

            <button
              onClick={onOpenStory}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Story</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
