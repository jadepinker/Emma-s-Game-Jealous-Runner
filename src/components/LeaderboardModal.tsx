import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, X, Coins, Clock, Award, Sparkles, Filter } from 'lucide-react';
import { authService } from '../utils/authService';

interface LeaderboardModalProps {
  onClose: () => void;
}

interface LeaderboardItem {
  rank: number;
  username: string;
  avatar: string;
  badge: string;
  distance: number;
  coins: number;
  playtimeHours: number;
}

const GLOBAL_LEADERBOARD: LeaderboardItem[] = [
  { rank: 1, username: 'WhiteLilyMaster', avatar: '👑', badge: 'Season 1 Victor', distance: 250, coins: 4850, playtimeHours: 14.5 },
  { rank: 2, username: 'EmmaJealousSpeed', avatar: '🌸', badge: 'Agile Dasher', distance: 242, coins: 3920, playtimeHours: 11.2 },
  { rank: 3, username: 'StrangerRun', avatar: '✨', badge: 'Coin Collector', distance: 220, coins: 3100, playtimeHours: 9.8 },
  { rank: 4, username: 'CookieRunner77', avatar: '⚡', badge: 'Pro Runner', distance: 205, coins: 2600, playtimeHours: 8.1 },
  { rank: 5, username: 'ShadowSprinter', avatar: '🌙', badge: 'Story Master', distance: 195, coins: 2150, playtimeHours: 6.4 },
  { rank: 6, username: 'ForestDodge', avatar: '💎', badge: 'Rock Dodger', distance: 180, coins: 1800, playtimeHours: 5.0 },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<'distance' | 'coins' | 'playtime'>('distance');
  const currentUser = authService.getCurrentUser();

  const sortedBoard = [...GLOBAL_LEADERBOARD].sort((a, b) => {
    if (filter === 'distance') return b.distance - a.distance;
    if (filter === 'coins') return b.coins - a.coins;
    return b.playtimeHours - a.playtimeHours;
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md font-sans select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-lg w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Public Leaderboards</h2>
              <span className="text-[11px] text-slate-400">Global Rankings & Player Records</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 gap-2 my-3 shrink-0 text-xs font-bold">
          <button
            onClick={() => setFilter('distance')}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              filter === 'distance'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-400 hover:text-white'
            }`}
          >
            Top Distance (CM)
          </button>
          <button
            onClick={() => setFilter('coins')}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              filter === 'coins'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-400 hover:text-white'
            }`}
          >
            Total Coins 🪙
          </button>
          <button
            onClick={() => setFilter('playtime')}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              filter === 'playtime'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-400 hover:text-white'
            }`}
          >
            Playtime ⏱️
          </button>
        </div>

        {/* Rankings List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-1 custom-scrollbar">
          {sortedBoard.map((item, idx) => {
            const isTop3 = idx < 3;
            return (
              <div
                key={item.username}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isTop3
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-lg'
                    : 'bg-slate-950/50 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 font-mono font-black text-center ${
                    idx === 0 ? 'text-amber-400 text-base' :
                    idx === 1 ? 'text-slate-300 text-sm' :
                    idx === 2 ? 'text-amber-600 text-sm' : 'text-slate-500 text-xs'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-xl">{item.avatar}</span>
                  <div>
                    <span className="font-bold text-white text-xs block">{item.username}</span>
                    <span className="text-[10px] text-purple-300 font-mono">{item.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  {filter === 'distance' && (
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-300">
                      {item.distance} cm
                    </span>
                  )}
                  {filter === 'coins' && (
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-300">
                      {item.coins.toLocaleString()}c
                    </span>
                  )}
                  {filter === 'playtime' && (
                    <span className="font-mono font-black text-xs sm:text-sm text-purple-300">
                      {item.playtimeHours}h
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Your Record: <strong className="text-white font-mono">{currentUser?.stats.highScore || 0} pts</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
